---
name: DlpFrontendStandard
description: DLP 專案前端開發之程式碼結構、State 管理及元件配置規範。
---

# DLP 前端開發開發規範 (DlpFrontendStandard)

本 Skill 旨在規範 DLP 專案中的 Angular 開發標準，避免邏輯回歸、提升代碼一致性並減少常見錯誤。

> [!IMPORTANT]
> ## 強制檢索協議 (Mandatory Retrieval Protocol)
> 在進行任何前端開發或 UI 配置前，**必須** 先針對任務需求，呼叫 `view_file` 讀取並驗證以下資源文件：
> 1. [資源範本：元件配置模式 (resources/component-patterns.ts)](resources/component-patterns.ts)
> 2. [資源範本：LOV 配置對照表 (resources/lov-config-reference.md)](resources/lov-config-reference.md)
> 3. [標竿範例：apu030.control.ts](file:///D:/dlp-develop/DLP.Web/DLP.Web.AppPortal/ClientApp/src/app/views/ap/vn/controls/apu030.control.ts)
> 
> **嚴格防幻覺守則 (Anti-Hallucination Rule)：**
> - **絕對禁止憑空捏造屬性與路徑**：所有元件配置（特別是 Grid/Form 中的 Button、Radio、Select、LOV 等）與 **Import 導入語句**，**必須 100% 複製 `component-patterns.ts` 或標竿範例內的設定結構**。
> - **未知則問 (Ask when unknown)**：若在 `component-patterns.ts` 找不到對應的 Service 路徑或屬性定義，且無法透過 `view_file` 驗證其存在，**AI 必須停止作業並主動詢問使用者**，禁止任何形式的盲目猜測！
> - 未執行讀取動作或是未參照上述資源檔而盲目猜測（如發明 `@services/` 路徑、或是捏造不存在於 DlpForm 的 `color` 屬性），將視為嚴重任務違規！

## 0. 避雷檢查清單 (Quick Checkpoints)
- [ ] **導入路徑 (Import Paths)**：是否使用了 `component-patterns.ts` 內的標準模板？(❌ 禁止憑空猜測路徑，如無法確定且資源檔未載明，**必須詢問使用者**)
- [ ] **表單型態 (Form Type)**：`DlpFieldConfigurationsType` 是否誤用了 `EDlpFormFieldType` 枚舉？(❌ 禁止，應直接使用字串常數如 `'lov'`, `'text'` 等)
- [ ] **選項綁定 (Options)**：Radio 或 Select 欄位是否正確使用了 `options$` (Observable) 且帶有 `defaultValue`？ (❌ 禁止，不要誤用 `selectableOptions`)
- [ ] **按鈕屬性 (Button)**：Form 中的按鈕是否誤用了 `color` 屬性？ (❌ 禁止，請使用 `icon` 或 `width` 來調整，DLP Form 不支援直接設定 Material color)
- [ ] **欄位型態 (Type)**：`DlpColDef` 是否為每個欄位定義了 `type: EDlpGridColumnType`？(否則篩選器會失效)
- [ ] **HTML 標籤**：是否誤用了 `<app-dlp-grid>`？ (❌ 禁止，應使用 `<dlp-grid>`)
- [ ] **HTML 屬性**：是否誤用了 `[gridConfig]`？ (❌ 禁止，應統一使用 `[gridRefs]`)
- [ ] **State 取得**：是否使用了 `getRawValue()`？ (❌ 禁止，應使用 `formRefs.formData`)
- [ ] **SP 調用簽章 (API Signature)**：`callSpDataSet` 是否正確組合了 `<ICallSpDataSetParams>` 並帶有完整的 Package 名稱 (如 `PK_XX...`)？ (❌ 禁止直接傳入 `{}` 或未附帶 Package 名稱)
- [ ] **網格查詢觸發 (Grid Query)**：呼叫 `executeQueryByInfo()` 時是否誤傳了參數？ (❌ 禁止傳入參數，應在 Component 的 `getQueryInfo` 內完成宣告)
- [ ] **命名規範**：State 注入名稱是否包含描述性 ID (如 `_apu010`)？

## 目錄 (Table of Contents)
- [1. 檔案與模組結構 (File Structure)](#1-檔案與模組結構-file-structure)
- [2. 表單配置規範 (Form Configurations)](#2-表單配置規範-form-configurations)
- [3. 資料存取與 State 模式 (Data & State)](#3-資料存取與-state-模式-data--state)
- [4. Service 實作標準 (Service Patterns)](#4-service-實作標準-service-patterns)
- [5. Grid 與 Component 串接規範 (Grid Integration)](#5-grid-與-component-串接規範-grid-integration)
- [6. 網格新刪修規範 (Grid CRUD Patterns)](#6-網格新刪修規範-grid-crud-patterns)
- [7. 避雷檢查清單 (Checkpoints)](#7-避雷檢查清單-checkpoints)
- [8. 參考標竿 (Source of Truth)](#8-參考範例-source-of-truth)

---

## 1. 核心規範 (Core Mandates)

### 1.1 檔案與模組結構 (File Structure)
完整的 DLP 頁面模組應包含以下七個核心檔案（以 APU030 為例）：
1.  **`apu030.component.ts`**: 進入點，負責初始化 `State` (調用 `init()`)，並將 `*_form.control.ts` 及 `*.control.ts` 的配置綁定至 `State` 內的 Reference。
2.  **`apu030.component.html`**: 視圖，包含 `<app-dlp-form>` 或 `<app-dlp-grid>` 的綁定。
3.  **`apu030.component.scss`**: 樣式。
4.  **`apu030.state.ts`**: 狀態管理，定義 `commonApiParams` 及存放 Form/Grid 的 References (如 `zcp51GridRefs`)。
5.  **`apu030.service.ts`**: 業務邏輯，處理 ApiService 呼叫與資料流轉。
6.  **`apu030-form.control.ts`**: 表單配置，實作 `DlpFieldConfigurationsType[]` (**選配**，若頁面僅有網格且無 `dlp-form` 區塊則不需產生)。
7.  **`apu030.control.ts`**: 網格欄位配置，實作 `DlpColDef[]`。

> [!IMPORTANT]
> **命名規範 (Naming Standards)**:
> - **State 注入**: 在 `FormControl` 或 `Service` 構造函數中，注入的 `State` 變數名稱應包含程式 ID，例如：`private _apu010: Apu010State` (而非 `_state`)。
> - **配置 Getter**: `FormControl` 內的 Getter 名稱應包含程式 ID，例如：`public get apu010FormRefs(): DlpFieldConfigurationsType[]` (而非 `formColDefs`)。

> [!IMPORTANT]
> **註冊規範 (Registration Standard)**:
> 在 `ap.module.ts` 與 `ap-routing.module.ts` 中新增元件時，匯入 (Import) 與宣告 (Declaration/Route) 必須嚴格遵守 **字母排序 (Alphabetical Order)**，並置於正確的區域 (`//#region VNDB` 等)。

---

## 2. 技術細節 (Technical Deep Dive)

### 2.1 表單配置規範 (Form Configurations)
*   **Select**: 用於固定選項 (Local of List)，標誌為 `type: 'select'`。
*   **LOV**: 用於彈窗開窗查詢，標誌為 `type: 'lov'`。
*   **Label/Caption**: 
    - `type: 'label'`: 用於靜態文字提示。
    - `type: 'caption'`: 用於警語或備註，可搭配 `textColor: 'red'`。

#### 2.1.1 屬性與 LOV 規範
*   **禁止使用非法屬性**：如 `color` (應使用 `textColor`)。
*   **LOV 設定：DLP Form vs DLP Grid（差異對照）**：
    - [查看完整差異對照表與警告說明](resources/lov-config-reference.md)
    - [查看 Form LOV 配置範例 (resources/component-patterns.ts:L9)](resources/component-patterns.ts#L9)
    - [查看 Grid LOV 配置範例 (resources/component-patterns.ts:L29)](resources/component-patterns.ts#L29)

> [!TIP]
> Grid LOV 的 `cellEditorParams` **可直接為靜態物件**（不需包成函式），僅當 payload 需依賴 formData 動態決定時，才需改為 `(params) => <IDlpGridLovEditorParams>{ payload: {...}, ... }` 函式形式。
*   **寬度分配**：使用 `width` (百分比) 並搭配 `lineBreak()` 與 `blank()` 達成精確排版。

### 2.2 資料存取與 State 模式 (Data & State)
*   **禁止使用 `getRawValue()`**：應統一使用 `this._state.formRefs.formData` 來取得最新的表單數據（DLP Form 已封裝此屬性）。
*   **State 初始化 (Instantiation)**：
    - **禁止**在屬性定義時使用 `new` 或帶入泛型（如 `public formRefs: DlpFormRefs<T> = ...`）。
    - 必須在 `init()` 方法中進行實例化：`this.formRefs = new DlpFormRefs();`。
*   **Initialization**: 
    - 在 `Service.initUserContext()` 取得全域資訊後，必須調用 `this._state.formRefs.patchValue()` 同步至 UI 顯示。
    - **禁止**直接從 `commonApiParams` 讀取 `userCompanyNo`（應透過後端 `PC_XXX_INIT_DATA` 查詢）。
*   **User Context 預載判定**: 
    - 應檢查 Oracle Forms XML 的 `WHEN-NEW-FORM-INSTANCE` 觸發器。若其中包含查詢使用者資訊或權限的 Logic，才需實作 `Service.initUserContext()`。若無，則應直接執行初始查詢。

### 2.3 Service 實作標準 (Service Patterns)
*   **回傳類型**：Service 方法通常回傳 `void`。
*   **Controller 職責**：
    1. 從 State 讀取參數。
    2. 調用 `ApiService.callSpDataSet`。**警告：必須傳入包含完整 Package 的名稱 (如 'PK_CA_CAR110USD.PC_XX')，並斷言為 `<ICallSpDataSetParams>` 以確立 `payload` 與 `refCursorKeys`。**
    3. 在 `subscribe` 中處理結果並寫回 State（如：無參數調用 `gridRefs.executeQueryByInfo()`）。
*   **錯誤處理**：
    - **禁止**在 `RES_MSG` 中回傳中文（由前端依據代碼轉換）。
    - **不使用輔助函式**：保持 switch 邏輯在 subscribe 內以符合專案標準。
*   **方法宣告規範**：
    Service 與 Component 的方法建議使用「箭頭函式」宣告（如 `public search = () => {}`），以確保作為回呼傳遞時的 `this` 指向正確。
*   **SP 回傳結果判定 (resCode)**：
    - 使用 `executeUpsert` 或 `executeDelete` 時，應透過回呼中的 **`res.resCode`** (而非 `res.result`) 判斷狀態代碼。
    - **Dataset 映射規則 (Table Mapping)**：
        當使用 `callSpDataSet` 且後端開啟多個游標時，無論 `refCursorKeys` 命名為何，前端接收到的 Dataset 鍵值會依照順序固定為 **`Table` (第1個), `Table1` (第2個), `Table2` (第3個)**。
    - **通知類型與業務邏輯內容**：
        - `resCode === '1'` (成功)：使用 `this._noticeService.showSuccess()`。
        - 業務規則違反 (如：金額逾限、互斥、權限)：使用 **`showWarning()`**。
        - 系統嚴重錯誤 (如：ORA 報錯)：使用 `showError()`。
        - 訊息內容應與 Oracle Forms 原始提示一致。

### 2.4 Grid 與 Component 串接規範 (Grid Integration)
*   **`getQueryInfo` 模式**: 
    在 `Component` 設定 `gridConfig` 時，網格的資料來源「必須」透過宣告 `getQueryInfo` 來綁定後端 SP。**底層會自動帶入網格的查詢參數 (`filters`) 與分頁參數，開發者僅需定義額外的業務參數或 SP 名稱。**
*   **欄位類型與篩選 (Column Type & Filtering)**:
    - **必須** 為每個欄位定義 `type: EDlpGridColumnType`。
    - **原因**: 遺漏此屬性將導致網格無法辨識資料型態，造成**預設篩選器 (Filter) 功能失效**。
    - [範例參考 (resources/component-patterns.ts:L15)](resources/component-patterns.ts#L15)
    - [查看 getQueryInfo A/B 情境代碼範例](resources/component-patterns.ts#L51)
*   **分頁計數器 (getRowTotalCount)**:
    - 若 SP 使用 `OUT SYS_REFCURSOR` 回傳總筆數，在 `ApiService` 的 DataSet 映射中通常位於 **`Table1`**。
    - 範例：`getRowTotalCount: (result) => result.dsResult.Table1?.[0]?.TOTAL_COUNT`。
*   **觸發查詢與清空**: 
    - `executeQueryByInfo()` / `clearGrid()` (禁止使用 `clearData()`)。
*   **抑制自動查詢 (suppressAutoSearchAfterReady)**: 
    若網格不應在組件載入完成後立即執行查詢（例如：需要使用者先手動輸入查詢條件），應在 `gridConfig` 中設置 `suppressAutoSearchAfterReady: true`。
*   **觸發器差異 (Trigger Names)**:
    - **Form (表單)**: 應使用 `onChange: (params) => {}`。
    - **Grid (網格 LOV Editor)**: 應使用 `onPostChange: (params) => {}`。
*   **網格編輯器 (Editors)**:
    - **LOV Editor**: 同資源檔中之 [GRID_LOV_SAMPLE (L29)](resources/component-patterns.ts#L29)。
    - **Select Editor**: [查看配置範例 (必須包含 cellRendererEditable) (L82)](resources/component-patterns.ts#L82)。
    - **數值欄位 (Number)**: 必須配置 `precision`, `allowNullNumber: true` 及靠右對齊。
*   **標題多行顯示 (Multi-line Headers)**:
    使用 **`#n~`** 關鍵字並在 `gridConfig` 中設置 `headerHeight: 40`。
*   **日期欄位格式控管 (Date Column Configuration)**:
    - [查看 yyyy/MM/dd 格式化配置範例 (L95)](resources/component-patterns.ts#L95)
*   **ag-grid Import 路徑**: 
    - [查看 @ag-grid-community/core 導入規範](resources/component-patterns.ts#L103)
*   **網格彙總與累計 (Grid Summary)**: 
    - [查看 alignedCellDefs 配置範例 (L107)](resources/component-patterns.ts#L107)
*   **動態行為控管 (dlpGridApi)**: 
    使用 `gridRefs.dlpGridApi.setAllowInsert/Update/Delete()`。
*   **自定義彈窗模式 (Custom Popup Mode)**:
    使用 `appCustomizeModelDialogTemplate` 指令包裹內容。

### 2.5 網格 HTML 宣告與事件綁定 (Grid HTML & Events)
*   **元件標籤**: 必須使用專案標準的 `<dlp-grid>` 與 `<dlp-form>`（禁止使用 `app-` 前綴）。
*   **不要包裹不必要的卡片元件**: 除非特殊排版需要，否則不需要將 `<dlp-grid>` 包裹在 `<mat-card>` 內。
*   **屬性綁定 (Property Binding)**:
    - ✅ 只需綁定 `[gridRefs]="state.myGridRefs"`。
    - ❌ 禁止綁定廢棄屬性：`[gridConfig]`, `[gridProps]`, `[initSearch]`。
- [查看 HTML 事件綁定範例 (resources/component-patterns.ts:L114)](resources/component-patterns.ts#L114)

### 2.6 網格新刪修規範 (Grid CRUD Patterns)
為了發揮 DLP Grid 的底層特性並確保資料操作的原子性，應遵循以下「拆分模式」：

#### 2.6.1 事件與 Service 方法對照
*   **批量儲存 (新增與更新)**：使用 `gridRefs.executeUpsert(spName, { payload: { UpsertData: ... }, hasVarchar2Result: true })`。
*   **單筆即時刪除**：使用 `gridRefs.executeDelete(spName, { payload: { ...keys }, hasVarchar2Result: true })`。

#### 2.6.2 複合主鍵處理
若資料表為複合主鍵（如 `MP081`），在 `executeDelete` 的 `payload` 中必須包含完整的主鍵欄位，不可僅傳送 `ROWID`。

---

---

## 4. 參考範例 (Source of Truth)
*   **Form 配置**: [apu030-form.control.ts](file:///D:/dlp-develop/DLP.Web/DLP.Web.AppPortal/ClientApp/src/app/views/ap/vn/controls/apu030-form.control.ts)
*   **Grid 配置**: [apu030.control.ts](file:///D:/dlp-develop/DLP.Web/DLP.Web.AppPortal/ClientApp/src/app/views/ap/vn/controls/apu030.control.ts)
*   **Service 邏輯**: [apu030.service.ts](file:///D:/dlp-develop/DLP.Web/DLP.Web.AppPortal/ClientApp/src/app/views/ap/vn/services/apu030.service.ts)
    - *重點*: 同步 User Context 的 `patchValue` 寫法，以及 `formData` 的正確調用。
