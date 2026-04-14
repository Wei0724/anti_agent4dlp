---
description: Oracle Forms to Angular/PLSQL End-to-End Migration Pipeline
---

# Oracle Migration Pipeline Workflow

本工作流 (Workflow) 旨在標準化從 Oracle Forms (`.xml` 原始檔) 遷移至 DLP (Angular + PL/SQL) 專案的完整自動化過程。

這是一個 **四步走** 的標準化流程，目的是透過一次性解析 XML，分發資訊給各職責領域的 Skills 進行精準產出，避免反覆讀取與上下文遺失。

---

## Step 1: 基礎分析 (Phase I - XML Analysis)

請讀取並執行 **`OracleXmlAnalyzer`** Skill 對目標 XML 檔案（例如 `XXX_fmb.xml`）進行深度解析。
*   **目標**: 產出一份名為 `[Program ID]_xml_analysis.md` 的 Artifact。
*   **要求**: 必須包含 UI 配置 (X/Y 座標, Label)、資料區塊關聯、按鈕觸發器邏輯 (WHEN-BUTTON-PRESSED) 及 LOV 定義。
*   **Excel 偵測**: 必須分析 Program Unit 是否包含 `TEXT_IO` 或 `CHR(9)` 邏輯。若有，必須在分析報告中標註 `[Excel Migration Required: YES]` 及其對應模式 (Pattern A/B/C)。
*   **注意**: 這是整個遷移的 **單一真相來源 (SSOT)**。在執行本步驟前，**必須呼叫 `view_file` 讀取 `OracleXmlAnalyzer` 的 `analysis-report-template.md`**。

## Step 2: 後端開發 (Phase II - Backend DDL)

請讀取並遵循 **`DlpBackendStandard`** Skill，依據第一步產出的 `[Program ID]_xml_analysis.md` 建立或修改 SQL Package 或 C# 代碼。
*   **目標**: 實作資料查詢、寫入以及 LOV 的後端 SP。
*   **要求**:
    - 將 XML 指示的隱藏欄位查詢整併進主查詢 JOIN 中。
    - 套用 `JSON_TABLE` 參數解析。
    - 嚴格實施 `1/-1/-N` 回傳協議並註記中文錯誤訊息。
*   **Excel/複雜邏輯 (擴充路徑)**: 若 Step 1 標註為 YES 或有複雜運算需求，則額外遵循 `DlpBackendStandard` 中的 **C# 規範** 與 **`OracleExcelMigration`**，實作 Controller/Service/Repository。
*   **關鍵檢索**: 執行本步驟前，**必須呼叫 `view_file` 讀取 `DlpBackendStandard` 的 `templates.sql`**。

## Step 3: 前端骨架建置 (Phase III - Frontend Scaffold)

請讀取並遵循 **`DlpFrontendStandard`** Skill，同樣依據 `[Program ID]_xml_analysis.md` 建置 Angular 前端七大核心檔案 (Component, State, Service, Control, Form Control, HTML, SCSS)。
*   **目標**: 建立 DLP 標準架構。
*   **要求**:
    - 定義 State 管理，將 Service 中的 ApiService 與後端 SP 綁定。
    - 實作網格資料綁定 (`getQueryInfo`) 與 LOV Editor 參數串接。
*   **Excel 擴充 (Optional)**: 若 Step 1 標註為 YES，則應調用 **`OracleExcelMigration`** Skill 實作 Service 內的 `Blob/JSON` 雙重檢查法，並確保 Controller 回傳正確的檔案流。
*   **關鍵檢索**: 執行本步驟前，**必須呼叫 `view_file` 讀取 `DlpFrontendStandard` 的 `component-patterns.ts`**。

## Step 4: UI 精修與排版 (Phase IV - UI Formatting)

請讀取並遵循 **`OracleUIStandard`** Skill，依據 `[Program ID]_xml_analysis.md` 中的「排版座標」及「PROMPT/LABEL」微調前端畫面設定。
*   **目標**: 達成與原始 Oracle Forms 視覺高度一致的結果。
*   **要求**:
    - 嚴格比對表單欄位名稱與寬度 (`width`, `lineBreak`, `blank`)。
    - 加入並正確套用靜態提示 (`(YYYYMM)`) 與紅色警語 (`textColor: 'red'`)。
    - 確保 `Service.initUserContext()` 有透過 `patchValue` 更新顯示。
*   **關鍵檢索**: 執行本步驟前，**必須呼叫 `view_file` 讀取 `OracleUIStandard` 的 `ui-mapping-examples.ts`**，驗證座標對齊與寬度配置。

---
*當使用者要求「執行 Oracle 遷移 Pipeline」或輸入 `/oracle-migration` 時，請嚴格按照此 1-2-3-4 步驟依序執行產出。*
