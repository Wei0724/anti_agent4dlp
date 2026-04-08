---
name: DlpBackendSqlStandard
description: DLP 專案後端 PL/SQL (Oracle) 開發與優化規範。
---

# DLP 後端 SQL 開發規範 (DlpBackendSqlStandard)

本 Skill 旨在規範 DLP 專案中 Oracle Package、Procedure 及 Function 的編寫標準，確保後端邏輯的可維護性、一致性及與前端的高效對接。

> [!IMPORTANT]
> ## 強制檢索協議 (Mandatory Retrieval Protocol)
> 在進行任何後端開發或修正前，**必須** 先針對任務需求，呼叫 `view_file` 讀取並驗證以下資源文件：
> 1. [資源範本：SQL 結構與解析模式 (resources/templates.sql)](resources/templates.sql)
> 2. [標竿範例：PK_AP_APU030.sql (D:/dlp-develop/DLP.SQL/VN/DDL/AP/PK_AP_APU030.sql)](file:///D:/dlp-develop/DLP.SQL/VN/DDL/AP/PK_AP_APU030.sql)
> **未執行讀取動作即產出代碼將視為任務失敗。**

## 0. 避雷檢查清單 (Quick Checkpoints)
- [ ] **決定性排序**：`vSQLStmt` 是否將「預設排序欄位」**串接**在 `SortCondition` 之後？(不可替代)
- [ ] **SQLERRM 賦值**：是否已先賦值給變數，且 **未** 直接寫在 `SELECT` 子句中？
- [ ] **註解長度**：分隔線是否為正確的 **76 個虛線**？
- [ ] **業務代碼**：阻擋邏輯是否採用負數代碼且 **無** 中文 `RES_MSG`？
- [ ] **Spec 清空**：Package Spec 是否已移除所有文字註解？

## 目錄 (Table of Contents)
- [1. 核心結構與命名規範](#1-核心結構與命名規範-core-structure)
- [2. 標準註解區塊 (Documentation Blocks)](#2-標準註解區塊-documentation-blocks)
- [3. JSON 參數解析 (JSON Parsing)](#3-json-參數解析-json-parsing)
- [4. 錯誤處理與回傳協議 (1/-1/-N Rule)](#4-錯誤處理與回傳協議-1-1-n-rule)
- [5. 邏輯優化規範 (Logic Optimization)](#5-邏輯優化規範-logic-optimization)
- [6. 新刪修程序模式 (CRUD Procedure Patterns)](#6-新刪修程序模式-crud-procedure-patterns)
- [7. 避雷檢查清單 (Checkpoints)](#7-避雷檢查清單-checkpoints)
- [8. 參考標竿 (Source of Truth)](#8-參考範例-source-of-truth)

---

## 1. 核心結構與命名規範 (Core Structure)

### 1.1 Package 結構規範
*   **規格 (Specification)**：
    - **禁止包含註解**：僅宣告公用程序與函數的簽章 (Signature)。
*   **本體 (Body)**：
    - **私有宣告**：私有程序或函數應置於本體最上方進行 Forward Declaration。

### 1.2 命名規範 (Naming Conventions)
所有的程序 (Procedure) 必須嚴格遵守以下命名格式：
- **格式**: `PC_[模組代號]_[動作]_[操作對象]`
- **範例 (查詢)**: `PC_APB111_QUERY_AP110` (APB111 模組查詢 AP110 檔案)
- **範例 (執行)**: `PC_APB111_CLOSE_ACCOUNT` (APB111 模組執行關帳動作)
- **範例 (LOV)**: `PC_APB111_LOV_PROJECT` (APB111 模組的專案彈窗查詢)

> [!IMPORTANT]
> **禁止使用簡寫**: 不可以使用如 `PC_QUERY_AP110` 這種省略模組 ID 的寫法，這會導致跨模組時的命名衝突。

---

## 2. 標準註解區塊 (Documentation Blocks)

每一支程序或函數（包含私有）的前方必須包含嚴格格式的註解區塊：

```sql
/* ----------------------------------------------------------------------------
--   名稱: [Procedure/Function Name]
--   功能說明: [Description]
--   輸入資料: 
--   注意事項: 
--   原設計者: WEI_PAN
--   設立日期: [YYYY/MM/DD]
--   ------------------------ 異動紀錄明細 ---------------------------------
--  異動日期  異動者    異動說明
*/
```

> [!IMPORTANT]
> **註解規範**:
> - `輸入資料:` 與 `注意事項:` 後面必須保持為 **空值** (Empty)，詳細參數定義應直接體現於 `JSON_TABLE` 的解析邏輯中。
*   **分隔線**：使用 `/* ` 加上 76 個虛線 `----------------------------------------------------------------------------`。
*   **對齊**：所有內容行以 `--   ` (虛線虛線空格空格) 開頭。

---

## 3. JSON 參數解析 (JSON Parsing)

*   **輸入介面**：統一使用 `vJsonData CLOB` 作為參數傳入。
*   **解析方式**：使用 `CURSOR` 配合 `JSON_TABLE` 進行解析。
*   **LOV 規範**：LOV 程序應具備分頁與過濾能力，參數包含 `StartRow`, `EndRow`, `FilterCondition`, `SortCondition` 等。
*   [範例參考 (resources/templates.sql:L9)](resources/templates.sql#L9)

---

## 4. 錯誤處理與回傳協議 (1/-1/-N Rule)

*   **成功**：返回 `RES_CODE = '1'`。除非必要，否則不需回傳 `RES_MSG`。
*   **系統異常**：在 `WHEN OTHERS` 中返回 `RES_CODE = '-1'` 且 `RES_MSG = SQLERRM`。
*   **業務邏輯阻擋 (Negative Codes)**：
    - 回傳負數代碼：`'-2'`, `'-3'`, `'-4'`...
    - **禁止**在 `RES_MSG` 中回傳中文（由前端依據代碼轉換）。
    - **必須**在 SQL 代碼旁邊以註解方式標註原始中文訊息（例如：`-- APM00008 請選擇資料`）。
*   **直接跳轉模式 (GOTO Exit Pattern)**：
    為了確保在多重檢查邏輯中能「直接跳轉」至最後的游標開啟動作，建議使用 `GOTO` 標籤與 `SYS_REFCURSOR`。
    - [範例參考 (resources/templates.sql:L24)](resources/templates.sql#L24)

> [!CAUTION]
> **`SQLERRM` 不可直接嵌入 `SELECT` 敘述**：Oracle 不允許將 `SQLERRM` 直接放在 `OPEN ... FOR SELECT` 的欄位清單中，必須**先賦值給變數**再使用。
> - [範例參考：正確與錯誤的 SQLERRM 賦值對比 (resources/templates.sql:L36)](resources/templates.sql#L36)

---

## 5. 邏輯優化規範 (Logic Optimization)

*   **變數傳遞**：優先將 `vGlobal` 中的上下文變數顯式傳入子程序，避免過度依賴 Package 全域變數。
*   **分頁查詢**：所有查詢與 LOV 必須實作分頁邏輯，確保海量資料下的效能。
*   **環境相容性 (Environment Compatibility)**：
    - **優先使用系統變數 `USER`**：若專案架構支援，**務必** 直接使用 `USER` 關鍵字（例如：`SET CFM_USER = USER`）。這能保持與原 Oracle Forms 邏輯一致且代碼最簡。
    - **避免區域相依標識符**：禁止硬編碼特定地區才有的自定義 Package（例如：`PK_SYS.PC_GET_USER`），以確保程式碼在不同專案間的移植性。
*   **標準查詢模式 (vSQLStmt)**：
    為了支援 Ag-Grid 的動態過濾與排序，應統一使用 `vSQLStmt` 字串變數進行構建。
    - [範例參考：vSQLStmt 分頁與計數器實作 (resources/templates.sql:L46)](resources/templates.sql#L46)
    - **排序條件規範 (Sort Condition Rule)**：為了避免當 `SortCondition` 傳入值時遺失預設排序欄位（導致分頁資料不穩定），**必須**將預設排序欄位固定串接在 `SortCondition` 之後，並使用 `NVL` 處理空值。
      *範例*：`'SELECT Row_Number() Over(ORDER BY ' || NVL(vParams.SortCondition, '') || ' A.預設排序欄位 ) ITEM, A.*'`
*   **彙總欄位 (Aggregation Cursors)**：
    若前端需要顯示合計值（如 Summary Row），應在 Procedure 中額外開啟一個快照式的 Cursor (例如 `vSumSum`)，專門回傳該查詢條件下的總計值。
    - [範例參考：合計游標開啟寫法 (resources/templates.sql:L56)](resources/templates.sql#L56)

---

## 6. 新刪修程序模式 (CRUD Procedure Patterns)

為了配合 DLP Grid 的 `executeUpsert` 與 `executeDelete` 功能，後端開發應遵循以下規範：

### 6.1 程序拆分
*   **UPSERT 程序** (`PC_XXX_UPSERT_YYY`)：
    - 處理 `JSON_TABLE` 解析出的 `UpsertData` 陣列，使用 `IsNew` 標籤判定 `INSERT/UPDATE`。
*   **DELETE 程序** (`PC_XXX_DELETE_YYY`)：
    - 僅處理單筆刪除邏輯，從 `vJsonData` 根結點提取主鍵資訊。

### 6.2 回傳協議 (Result OUT VARCHAR2)
*   必須提供一個 `VARCHAR2` 類型的輸出參數（通常命名為 `Result`）。
*   成功回傳 `'1'`，業務阻擋回傳負數代碼。

---

---

## 8. 參考範例 (Source of Truth)
*   **標竿 Package**: [PK_AP_APU030.sql](file:///D:/dlp-develop/DLP.SQL/VN/DDL/AP/PK_AP_APU030.sql)
    - *重點*: 觀察 `PC_APU030_LOV_OP040_SLIP` 的 JSON 解析與標準註解格式。
