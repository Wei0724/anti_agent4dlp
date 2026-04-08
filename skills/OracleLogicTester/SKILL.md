---
name: OracleLogicTester
description: 通用的 Oracle 資料邏輯驗證與權限診斷技能，專用於解決 Oracle Forms 遷移過程中的後端邏輯與 LOV 資料顯示問題。
---

# OracleLogicTester 技能說明

本技能旨在提供一套標準化的方法論，用於分析、診斷、模擬與驗證 Oracle 資料庫應用程式（特別是從 Oracle Forms 遷移至 Web 平台時）的後端業務邏輯。

## 適用情境 (Context)
- 遷移後的 Web 程式下拉選單 (LOV) 帶不出資料。
- 按鈕點擊後沒有正確異動資料或報錯。
- 需要在不更動前端程式的情況下，模擬後端觸發器 (Trigger) 或預存程序 (SP) 的執行。
- 測試環境缺乏符合權限的測試資料。

### 階段 0：環境初始化與範本讀取 (Initialization & Templates)
- **環境確認**：僅在一開始詢問目標資料庫（如 `VN-SIT`）。
- **路徑規範**：預設執行與腳本產生路徑應為 `d:\Users\Wei_Pan\Documents\暫存\oracle-query-tool` (對應 MCP 服務路徑)。
- **範本讀取**：在產生任何腳本前，**務必** 先使用 `view_file` 讀取 `scripts/` 目錄下的範本檔案，確保生成的腳本符合標準結構。

### 階段 0.5：結構與相依性預檢 (Schema & Dependency Pre-check)
- **結構比對**：在執行邏輯前，主動比對 SQL 中的欄位名與實體表（`all_tab_columns`），預警 `ORA-00904` 或長度超限 (`ORA-12899`)。
- **相依性確認**：確認跨環境共用函式（如 `PK_SYS.PC_GET_USER`）在當前專案資料庫中是否存在。

### 階段 1：主動診斷與權限自適應 (Proactive Diagnostics)
- **連線與權限**：執行腳本探測 `OADBA` 權限。若權限受限，自動降級至 `ALL_` 視圖，並在最終報告中紀錄，不中斷自動化流程。

### 階段 2：深度溯源 (Deep Discovery - Conditional)
- **遞進搜尋**：當基礎表格不見時，自動啟動同義字、DB Link 與 `all_source` 搜尋。

### 階段 3：標準化腳本生成與執行 (Auto Execution)
- **引用範本**：基於 `find-data-tpl.js` 與 `logic-sim-tpl.js` 產生針對目標 Program 的測試腳本。
- **一鍵執行**：使用 `run_command` 並配合 `SafeToAutoRun: true` 連續執行搜尋與模擬。

### 階段 3.5：自動編譯與邏輯修正 (Auto-Compile & Fix)
- **部署後檢查**：部署 SQL 後，自動查詢 `all_errors`。
- **自我修正**：若發現編譯錯誤，應根據錯誤訊息（如 `invalid identifier`）回溯原始碼並嘗試自動修正後重新部署。

### 階段 4：品牌化測試報告產出 (Branded Final Report)
報告必須以以下格式命名與開頭：
- **檔名**：`test_result_[Program].md`
- **標題**：`# [Program] 測試結果報告 ([Program Name])`
- **內容**：包含資料組合、驗證 SQL、復原 SQL，以及診斷過程中發現的環境特性。
- **執行摘要 (Execution Summary)**：細部中應標註 `使用SKILL: OracleLogicTester`，而不是目標程式名稱。

## 觸發關鍵字
- 「資料驗證」、「測試資料」、「資料帶不出來」、「LOV 偵錯」、「模擬觸發器」、「權限診斷」、「深度診斷」、「一鍵測試」。
