---
name: OracleUIStandard
description: Oracle Forms 遷移至 Angular (DLP) 的 UI 實作規範與分析方法。
---

# Oracle UI Standard Skill

本 Skill 用於指導開發者從 Oracle Forms (XML) 遷移至 Angular DLP 架構時的 UI 分析與實作，確保產出物與原設計高度一致。

## 1. 分析階段 (Analysis Phase)

### 1.1 XML 結構解析 (Tag Analysis)
*   **Canvas Inventory (畫布盤點)**: 
    - 搜尋 `<Canvas>` 標籤，釐清 Query/Entry/Grid Display 區塊。留意不只看畫布，也要把與它關聯的 `<Item>` 列出。
*   **Block & Item Mapping**: 
    - `<Block>`: 常代表一個資料來源（如 MP070 表或 ZCP51 Grid）。
    - `<Item>`: 每一個輸入框或顯示欄位。
*   **Coordinate mapping**: 
    - 檢查元件的 `X_POSITION` 與 `Y_POSITION`。相同 Y 座標應放在同一行。
*   **Prompt accuracy**: 
    - 嚴格比對 `<Item>` 內的 `PROMPT` (表單標籤) 或 `<Column>` 的標題。

### 1.2 邏輯盤點與觸發器 (Trigger Audit)
*   **按鈕邏輯 (Button & Trigger Mapping)**: 尋找 `ItemType="Button"` 的元件，追蹤其 `WHEN-BUTTON-PRESSED` 觸發器（例如：是否呼叫了 `VALIDATE_QUERY` 還是直接存檔）。
*   **導航邏輯 (Navigation Trace)**: 尋找 `go_block`, `show_view`, `execute_query`，以了解從 `WHEN-NEW-FORM-INSTANCE` 啟動後的畫面流轉。如果 `execute_query` 在某個按鈕裡，前端則不該在 `ngOnInit` 裡自動觸發查詢。
    - **User Context Check**: 檢查 `WHEN-NEW-FORM-INSTANCE` 是否有呼叫特定 SP 取得使用者公司或權限資料。若無，前端應省略 `initUserContext` 步驟。
*   **區塊級觸發器 (Block-Level Triggers)**:
    - `POST-QUERY`: 通常用來取得輔助顯示的名稱（如：用代碼去查名稱），在轉移時「必須」整併到主 SQL Query 的 Join 子句中。
    - `WHEN-VALIDATE-RECORD`: 針對整列資料的檢查邏輯，應移植到 Backend 進行檢核，或前端按下「儲存/轉入」時的校驗 (`Service`)。
*   **項目級觸發器 (Item-Level Triggers)**: 尋找 `WHEN-VALIDATE-ITEM` 或 `WHEN-CHECKBOX-CHANGED`，並轉換為 Frontend 網格的 `onCellValueChanged` 或表單的 `onValueChanged`。

### 1.3 後端介面預審 (Backend Interface Pre-audit)
*   **Signature Mapping**: 提前確認實體環境中 SP 的輸入/輸出參數（如 `VARCHAR2` vs `SYS_REFCURSOR`）。
*   **Constraint Checking**: 預先查詢關鍵欄位（如 `REPORT_SEQ`）在實體表中的 `DATA_LENGTH` 與 `NULLABLE` 屬性，避免在 UI 實作完成後才發現後端無法寫入。

## 2. 實作規範 (Implementation Standards)

### 2.1 Form Control (DlpFieldConfigurationsType)
*   **Label Sync**: `label` 必須與 XML 提示完全一致。
*   **Field Types**:
    - `LIST_ITEM` -> `type: 'select'` (包含代碼與中文)。
    - `LOV_ITEM` -> `type: 'lov'` (正確配置 `apiParams`, `colDefs`)。
    - `DISPLAY_ITEM` -> `type: 'text', disabled: true`。
*   **Helper Labels**: 固定提示 (如 `(YYYYMM)`) 使用 `type: 'label'`。
*   **Red Warnings**: 紅字警告使用 `type: 'caption', textColor: 'red'`。

### 2.2 Grid Control (DlpColDef)
*   **Title**: 網格標題 (`gridConfig.title`) 必須反映業務邏輯或 Canvas 名稱。
*   **Columns**: 清單順序與 XML 項次或寬度佔比一致。
*   **LOV in Grid**: 使用 `type: EDlpGridColumnType.lov` 並配置 `cellEditorParams`，詳見 `DlpFrontendStandard` SKILL 的 Form vs Grid 對照說明。
    - 必填屬性（包裹於 `cellEditorParams` 內）：`keyMapping`、`colDefs`、`apiParams`、`queryAction`、`refCursorKeys`、`checkInput`。
    - `keyMapping` 格式：`{ Grid欄位名: LOV回傳欄名 }`，可同時回填多欄（如同步帶出顯示名稱）。
    - `cellEditorParams` 可為**靜態物件**（查詢條件固定時）或**函式**（需動態依賴 formData 時）。
*   **Select in Grid**: 使用 `type: EDlpGridColumnType.select`。
    - **必須加上 `cellRendererEditable: true`**，否則儲存格顯示為純文字，無法點擊觸發下拉。
    - `selectableOptions` 型別必須為 **`IDlpGridSelectableOption[]`**（❌ 禁止 `IDlpGridSelectOption`，該型別不存在）。
*   **純顯示符號 (Display Labels in Grid)**：
    - 若 XML 有如 `%` 的固定提示字，應在 Grid 中獨立佔一欄：
    - `headerName: ''`, `width: 30`, `valueGetter: () => '%'`, `cellStyle: { 'padding-left': '0px' }`, `editable: false`。

### 2.4 權限與維護狀態控管 (Permission & Maintenance Control)
*   **對應 `SET_BLOCK_PROPERTY`**: 
    - 使用 `dlpGridApi.setAllowInsert(boolean)`, `setAllowUpdate(boolean)`, `setAllowDelete(boolean)`。
    - 使用 `dlpGridApi.setInsertBtnDisabled(boolean)` 控管新增按鈕。
*   **對應 `update_allowed = false` (僅新增可改)**: 
    - 在 `DlpColDef.editable` 使用 `(params.node as DlpRowNode).isInsertRow()`。
    - 範例：`editable: (params: EditableCallbackParams) => (params.node as DlpRowNode).isInsertRow()`。
*   **數值屬性映射 (Number Mapping)**:
    - Oracle `NUMBER` -> `type: EDlpGridColumnType.number`。
    - 必配屬性：`precision: 2` (精度), `allowNullNumber: true` (允許空值), `cellStyle: this._pubFunction.rightTextAlign` (靠右), `valueFormatter: ...` (千份位)。
*   **反應式按鈕 (Form Button within Form)**:
    - 若按鈕在 Form 內且需連動 Grid 選取狀態，應於 State 建立 `BehaviorSubject` 並在 `FormControl` 的 `disabled$` 中使用 `map` 訂閱。

## 3. 檢查清單 (Checklist)
- [ ] 標題文字與 XML 逐字核對過了嗎？
- [ ] 靜態提示 (YYYYMM) 是否已加上？
- [ ] 按鈕文字是否準確？
- [ ] 紅色警語是否符合 XML 定義？
## 4. 參考範例 (Reference Implementations - Source of Truth)
*   **原始 XML (Input)**: `D:\Users\Wei_Pan\Documents\暫存\BasePrompt\APU030_fmb.xml`
*   **實作標竿 (Output)**: [apu030-form.control.ts](file:///D:/dlp-develop/DLP.Web/DLP.Web.AppPortal/ClientApp/src/app/views/ap/vn/controls/apu030-form.control.ts)
    - *重點*: 觀察 Y 座標對齊、`(YYYYMM)` 與紅色警語的實作方式。
