---
name: DlpExcelExportStandard
description: DLP 專案 Oracle Forms 翻寫至 Excel (NPOI + JSON_OBJECT_T) 的開發規範。
---

# DLP Excel 匯出開發規範 (DlpExcelExportStandard)

本 Skill 旨在規範將 Oracle Forms 報表邏輯翻寫至 **C# NPOI** 與 **SQL JSON_OBJECT_T** 結構的標準流程，確保不同模組間的匯出邏輯具備一致性。

## 1. 職責架構 (Overall Architecture)

| 層級 | 核心職責 | 關鍵技術 | 關鍵路徑 (範例) |
| :--- | :--- | :--- | :--- |
| **SQL (Oracle)** | 資料計算、業務過濾、多維資料結構化。 | `JSON_OBJECT_T`, `SYS_REFCURSOR` | `DLP.SQL\[地區]\DDL\[模組]\` |
| **C# (Service)** | **功能的實體類別**。專職負責 Excel (NPOI) 排版邏輯之調度。命名必須對應 **功能 ID** (如 `CAR320Service`)。 | `Dependency Injection` | `DLP.Model.CATypes\Services\[地區]\` |
| **C# (Repository)** | **資料表的主體 Repository**。負責 NPOI 佈局、樣式管理、SP 調用。命名必須對應 **主體資料表** (如 `CA090Repository`)。 | `NPOIExcel`, `JsonConvert` | `DLP.Model.[模組]\Repositories\[地區]\` |
| **Frontend (Service)** | 介面邏輯、參數傳遞、檔案流接收、異常訊息處理。 | `callApi`, `Blob` | `ClientApp\src\app\views\[模組]\[地區]\` |

> [!IMPORTANT]
> **後端 C# 檔案放置與設計規範 (Mandatory Rule)**:
> 1.  **Service (功能導向)**: 
>     - **位置**: 必須統一放置於 **`DLP.Model.CATypes`** 專案之 `Services` 目錄中。
>     - **設計**: 採 **實體類別 (Concrete Class)** 模式 (如 `CAR320Service`)，直接注入 Controller。**嚴禁** 額外定義 Service 介面。
> 2.  **Repository (資料表導向)**: 
>     - **位置**: 實作檔案應放置於 **對應的業務模組專案** 中 (例如：`DLP.Model.CA` 或 `DLP.Model.AP`)。
>     - **設計**: 必須依「主體資料表」命名 (如 `CA090Repository`)。
>     - **介面**: Repository 的介面 (如 `ICA090Repository`) 則須定義於 **`DLP.Model.CATypes`** 專案之 `Interface` 目錄中，以滿足跨專案依賴注入。

> [!CAUTION]
> **C# API 使用限制 (Exclusive for Excel)**:
> **C# 端 (Controller/Service/Repository) 的存在僅限於處理 Excel (NPOI) 排版與檔案流生成。**
> 
> **嚴禁** 為以下功能建立自定義 C# API，必須由前端透過 `callSpDataSet` 或 `callSp` 直接調用 SQL：
> 1. **網格查詢 (Queries)**
> 2. **開窗查詢 (LOV)**
> 3. **商業邏輯檢查 (Validation)**
> 4. **初始化資料 (Init Data/Default Values)**

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

## 5. 專案解耦與 DI 註冊規範

### 5.1 Service vs Repository
*   **Service (位於 CATypes)**: 應保持輕量，僅處理權限檢查、參數組裝及調用 Repository。
*   **Repository (位於 [模組] 專案，如 CA, AP)**: 封裝所有 NPOI 邏輯與 SQL Procedure 調用。
*   **介面化**: 為了遵循專案架構，Repository 應實作對應介面（如 `ICA050Repository`），並將介面定義於 `DLP.Model.CATypes\Interface\[地區]`。

### 5.2 自動註冊機制 (Dependency Injection)
專案採用 Assembly 掃描進行自動註冊。新增 Service 時：
1. 確認檔案位於 `DLP.Model.CATypes\Services\` 下的正確地區目錄（DG/TC/VN/VS）。
2. 使用正確的命名空間（例如：`namespace DLP.Model.CATypes.Services.[地區]`）。
3. **嚴禁** 修改 `Startup.cs` 或 `ServiceExtensions.cs` 來進行單一註冊，除非該服務不符合自動掃描規範。

## 6. 檢查清單 (Checklist)
- [ ] C# Service 是否已放置於 `DLP.Model.CATypes` 專案目錄？
- [ ] C# Repository 是否已對接介面並位於對應的實體模組專案目錄（如 `DLP.Model.[模組]`）？
- [ ] SQL 是否已將複雜運算完成（非 C# 處理）？
- [ ] C# 是否使用了 `SetNomalValue` 進行絕對位置排版？
- [ ] 前端是否能正確顯示 SQL 傳回的錯誤代碼？
