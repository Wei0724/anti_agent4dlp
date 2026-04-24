---
name: DlpBackendStandard
description: DLP 專案後端開發總綱，涵蓋 SQL (直連預設) 與 C# (Excel/擴充邏輯) 規範。
---

# DLP 後端開發規範 (DlpBackendStandard)

本 Skill 旨在規範 DLP 專案中後端邏輯的開發標準，確保持續維護性且同時兼顧效能與靈活性。

> [!IMPORTANT]
> ## 架構決策 (Architectural Decision)
> 1. **SQL-First (預設路徑)**：為了極致效能與開發速度，90% 的 CRUD 與查詢應直接由前端透過 `this._api.callSpDataSet()` 或 `this._api.callSp()` 直接對接底層 SQL Package。
> 2. **C# Extended (擴充路徑)**：僅在需要產出 **Excel**, **PDF** 或處理極其複雜的二進位流邏輯時，才建立 C# WebAPI 層 (Controller -> Service -> Repository)。

---

## 第一部分：SQL 開發規範 (PL/SQL)

### 1. Package 結構規範
*   **規格 (Specification)**：**禁止包含註解**，僅宣告公用程序與函數的簽章。
*   **本體 (Body)**：私有程序或函數應置於本體最上方進行 Forward Declaration。

### 2. 命名規範 (Naming Conventions)
*   **格式**: `PC_[模組代號]_[動作]_[操作對象]`
*   **範例**: `PC_APB111_QUERY_AP110` (APB111 模組查詢 AP110 檔案)

### 3. 標準註解區塊 (Documentation Blocks)
每一支程序前必須包含嚴格格式的註解區塊（分隔線為 76 個虛線）：
```sql
/* ----------------------------------------------------------------------------
--   名稱: [Procedure/Function Name]
--   功能說明: [Description]
--   輸入資料: 
--   注意事項: (標籤後必須保持空白，不可填寫文字)
--   原設計者: WEI_PAN
--   設立日期: [YYYY/MM/DD]
--   ------------------------ 異動紀錄明細 ---------------------------------
--  異動日期  異動者    異動說明
---------------------------------------------------------------------------- */
```

### 4. 錯誤處理與回傳協議 (1/-1/-N Rule)
*   **成功**: `RES_CODE = '1'`。
*   **系統異常**: `RES_CODE = '-1'`, `RES_MSG = SQLERRM` (必須先賦值給變數，禁止直接在 SELECT 中使用 SQLERRM)。
*   **業務阻擋**: 使用負數代碼 (`'-2'`, `'-3'`)，**禁止**回傳中文訊息，但必須在 SQL 代碼旁邊以註解標註。

### 5. LOV 程序標準寫法 (LOV Standard)
為了支援前端開窗元件的分頁、過濾與排序，LOV 程序必須遵守以下動態 SQL 範式：
*   **參數規範**: 強制包含 `vCount OUT SYS_REFCURSOR`。
*   **JSON 解析**: 必須解析 `StartRow`, `EndRow`, `FilterCondition`, `SortCondition` 等參數。
*   **動態 SQL 構建**:
    ```sql
    vSQLStmt := '
        SELECT Row_Number() Over (ORDER BY ' || vParams.SortCondition || ' A.DEFAULT_COL) ITEM, A.*
        FROM ( [你的核心查詢語句] ) A
        WHERE ' || NVL(vParams.FilterCondition, '1=1');
    ```
*   **雙游標回傳**:
    *   `vInfo`: `SELECT A.* FROM ( ' || vSQLStmt || ' ) A WHERE A.ITEM >= ...`
    *   `vCount`: `SELECT COUNT(*) TOTAL_COUNT FROM ( ' || vSQLStmt || ' )`
*   **別名規範**: 欄位別名強制**大寫**（如 `VALUE`, `LABEL`），以匹配前端配置。

---

## 第二部分：C# 開發規範 (Backend)

當進入「擴充路徑」使用 C# 時，必須嚴格遵守以下標準：

### 1. 實體表導向命名 (Naming Standards)
*   **Repository 必須對應資料表實體**：例如對應 `CA050` 表的 Repository 必須命名為 `CA050Repository.cs`，而非以功能 ID 命名。
*   **層級鏈結範式**：
    `Controller (Function ID)` → `Service (Function ID)` → `Repository (Table Entity)`
    *範例：`Apu030Controller` -> `Apu030Service` -> `AP030Repository`*

### 2. 專業 C# 代碼風格 (Code Style)
*   **禁止舊式註解**：正式移除檔案頭部的 `/*...*/` 區塊註解，保持檔案整潔。
*   **Region 區隔邏輯**：在共用性 Repository 中，必須使用 `#region [功能ID]` 來管理不同案子的邏輯塊。
    ```csharp
    #region APU030
    public async Task<DataSet> QueryApu030(...) { ... }
    #endregion
    ```

---

## 避雷檢查清單 (Quick Checkpoints)

- [ ] **命名檢查**：C# Repository 是否已對應資料表而非功能 ID？
- [ ] **註解清理**：C# 檔案頭部是否已移除所有區塊註解？
- [ ] **SQL 錯誤代碼**：阻擋邏輯是否採用負數代碼且**附上 SQL 中文註解**？
- [ ] **LOV 參數完整性**：程序是否包含 `vCount` 且回傳了 `TOTAL_COUNT`？
- [ ] **LOV 動態分頁**：是否使用了 `Row_Number()` 與動態 `vSQLStmt` 模式？
- [ ] **欄位別名大寫**：所有回傳給前端的別名（尤其 LOV）是否皆為大寫？
- [ ] **分頁穩定性**：`vSQLStmt` 是否將預設排序欄位串接在 `SortCondition` 之後？
- [ ] **SQLERRM 賦值**：是否已避開在 SELECT 中直接調用 SQLERRM？
- [ ] **註解對齊**：`輸入資料` 與 `注意事項` 標籤後是否已保持空白？
- [ ] **防邏輯誤刪**：增補子程序時，是否確認未覆蓋或誤刪 Body 中既有的私有程序？

---

## 參考標竿 (Source of Truth)
*   **SQL 標竿**: [PK_AP_APU030.sql](file:///D:/dlp-develop/DLP.SQL/VN/DDL/AP/PK_AP_APU030.sql)
*   **Excel/C# 範例**: [OracleExcelMigration SKILL](file:///d:/dlp-develop/.agents/skills/OracleExcelMigration/SKILL.md)
