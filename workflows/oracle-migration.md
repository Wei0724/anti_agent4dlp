---
description: Oracle Forms to Angular/PLSQL End-to-End Migration Pipeline
---

# Oracle Migration Pipeline Workflow

本工作流 (Workflow) 旨在標準化從 Oracle Forms (`.xml` 原始檔) 遷移至 DLP (Angular + PL/SQL) 專案的完整自動化過程。

> [!IMPORTANT]
> **中斷與詢問優先 (Pause & Ask Rule)**
> 在整個遷移過程中，若遇到 XML 定義模糊、SQL 邏輯遺失、欄位用途不明確或任何不確定的技術選擇，**嚴禁自行猜測、假設或補完**。必須立即暫停並向使用者提出疑問，獲得確認後方可繼續。

---

## Step 1: 基礎分析 (Phase I - XML Analysis)

請讀取並執行 **`OracleXmlAnalyzer`** Skill 對目標 XML 檔案（例如 `XXX_fmb.xml`）進行深度解析。
*   **目標**: 產出一份名為 `[Program ID]_xml_analysis.md` 的 Artifact。
*   **重點要求**: 
    - 必須包含 UI 配置 (X/Y 座標, Label)、資料區塊關聯、按鈕觸發器邏輯 (WHEN-BUTTON-PRESSED, POST-QUERY) 及 LOV 定義。
    - **疑難排查**: 若解析過程中發現原 Form 具備複雜的隱藏邏輯（如 `GLOBAL` 變數傳遞），必須暫停並詢問用途。
*   **注意**: 這是整個遷移的 **單一真相來源 (SSOT)**。在後續步驟中，**嚴禁**再次讀取原始 XML 檔案。

## Step 2: 後端開發 (Phase II - Backend DDL)

請讀取並遵循 **`DlpBackendSqlStandard`** Skill，依據第一步產出的 `[Program ID]_xml_analysis.md` 建立或修改 PL/SQL Package。
*   **目標**: 實作資料查詢、寫入以及 LOV 的後端 SP。
*   **要求**:
    - 將 XML 指示的隱藏欄位查詢 (如 POST-QUERY 原理) 整併進主查詢 JOIN 中。
    - 套用 `JSON_TABLE` 參數解析，並實作標準分頁。
    - 嚴格實施 `1/-1/-N` 回傳協議並註記中文錯誤訊息。

## Step 3: 前端骨架建置 (Phase III - Frontend Scaffold)

請讀取並遵循 **`DlpFrontendStandard`** Skill，同樣依據 `[Program ID]_xml_analysis.md` 建置 Angular 前端七大核心檔案 (Component, State, Service, Control, Form Control, HTML, SCSS)。
*   **目標**: 建立 DLP 標準架構。
*   **要求**:
    - 定義 State 管理 (禁止使用 `getRawValue()`, 嚴禁在 State 注入 `FormBuilder`)。
    - 將 Service 中的 ApiService 與後端 SP 綁定，注意 `NotificationService` 的正確拼寫。
    - 實作網格資料綁定 (`getQueryInfo`) 與 LOV Editor 參數串接。

## Step 4: UI 精修與排版 (Phase IV - UI Formatting)

請讀取並遵循 **`OracleUIStandard`** Skill，依據 `[Program ID]_xml_analysis.md` 中的「排版座標」及「PROMPT/LABEL」微調前端畫面設定。
*   **目標**: 達成與原始 Oracle Forms 視覺高度一致的結果。
*   **要求**:
    - 嚴格比對表單欄位名稱與寬度 (`width`, `lineBreak`, `blank`)。
    - 加入並正確套用靜態提示 (`(YYYYMM)`) 與紅色警語 (`textColor: 'red'`)。
    - 確保 `Service.initUserContext()` 有透過 `patchValue` 更新顯示。
    - **座標精準**: 嚴格比對表單欄位名稱與 X/Y 關係。
    - **轉換規範**: 原 Form 的 Hint 必須轉化為 `type: 'caption'`。
    - **細節控管**: 加入紅色警語 (`textColor: 'red'`) 與多行標頭 (#n~)。

## Step 5: 全鏈路三循環高精度稽核 (Phase V - High-Precision Triple-Check)

完成所有開發後，啟動 **遞迴稽核流程**，滿足「**連續三次檢查完全 0 錯誤**」方可交付。

### 1. 遞迴規則
- **循環執行**：對照下方「清單」對所有產出進行掃描。
- **重置計數**：**只要有任何代碼變動（包含修正），檢查計數器必須立即重置。**
- **完成定義**：只有連續 3 次無任何代碼變動通過查核後，才產出 `[Program ID]_qa_check.md`。

### 2. 高精度稽核清單 (High-Precision Checklist)

#### **[後端 DDL] (DlpBackendSqlStandard)**
- [ ] **命名**: Procedure 是否為 `PC_[模組]_[動作]_[對象]`？
- [ ] **註解**: Body 內是否有 76 虛線組成、含 metadata 的標準註解塊？
- [ ] **參數**: 是否使用 `JSON_TABLE` 解析至變數？
- [ ] **錯誤處理**: 成功 `RES_CODE = '1'`；業務阻擋回傳負數並在 SQL 註解中文？
- [ ] **EXCEPTION**: `SQLERRM` 是否先賦值給變數再於 `OPEN FOR SELECT` 中傳出？
- [ ] **排序分頁**: 動態排序是否已在 `SortCondition` 後串接固定主鍵？

#### **[前端架構] (DlpFrontendStandard)**
- [ ] **命名**: 注入 State 名稱 (如 `_apu010`) 與 Getter 名稱 (如 `apu010FormRefs`) 是否含程式 ID？
- [ ] **禁令**: 是否**徹底排除** `FormBuilder` 與 `getRawValue()`？
- [ ] **時機點**: References 是否**僅**在 `init()` 中進行實例化？
- [ ] **LOV 配置**: Form LOV 為平級屬性？Grid LOV 包裹於 `cellEditorParams`？
- [ ] **Grid 控管**: Select 欄位有 `cellRendererEditable: true`？Number 有 `allowNullNumber: true`？
- [ ] **Service**: 所有方法為箭頭函數？型別為 `NotificationService`？

#### **[UI 佈局] (OracleUIStandard)**
- [ ] **對齊**: HTML 結構是否精確對應 XML 座標（相同 Y 值置於同一行）？
- [ ] **提示轉換**: 原 XML 的 `_hint` 是否已轉化為 `type: 'caption'` 且有 `textColor: 'red'`？
- [ ] **多行標題**: 超長標題是否使用 `#n~` 並在 Component 設置 `headerHeight`？

> [!TIP]
> **特殊場景：Excel 匯出遷移 (Excel Export Migration)**
> 若分析報告指出該模組的核心功能為產出 Excel 報表（對應原 Forms 的 `CALL_EXCEL` 邏輯）：
> 1.  **Step 2 (後端)**：除 SQL 外，必須額外生成 **C# Repository** 中的 NPOI 佈局邏輯。
> 2.  **Step 3 (前端)**：專注於 `Blob` 接收與下載處理，而非標準網格維護。
> 3.  **參考規範**：請務必加掛並遵循 **`DlpExcelExportStandard`** Skill。

#### **[整合與 Excel] (DlpExcelExportStandard)**
- [ ] **位置**: Excel Service 在 `CATypes`？Repository 在實體模組專案並對接 Interface？
- [ ] **正確性**: 前端是否加入 `application/json` 攔截以捕捉業務報錯？
- [ ] **排序**: `ap.module.ts` 的所有 Import 與宣告是否**嚴格按字母排序**？

---
*當使用者要求「執行 Oracle 遷移 Pipeline」或輸入 `/oracle-migration` 時，請嚴格按照此 1-2-3-4 步驟依序執行產出。*
