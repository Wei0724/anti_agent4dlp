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
*   **內容要求**: 必須包含 UI 配置 (X/Y 座標, Label)、資料區塊關聯、按鈕觸發器邏輯 (WHEN-BUTTON-PRESSED, POST-QUERY) 及 LOV 定義。
*   **注意**: 這是整個遷移的 **單一真相來源 (SSOT)**。在後續步驟中，**嚴禁**再次讀取原始 XML 檔案。

## Step 2: 後端開發 (Phase II - Backend DDL)

請讀取並遵循 **`DlpBackendSqlStandard`** Skill，依據第一步產出的 `[Program ID]_xml_analysis.md` 建立或修改 PL/SQL Package。
*   **目標**: 實作資料查詢、寫入以及 LOV 的後端 SP。
*   **要求**:
    - 將 XML 指示的隱藏欄位查詢 (如 POST-QUERY 原理) 整併進主查詢 JOIN 中。
    - 套用 `JSON_TABLE` 參數解析。
    - 嚴格實施 `1/-1/-N` 回傳協議並註記中文錯誤訊息。

## Step 3: 前端骨架建置 (Phase III - Frontend Scaffold)

請讀取並遵循 **`DlpFrontendStandard`** Skill，同樣依據 `[Program ID]_xml_analysis.md` 建置 Angular 前端七大核心檔案 (Component, State, Service, Control, Form Control, HTML, SCSS)。
*   **目標**: 建立 DLP 標準架構。
*   **要求**:
    - 定義 State 管理 (禁止使用 `getRawValue()`)。
    - 將 Service 中的 ApiService 與後端 SP 綁定。
    - 實作網格資料綁定 (`getQueryInfo`) 與 LOV Editor 參數串接。

## Step 4: UI 精修與排版 (Phase IV - UI Formatting)

請讀取並遵循 **`OracleUIStandard`** Skill，依據 `[Program ID]_xml_analysis.md` 中的「排版座標」及「PROMPT/LABEL」微調前端畫面設定。
*   **目標**: 達成與原始 Oracle Forms 視覺高度一致的結果。
*   **要求**:
    - 嚴格比對表單欄位名稱與寬度 (`width`, `lineBreak`, `blank`)。
    - 加入並正確套用靜態提示 (`(YYYYMM)`) 與紅色警語 (`textColor: 'red'`)。
    - 確保 `Service.initUserContext()` 有透過 `patchValue` 更新顯示。

---
*當使用者要求「執行 Oracle 遷移 Pipeline」或輸入 `/oracle-migration` 時，請嚴格按照此 1-2-3-4 步驟依序執行產出。*
