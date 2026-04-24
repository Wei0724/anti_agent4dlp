---
name: OracleExcelMigration
description: 專指針對 Oracle Forms 遷移至 Angular/C# 架构下 Excel 匯出邏輯的開發規範。包含三種核心產出模式（JSON 封裝、格子填值、標準清單），並提供樣式設置、合併儲存格與代碼模板。
---

# Oracle Excel Migration Skill (v2.2.1 - 強化導出與多元報錯版)

此 Skill 旨在指導開發者如何將舊版 Oracle Forms 的 Excel 匯出邏輯（通常使用 `CLIENT_TEXT_IO` 或 `TEXT_IO`）遷移至基於 **NPOI + PL/SQL** 的 Web 架構。

## 1. 核心開發架構 (Architecture)

遷移後的 Excel 產出遵循以下分層原則：

- **資料庫 (Database - PL/SQL)**: 負責複雜的資料運算、條件過濾、麥頭抓取與 JSON 封裝。
- **後端 (Backend - C# WebAPI)**: 負責渲染 (NPOI)、**強健性錯誤檢查**、與流傳輸。
- **前端 (Frontend - Angular)**: 負責參數封裝、加載管理 (`AppLoaderService`)、Blob 封裝與檔案儲存。

## 2. 三種核心遷移模式 (Pattern Selection)

| 模式 | 名稱 | 使用時機 | 技術特點 |
| :--- | :--- | :--- | :--- |
| **Pattern A** | **JSON 叢集模式** | 報表包含多個不連續的統計塊、分段標題或多個子表。 | SQL 使用 `JSON_OBJECT_T` 封裝，C# 反序列化後逐段印出。 |
| **Pattern B** | **精準座標填值** | 高擬真報表，需 100% 還原原廠格式、列印標籤、特定位置簽核欄。 | 使用 `_npoi.SetNomalValue(row, col, value)` 或 `SetRangeValue` 指定位填值。 |
| **Pattern C** | **標準展平清單** | 典型的 DataGrid 匯出，用於數據分析、Raw Data 導出。 | SQL 返回 `SYS_REFCURSOR`，C# 使用 `ExcelConfig` 定義映射後一次性 `Generate`。 |

## 3. 關鍵開發規範 (Standard Practices)

### 3.1 C# Repository: 強健性錯誤防護 (Early Exit)
執行預存程序後，必須優先檢查錯誤，避免在非法數據下執行 NPOI 渲染。

```csharp
public YourDTO ExportExcel(YourDTO dto)
{
    // 1. 執行預存程序
    dto.dsResult = oracleDLP.ExecProcedureDataSet("PACKAGE.PROCEDURE", al);
    
    // 2. 檢查系統錯誤
    dto.ErrMsg = oracleDLP.ErrMsg;

    // 3. 檢查邏輯錯誤 (例如 Procedure 內部回傳的 ErrorMsg 欄位)
    DataRow? dr = (dto?.dsResult?.Tables?[0]?.Rows.Count > 0) ? dto?.dsResult?.Tables?[0]?.Rows?[0] : null;
    var errMsg = (dr != null && dr.Table.Columns.Contains("ErrorMsg")) ? dr["ErrorMsg"]?.ToString() : "";

    // 4. Early Exit: 若有錯誤則直接 MergeResult 返回
    if (!string.IsNullOrWhiteSpace(dto.ErrMsg) || !string.IsNullOrWhiteSpace(errMsg))
    {
        return MergeResult(dto);
    }
    
    // --- 之後才進入 NPOI 初始化 ---
    this._npoi.InitializeWorkbook(ExcelFileType.XLSX);
    // ... 略
}
```

### 3.2 C# Controller: 標準異步流與二次錯誤檢查
必須使用 `GetExcelStream` 並搭配二段式錯誤檢查，確保錯誤時回傳 JSON 而非流。

```csharp
[HttpPost]
public async Task<IActionResult> ExportExcel(YourDTO dto)
{
    var report = _service.ExportExcel(dto);
    
    // [標準規範] 二次錯誤檢查
    DataRow? dr = null;
    if (report?.dsResult?.Tables?[0]?.Rows.Count > 0)
        dr = report?.dsResult?.Tables?[0]?.Rows?[0];

    var errMsg = (dr != null && dr.Table.Columns.Contains("ErrorMsg")) ? dr["ErrorMsg"]?.ToString() : "";

    // 若系統 ErrMsg 或 數據 ErrorMsg 有值，則回傳 Ok(report) 以便前端解析 JSON
    if (!string.IsNullOrWhiteSpace(report.ErrMsg) || !string.IsNullOrWhiteSpace(errMsg))
    {
        return Ok(report);
    }
    
    return File(await report.npoi.GetExcelStream("報表名稱"), 
                report.ExcelFileType == ExcelFileType.XLSX ? Const.XLSX : Const.XLS);
}
```

### 3.3 Angular Service: 多元報錯攔截機制 (Recommended)
前端必須處理 `blob` 響應，並使用 `isEmptyValue` 分流攔截 `ErrMsg` 與 `ErrorMsg` 報錯。

```typescript
import { isEmptyValue } from '@shared/utils';

public callExcel = (): void => {
  const fileName = '報表名稱';
  const payloadData = { ...this._state.formRefs.formData, ReportName: fileName };

  this._loader.open();

  this._api.callApi('Module', 'ProgramID', 'ExportExcel', payloadData, { responseType: 'blob' })
    .subscribe((result) => {
      this._loader.close();

      // 檢查回傳類型是否為 JSON (代表後端報錯)
      if (result?.type === 'application/json') {
        const response = new Response(result);
        response.json().then((result) => {
          if (result.ErrMsg) {
            this._noticeService.showWarning(result.ErrMsg);
          } else if (!isEmptyValue(result.ErrorMsg)) {
            this._noticeService.showWarning(result.ErrorMsg);
          }
        });
      } else {
        const blob: any = new Blob([result], {
          type: this._webHandleService.fileContentType.XLSX.contentType
        });
        this._pubFunctionService.saveFile(blob, payloadData.ReportName);
      }
    });
};
```
### 3.4 PL/SQL: 標準異常處理 (Exception Handling)
預存程序必須包含統一的 `EXCEPTION` 區塊，以確保錯誤能被 C# 正確擷取。

```sql
PROCEDURE PC_YOUR_EXPORT (
    ...
    vResult OUT VARCHAR2,
    vExcelData OUT SYS_REFCURSOR
) IS
BEGIN
    OPEN vExcelData FOR SELECT ...;
    vResult := '1';
EXCEPTION
    WHEN OTHERS THEN
        -- [標準規範] 發生錯誤時的回傳與拋出
        vResult := '-1';
        RAISE_APPLICATION_ERROR(-20000, SUBSTRB(SQLERRM, 1, 300));
        ROLLBACK;
END;
```

## 5. 樣式設置 (Styling)

### 5.1 合併儲存格
```csharp
// 參數: 開始行, 開始列, 結束行, 結束列, 是否合併, 值, 樣式
this._npoi.SetRangeValue(startRow, startCol, endRow, endCol, true, "標題值", style);
```

### 5.2 顏色定義
```csharp
var style = _npoi.SetCellStyle(new CellStyleDTO() {
    Color = IndexedColors.Yellow.Index, // 背景色
    FontStyle = new FontStyleDTO() { FontColor = IndexedColors.Red.Index } // 字體色
});
```

## 6. 遷移分析標誌 (Migration Flags)
若 FMB 當中出現以下特徵，應優先套用本 Skill：
- `CLIENT_TEXT_IO.PUT_LINE` 且包含 `CHR(9)` (Tab鍵) -> **Pattern C** (標準清單)。
- `TEXT_IO` 大量寫死固定座標 (Row/Col) 輸出 -> **Pattern B** (座標填值)。
- 多個 Cursor 依序輸出至同一個檔案 -> **Pattern A** (JSON 叢集)。
