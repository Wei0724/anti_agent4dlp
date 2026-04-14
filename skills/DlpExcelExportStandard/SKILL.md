---
name: DlpExcelExportStandard
description: DLP 專案 Oracle Forms 翻寫至 Excel (NPOI + JSON_OBJECT_T) 的開發規範。
---

# DLP Excel 匯出開發規範 (DlpExcelExportStandard)

本 Skill 旨在規範將 Oracle Forms 報表邏輯翻寫至 **C# NPOI** 與 **SQL JSON_OBJECT_T** 結構的標準流程，確保不同模組間的匯出邏輯具備一致性。

## 1. 職責架構 (Overall Architecture)

| 層級 | 核心職責 | 關鍵技術 |
| :--- | :--- | :--- |
| **SQL (Oracle)** | 資料計算、業務過濾、多維資料結構化。 | `JSON_OBJECT_T`, `SYS_REFCURSOR` |
| **C# (Service)** | 負責業務邏輯調度與 DTO 傳遞。命名必須對應 **功能 ID** (如 `CAR110Service`)。 | `Dependency Injection` |
| **C# (Repository)** | 檔案格式定義、樣式管理、表格佈局。命名必須對應 **主體資料表** (如 `CA050Repository`)。 | `NPOIExcel`, `JsonConvert` |
| **Frontend (Service)** | 參數傳遞、檔案流接收、異常訊息處理。 | `callApi`, `Blob` |

## 2. SQL 實作規範

### 2.1 輸入參數
統一由 `vJson` CLOB 傳入，使用 `JSON_TABLE` 解析：
```sql
CURSOR vParamsObj IS
SELECT * FROM JSON_TABLE(vJson, '$' COLUMNS (
    LOT_NO PATH '$.LOT_NO',
    ...
)) json_data;
```

### 2.2 資料打包模式
*   **模式 A：單一 JSON 串 (適合巢狀資料)**
    將明細打包為 JSON 字串，放入單一 Cursor 回傳給 C#。
*   **模式 B：多重 Cursor (適合固定版面)**
    回傳多個 `OUT SYS_REFCURSOR`。
    - `vDataInfo`: 單行 DTO 參數 (標題、統計值、備註)。
    - `vDataInfo1/2`: 固定內容清單。
    - `vDataInfo3`: 明細資料 JSON 串。

## 3. C# NPOI 實作規範

### 3.1 基礎流程
1. 使用 `InitializeWorkbook(ExcelFileType.XLS)` 初始化。
2. 使用 `SetFontStyle` 與 `SetCellStyle` 建立統一的風格。
3. **定位填值**：使用 `SetNomalValue(x, y, value)` 處理固定位置的標題、頁碼或參數。
4. **表格生成**：定義 `ExcelConfig` 列表，使用 `_npoi.Generate(...)` 批次產出明細。

### 3.2 佈局範例 (Source of Truth)
參考 [PM540Repository.cs](file:///d:/dlp-develop/DLP.Model/DLP.Model.PM/Repositories/DG/PM540Repository.cs) 的 `PMR180_EXEExpExcel` 實作：
```csharp
// 固定填值
this.SetNomalValue(4, 0, "PACKING LIST");
// 條件式文字
if (sublotno == "KS") this.SetNomalValue(9, 2, "CONTRACT NO.");

// 明細產出
_npoi.Generate(excelConfigList, dt, currentRowIndex);
```

## 4. 前端調用規範 (Standard Pattern)

必須對應標竿模組 `MPR240` 的呼叫模式，具備偵測後端業務報錯的能力。

### 4.1 基礎調用法
```typescript
private _callApi(action: string, payload: any, options?: any) {
    // 參數: Module, SubModule (包含環境與路徑), Action, Payload, Options
    return this._api.callApi('CA', 'VN/CAR110', action, payload, options);
}
```

### 4.2 Excel 匯出與錯誤攔截
當後端業務報錯時（如資料不全），後端會回傳 JSON，而前端預期是 Blob。必須進行類型攔截：

```typescript
public exportExcel = () => {
    const payload = this._state.formRefs.formData;
    this._callApi('ExportExcel', { json: JSON.stringify(payload) }, { responseType: 'blob' })
        .subscribe((result: any) => {
            // [關鍵] 判斷是否為後端報錯回傳的 JSON
            if (result?.type === 'application/json') {
                const response = new Response(result);
                response.json().then(json => {
                    if (json.ErrMsg) this._noticeService.showWarning(json.ErrMsg);
                });
            } else {
                // 正常檔案位元組流下載
                const blob = new Blob([result], { type: this._webHandle.fileContentType.XLS.contentType });
                this._pubFunction.saveFile(blob, 'FileName');
            }
        });
}
```

## 5. 檢查清單 (Checklist)
- [ ] SQL 是否已將複雜運算完成（非 C# 處理）？
- [ ] C# 是否使用了 `SetNomalValue` 進行絕對位置排版？
- [ ] 前端是否能正確顯示 SQL 傳回的錯誤代碼？
