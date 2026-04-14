---
name: OracleXmlAnalyzer
description: 分析 Oracle Forms XML (FMB)，一次性萃取 UI 排版、資料區塊與觸發器邏輯，產出標準化的分析報告供後續依賴 Skill 使用。
---

# Oracle Forms XML Analyzer Skill

> [!IMPORTANT]
> ## 強制檢索協議 (Mandatory Retrieval Protocol)
> 在進行任何 Oracle Forms XML 分析與文件產出前，**必須** 先針對任務需求，呼叫 `view_file` 讀取並驗證以下資源文件：
> 1. [資源範本：分析報告標準格式 (resources/analysis-report-template.md)](resources/analysis-report-template.md)
> **未執行讀取動作即產出報告將視為任務失敗。**

## 0. 避雷檢查清單 (Quick Checkpoints)
- [ ] **完整讀取**：XML 內容是否已完全讀取並檢查過 `offset` 截斷？
- [ ] **排版群組**：是否已依據 Y 座標對 UI 項目進行分行整理？
- [ ] **邏輯完整性**：是否已深入讀取 `POST-QUERY` 的隱藏底層邏輯？
- [ ] **報告產出**：是否已在對話目錄中建立具標誌性的 `[程式 ID]_xml_analysis.md`？

本 Skill 的唯一目的是作為 Oracle Forms 遷移的**第一站**。它負責深入研讀 XML 原始檔案，並產出一份結構化的分析報告。這份報告將成為後續實作 UI、前端邏輯與後端 SQL 的**單一真相來源 (Single Source of Truth, SSOT)**，從而省去反覆讀取龐大 XML 檔案的重工。

## 目錄 (Table of Contents)
- [1. 核心執行動作 (Execution Steps)](#1-核心執行動作-execution-steps)
- [2. 資訊萃取規範 (Extraction Guidelines)](#2-資訊萃取規範-extraction-guidelines)
- [3. 產出格式規範與範本](#3-產出格式規範與範本-output-format)
- [4. 避雷檢查清單 (Checkpoints)](#4-避雷檢查清單-checkpoints)

---

## 1. 核心執行動作 (Execution Steps)

當觸發此 Skill 時，必須執行以下動作：
1.  **讀取 XML**：確保讀取完整的 XML 內容 (若遇截斷需使用 offset 讀完)。
2.  **解析資訊**：依據第 2 節的規範抽取四大維度的資訊。
3.  **產出 Artifact**：強制在對話資料夾中建立一個 `[程式代碼]_xml_analysis.md` (例如 `APU030_xml_analysis.md`)。

---

## 2. 技術細節 (Technical Deep Dive)

### 2.1 資訊萃取規範 (Extraction Guidelines)

#### 2.1.1 介面配置 (UI Layout & Canvas)
*   梳理所有的 `<Canvas>`。
*   歸納 `<Item>`，記錄：
    *   **屬性**: Name, Prompt (標題), Item Type (Text, Button, List, Lov)。
    *   **佈局**: X_POSITION, Y_POSITION。將 Y 座標相同的項目整理為同一行的群組。
*   **用途**: 此區塊將直接餵給 `OracleUIStandard` 來生成 `*-form.control.ts` 與排版。

#### 2.1.2 資料結構 (Data Blocks & Items)
*   記錄所有的 `<Block>` 及其關聯的資料表或視圖。
*   列出對應的欄位清單及其 DataType 與 MaxLength。
*   **用途**: 此區塊將餵給 `DlpFrontendStandard` 作為 `State` 定義及 `DlpBackendStandard` 的 SQL 查詢基礎。

#### 2.1.3 觸發器與業務邏輯 (Triggers & Business Logic)
*   **按鈕邏輯**: 摘錄 `WHEN-BUTTON-PRESSED` 執行了什麼 (如呼叫特定的 Procedure 或 `EXECUTE_QUERY`)。
*   **表單生命周期**: 摘錄 `WHEN-NEW-FORM-INSTANCE` 初始化了什麼資料。
*   **資料操作**: 摘錄 `POST-QUERY` (抓取關聯名稱) 或 `WHEN-VALIDATE-RECORD` (資料驗證規則)。
*   **用途**: 此區塊將餵給 `DlpFrontendStandard` 實作 `Service`，以及 `DlpBackendStandard` 實作 DDL 的檢核邏輯。

#### 2.1.4 LOV 與清單定義 (LOV & Lists)
*   記錄 LOV 關聯的 Record Group (SQL Query)。
*   記錄 List Item 寫死的靜態選項 (Values)。

---

## 3. 產出格式規範與範本 (Output Format)

產出的 `_xml_analysis.md` 必須包含特定的標題層級：
- [查看 XML 分析報告標準範本 (resources/analysis-report-template.md)](resources/analysis-report-template.md)

---

## 4. 避雷檢查清單 (Checkpoints)

- [ ] **完整性**：XML 內容是否已完全讀取 (check offset)?
- [ ] **排版群組**：是否已依據 Y 座標對 UI 項目進行分行?
- [ ] **邏輯完整性**：是否已涵蓋 `POST-QUERY` 的名稱查詢邏輯?
- [ ] **SSOT 產出**：是否已建立正確命名的 `[程式代碼]_xml_analysis.md` 檔案?

---
*Created per USER request to optimize the migration workflow.*
