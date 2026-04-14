---
name: DlpFrontendStandard
description: DLP 專案前端開發之程式碼結構、State 管理及元件配置規範。
---

# DLP 前端開發開發規範 (DlpFrontendStandard)

本 Skill 旨在規範 DLP 專案中的 Angular 開發標準，避免邏輯回歸、提升代碼一致性並減少常見錯誤。

## 1. 檔案與模組結構 (File Structure)

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
> - **字母排序**: 包含頂部 Import 與陣列清單項，均須按字母排序以減少分支合併衝突。

## 2. 目錄分層規範 (Layered Directory Standards)

嚴禁將非組件核心檔案放入元件目錄中，必須根據職責放置於正確層級：

| 目錄職責 | 標準路徑範例 | 內容物範例 |
| :--- | :--- | :--- |
| **頁面組件 (View)** | `src/app/views/ca/vn/car110/` | `car110.component.ts/html/scss` |
| **狀態管理 (State)** | `src/app/views/ca/vn/states/` | `car110.state.ts` |
| **服務邏輯 (Service)** | `src/app/views/ca/vn/services/` | `car110.service.ts` |
| **欄位配置 (Controls)** | `src/app/views/ca/vn/controls/` | `car110.control.ts` / `car110-form.control.ts` |

---

## 3. 表單配置規範 (Form Configurations)

### 3.1 類型映射 (Field Types)
*   **Select**: 用於固定選項 (Local of List)，標誌為 `type: 'select'`。
*   **LOV**: 用於彈窗開窗查詢，標誌為 `type: 'lov'`。
*   **Label/Caption**: 
    - `type: 'label'`: 用於靜態文字提示。
    - `type: 'caption'`: 用於警語或備註，可搭配 `textColor: 'red'`。

### 3.2 屬性規範
*   **禁止使用非法屬性**：如 `color` (應使用 `textColor`)。
*   **LOV 設定：DLP Form vs DLP Grid（差異對照）**：

    | 特性 | DLP Form LOV | DLP Grid LOV |
    |---|---|---|
    | 型別標記 | `type: 'lov'` | `type: EDlpGridColumnType.lov` |
    | 屬性位置 | 直接攤平在欄位物件 | 包裹在 `cellEditorParams: <IDlpGridLovEditorParams>{...}` 內 |
    | 動態查詢參數 | `payload: () => ({...})` | 將 `cellEditorParams` 改為函式 `(params) => <IDlpGridLovEditorParams>{...}` |
    | 選取後回呼 | `onChange: () => {}` | `onCellValueChanged: (params) => {}` 或 `onPostChange` |

    > [!WARNING]
    > **最常見錯誤**：在 Grid 的 `cellEditorParams` 中誤用 Form 的屬性攤平寫法，或在 Form 欄位上加了 `cellEditorParams` 包裹，兩者結構完全不同，不可混用。

    **DLP Form LOV 範例**（屬性直接攤平，使用 `onChange`）：
    ```typescript
    {
      key: 'FACTORY_NO',
      type: 'lov',
      label: '廠區',
      width: 10,
      colDefs: [
        { headerName: '廠區代號', field: 'SD140_FACTORY_NO', type: EDlpGridColumnType.text },
        { headerName: '廠區名稱', field: 'SD140_NAME_ABE', type: EDlpGridColumnType.text }
      ],
      apiParams: this._state.commonApiParams,
      queryAction: 'PC_APU030_LOV_FACTORY',
      payload: () => ({ COMPANY_NO: this._state.companyNo }), // 動態參數用函式
      refCursorKeys: ['vInfo', 'vCount'],
      checkInput: true,
      keyMapping: {
        FACTORY_NO: 'SD140_FACTORY_NO',    // Form 欄位: LOV 回傳欄位
        FACTORY_NAME: 'SD140_NAME_ABE'
      }
      // onChange: () => {} // 有後續動作時使用
    }
    ```

    **DLP Grid LOV 範例**（屬性包在 `cellEditorParams` 內，使用 `onCellValueChanged`）：
    ```typescript
    {
      field: 'AP340_COMPANY_NO',
      headerName: '公司',
      type: EDlpGridColumnType.lov,
      editable: true,                      // 可為條件式函式
      cellEditorParams: <IDlpGridLovEditorParams>{  // 靜態物件（無動態依賴時）
        keyMapping: {
          AP340_COMPANY_NO: 'SD130_COMPANY_NO',   // Grid 欄位: LOV 回傳欄位
          COMPANY_NAME: 'SD130_CHI_NAME_ABE'      // 同步回填顯示欄位
        },
        colDefs: [
          { headerName: '公司', field: 'SD130_COMPANY_NO', type: EDlpGridColumnType.text },
          { headerName: '簡稱', field: 'SD130_CHI_NAME_ABE', type: EDlpGridColumnType.text }
        ],
        apiParams: this._state.commonApiParams,
        queryAction: 'PC_XXX_LOV_COMPANY',
        refCursorKeys: ['vInfo', 'vCount'],
        checkInput: true
      }
      // onCellValueChanged: (params) => {} // 有後續動作時使用
    }
    ```
    > [!TIP]
    > Grid LOV 的 `cellEditorParams` **可直接為靜態物件**（不需包成函式），僅當 payload 需依賴 formData 動態決定時，才需改為 `(params) => <IDlpGridLovEditorParams>{ payload: {...}, ... }` 函式形式。

*   **寬度分配**：使用 `width` (百分比) 並搭配 `lineBreak()` 與 `blank()` 達成精確排版。

## 4. 資料存取與 API 呼叫模式 (Data & API Patterns)

### 4.1 API 呼叫混合模式
開發者必須根據業務情境，在「通用 SP 呼叫」與「自定義 API 呼叫」之間正確切換。

*   **通用 SP 呼叫** (優先選擇)：對於 80% 的資料處理，應直接使用 `callSpDataSet` 或 `callSp` 呼叫 PL/SQL 包。
    - **範例**：`this._api.callSpDataSet('PK_XXX.PC_QUERY', <ICallSpDataSetParams>{ payload: {}, refCursorKeys: ['vInfo'] })`
*   **自定義 API 呼叫** (特殊模式)：僅當涉及 Excel 匯出 (NPOI) 或複雜後端邏輯時，才使用 `callApi` 呼叫 C# Controller。
    - **範例**：`this._callApi('ExportExcel', payload, { responseType: 'blob' })`

### 4.2 資料存取與 State 規範 (Data & State)
*   **禁止使用 `getRawValue()`**：應統一使用 `this._state.formRefs.formData` 來取得最新數據（DLP Form 已封裝此屬性）。
*   **State 初始化 (Instantiation)**：
    - **禁止**在屬性定義時使用 `new` 或帶入泛型（如 `public formRefs: DlpFormRefs<T> = ...`）。
    - 必須在 `init()` 方法中進行實例化：`this.formRefs = new DlpFormRefs();`。
*   **Initialization**: 
    - 在 `Service.initUserContext()` 取得全域資訊後，必須調用 `this._state.formRefs.patchValue()` 同步至 UI 顯示。
    - **禁止**直接從 `commonApiParams` 讀取 `userCompanyNo`（應透過後端 `PC_XXX_INIT_DATA` 查詢）。
*   **User Context 預載判定**: 
    - 應檢查 Oracle Forms XML 的 `WHEN-NEW-FORM-INSTANCE` 觸發器。若其中包含查詢使用者資訊或權限的 Logic，才需實作 `Service.initUserContext()`。若無，則應執行初始查詢。

## 5. Service 實作標準 (Service Patterns)

*   **回傳類型**：Service 方法通常回傳 `void`。
*   **Controller 職責**：
    1. 從 State 讀取參數。
    2. 調用 `ApiService.callSpDataSet`。
    3. 在 `subscribe` 中處理結果並寫回 State（如：`gridRefs.executeQueryByInfo()`）。
*   **錯誤處理**：
    - **禁止**在 `RES_MSG` 中回傳中文（由前端依據代碼轉換）。
    - **不使用輔助函式**：保持 switch 邏輯在 subscribe 內以符合專案標準。
*   **方法宣告規範**：
    Service 與 Component 的方法建議使用「箭頭函式」宣告（如 `public search = () => {}`），以確保作為回呼傳遞時的 `this` 指向正確。
*   **SP 回傳結果判定 (resCode)**：
    - 使用 `executeUpsert` 或 `executeDelete` 時，應透過回呼中的 **`res.resCode`** (而非 `res.result`) 判斷狀態代碼。
    - **Dataset 映射規則 (Table Mapping)**：
        當使用 `callSpDataSet` 且後端開啟多個游標時，無論 `refCursorKeys` 命名為何，前端接收到的 Dataset 鍵值會依照順序固定為 **`Table` (第1個), `Table1` (第2個), `Table2` (第3個)**。
        - 範例（單一回傳游標）：`const resCode = res.dsResult?.Table?.[0]?.RES_CODE;`
        - 範例（查詢與分頁）：`getRowTotalCount: (result) => result.dsResult?.Table1?.[0]?.TOTAL_COUNT;`
    - **通知類型與業務邏輯內容**：
        - `resCode === '1'` (成功)：使用 `this._noticeService.showSuccess()`。
        - 業務規則違反 (如：金額逾限、互斥、權限)：使用 **`showWarning()`**。
        - 系統嚴重錯誤 (如：ORA 報錯)：使用 `showError()`。
        - 訊息內容應與 Oracle Forms 原始提示一致。

## 6. Grid 與 Component 串接規範 (Grid Integration)

*   **`getQueryInfo` 模式**: 
    在 `Component` 設定 `gridConfig` 時，網格的資料來源「必須」透過宣告 `getQueryInfo` 來綁定後端 SP。**底層會自動帶入網格的查詢參數 (`filters`) 與分頁參數，開發者僅需定義額外的業務參數或 SP 名稱。**
*   **分頁計數器 (getRowTotalCount)**:
    - 若 SP 使用 `OUT SYS_REFCURSOR` 回傳總筆數，在 `ApiService` 的 DataSet 映射中通常位於 **`Table1`**。
    - 範例：`getRowTotalCount: (result) => result.dsResult.Table1?.[0]?.TOTAL_COUNT`。
    
    **情境 A: 基本查詢 (僅帶入額外業務參數)**
    ```typescript
    getQueryInfo: () => {
      return {
        actionOrSpName: 'PK_AP_APU030.PC_APU030_QUERY_ZCP51',
        queryParams: {
          payload: {
            // 僅需放入額外的業務過濾條件，標準網格參數 (StartRow 等) 會由底層自動合併
            COMPANY_NO: this.apu030.companyNo 
          },
          refCursorKeys: ['vInfo', 'vCount']
        }
      };
    }
    ```

    **情境 B: 進階查詢 (使用 extraCondition 帶入非網格過濾條件)**
    若需要透過 `handleExCond` 傳入複雜的 SQL 條件（例如來自另一個網格的選取列）：
    ```typescript
    getQueryInfo: () => {
      const { MP820_SUM_NO } = this.mpi040cn.mp820GridRefs.getSelectedRow();
      return {
        actionOrSpName: 'PC_MPI040CN_QUERY_MP020',
        queryParams: {
          filterCondition: {
            extraCondition: handleExCond(`MP020_SUM_NO = '{0}'`, {
              0: MP820_SUM_NO
            })
          },
          refCursorKeys: ['vMP020Info', 'vMP020Count']
        }
      };
    }
    ```
*   **觸發查詢與清空**: 
    - `executeQueryByInfo()`：若 `gridConfig` 內已定義 `getQueryInfo`，應調用此方法來執行（**避免**使用 `executeQuery()` 以避開參數檢查）。
    - `clearGrid()`：清空網格資料（**禁止**使用 `clearData()`）。
*   **抑制自動查詢 (suppressAutoSearchAfterReady)**: 
    若網格不應在組件載入完成後立即執行查詢（例如：需要使用者先手動輸入查詢條件、或由特定事件觸發），應在 `gridConfig` 中設置 `suppressAutoSearchAfterReady: true`，待需要時再手動呼叫 `executeQueryByInfo()`。
*   **觸發器差異 (Trigger Names)**:
    - **Form (表單)**: 應使用 `onChange: (params) => {}`。
    - **Grid (網格 LOV Editor)**: 應使用 `onPostChange: (params) => {}`。
*   **LOV Editor**: 若網格欄位需要開窗，需配置：
    - `type: EDlpGridColumnType.lov`
    - `cellEditorParams`: 可為靜態物件（`<IDlpGridLovEditorParams>{...}`）或函式（`(params) => <IDlpGridLovEditorParams>{...}`）。
      - **靜態物件**：適用於 `apiParams / queryAction` 固定不變的場景（不需動態抓 formData）。
      - **函式**：適用於需要動態取得表單最新值作為 LOV 查詢條件時。
    - 必填屬性：`keyMapping`、`colDefs`、`apiParams`、`queryAction`、`refCursorKeys`、`checkInput`。

*   **Select Editor（下拉選單）**: 若網格欄位為固定清單下拉，需配置：
    - `type: EDlpGridColumnType.select`
    - `cellRendererEditable: true`（**必填**，缺少此屬性儲存格將顯示為純文字，**無法點擊觸發下拉**）
    - `selectableOptions`: 型別必須為 **`IDlpGridSelectableOption[]`**（❌ 禁止使用 `IDlpGridSelectOption`，該型別不存在）
    - 範例：
    ```typescript
    {
      field: 'AP340_TYPE',
      headerName: '帳戶類別',
      type: EDlpGridColumnType.select,
      editable: true,
      cellRendererEditable: true,   // ← 必填，否則無法點擊
      selectableOptions: of(<IDlpGridSelectableOption[]>[
        { label: '同城帳戶', value: 'A' },
        { label: '異地帳戶', value: 'B' }
      ])
    }
    ```

*   **數值欄位 (Number Editor)**：
    - `type: EDlpGridColumnType.number`
    - `precision: 2`：顯示小數點位數。
    - `allowNullNumber: true`：**重要**，允許欄位為空值（不自動補 0）。
    - `min` / `max`：前端數值範圍限制。
    - `cellStyle: this._pubFunction.rightTextAlign`：數值應靠右對齊。
    - `valueFormatter: this._pubFunction.formatNumber.bind(this, 2)`：顯示千份位與兩位小數。

*   **標題多行顯示 (Multi-line Headers)**：
    若網格標題過長需要換行（對應 Oracle Forms 中的 `&#10;` 或換行），應使用 **`#n~`** 關鍵字：
    - 範例：`headerName: '總帳傳票#n~預錄入日期'`
    - **配合設置**: 在 `Component` 的 `gridConfig` 中加入 `headerHeight: 40` (或更高)，以適應兩行顯示。

*   **日期欄位格式控管 (Date Column Configuration)**：
    網格日期欄位優先使用 `dateFormat` 屬性（底層已封裝 `ag-grid` 的格式化）：
    - 範例：
      ```typescript
      {
          headerName: '關賬日期',
          field: 'AP110_CLOSE_DATE',
          type: EDlpGridColumnType.date,
          dateFormat: 'yyyy/MM/dd'      // ✅ 優先使用此寫法
          // dateValueType: 'string'    // 若後端回傳為 ISO 字串時選用
      }
      ```


*   **ag-grid Import 路徑**: 本專案使用 ag-grid **模組化套件（v27+）**，應從 `@ag-grid-community/core` 匯入型別，**禁止**使用舊版整合包 `ag-grid-community`。
    ```typescript
    // ✅ 正確
    import { EditableCallbackParams } from '@ag-grid-community/core';
    // ❌ 錯誤（找不到模組）
    import { EditableCallbackParams } from 'ag-grid-community';
    ```
*   **網格彙總與累計 (Grid Summary)**: 
    若需在網格底部顯示合計（如金額、數量），應於 `DlpColDef` 中配置 `alignedCellDefs`：
    - `type: 'sum'`
    - `getDataFromQueryResult`: 從 SP 回傳的 Dataset 中提取合計值。
    - 範例：
    ```typescript
    alignedCellDefs: [{
      type: 'sum',
      getDataFromQueryResult: (result) => ({ sum: result.dsResult.vAmtSum?.[0]?.TOTAL_AMT })
    }]
    ```
*   **動態行為控管 (dlpGridApi)**: 
    - 可在 Service 中透過 `gridRefs.dlpGridApi` 調用：
        - `setAllowInsert(bool)` / `setAllowUpdate(bool)` / `setAllowDelete(bool)`: 控制資料維護權限。
        - `setInsertBtnDisabled(bool)`: 專門控制「新增」按鈕狀態。
        - `refreshGrid()`: 刷新網格資料（部分版本適用，或使用 `executeQueryByInfo()`）。
*   **自定義彈窗模式 (Custom Popup Mode)**:
    當 Canvas 需要以彈窗形式呈現（非頁面直接顯示）時：
    1. **HTML**: 使用 `<ng-template appCustomizeModelDialogTemplate key="UniqueKey">` 包裹內容。
    2. **Component**: 使用 `@ViewChildren(CustomizeModelDialogTemplateDirective)` 蒐集模板並存入 State。
    3. **Service**: 呼叫 `MatDialog.open(CustomizeModelDialogComponent, { data: { templates: ... } })` 開啟。
    4. **觸發**: 彈窗內部的網格應由彈窗機制自動觸發查詢，不須手動呼叫 `executeQueryByInfo`。

### 6.2 網格 HTML 宣告與事件綁定 (Grid HTML & Events)

*   **元件標籤**: 必須使用專案標準的 `<dlp-grid>` 與 `<dlp-form>` 標籤（**禁止**使用 `<app-dlp-grid>`、`<app-dlp-form>` 或被遺棄的舊寫法）。
*   **不要包裹不必要的卡片元件**: 除非特殊排版需要，否則不需要將 `<dlp-grid>` 包裹在 `<mat-card>` 與 `<div class="dlp-content-fluid">` 內。若要有標題，請使用專案統一的標題 Directive，例如: `<div dlp-comp-title>{{ '我的標題' | translate }}</div>`。
*   **屬性綁定 (Property Binding)**:
    - ✅ **只需** 綁定 `[gridRefs]="state.myGridRefs"`。
    - ❌ **禁止** 綁定廢棄屬性：`[gridConfig]`, `[gridProps]`, `[initSearch]`。
*   **事件綁定 (Event Binding)**:
    請務必使用標準事件名稱：
    - ✅ `(rowSelected)` (❌ 禁止 `onRowSelected`)
    - ✅ `(rowDoubleClicked)` (❌ 禁止 `onRowDbClick`)
    - ✅ `(save)` (❌ 禁止 `onSaveData`)
    - ✅ `(deleteRow)` (❌ 禁止 `onDeleteRowClick`)
    - ✅ `(gridReady)`

    **範例:**
    ```html
    <div dlp-comp-title>{{ '權限設定檔' | translate }}</div>
    <dlp-grid
      [gridRefs]="state.ap100GridRefs"
      (save)="onAp100GridSave($event)"
      (deleteRow)="onAp100GridDelete($event)"
      (rowSelected)="onAp100GridRowSelected($event)">
    </dlp-grid>
    ```

## 7. 網格新刪修規範 (Grid CRUD Patterns)

為了發揮 DLP Grid 的底層特性並確保資料操作的原子性，應遵循以下「拆分模式」：

### 7.1 事件與 Service 方法對照
*   **批量儲存 (新增與更新)**：
    - **事件**: `(save)="onSave($event)"` (類型: `DlpGridSaveEvent`)。
    - **Service 調用**: 使用 `gridRefs.executeUpsert(spName, { payload: { UpsertData: ... }, hasVarchar2Result: true })`。
    - **邏輯**: 在 Service 中合併 `insertData` 與 `updateData`，並建議為每筆資料加上 `IsNew: 'Y'/'N'` 標記供後端識別。
*   **單筆即時刪除**：
    - **事件**: `(deleteRow)="onDeleteRow($event)"` (類型: `DlpGridDeleteRowEvent`)。
    - **Service 調用**: 使用 `gridRefs.executeDelete(spName, { payload: { ...keys }, hasVarchar2Result: true })`。
    - **重要控管**: 在 Component 中應檢查 `if (!$event.isInsertRow)`，確報僅對已存檔的「舊資料」發動後端請求；剛新增尚未存檔的行（isInsertRow 為 true）僅需底層 UI 抽離即可。

### 7.2 複合主鍵處理
若資料表為複合主鍵（如 `MP081`），在 `executeDelete` 的 `payload` 中必須包含完整的主鍵欄位，不可僅傳送 `ROWID`，以確保業務邏輯的嚴緊性。

## 8. 避雷檢查清單 (Anti-Regression Checklist)
- [ ] **HTML 屬性**：檢查是否誤用了 `[gridConfig]`？ (❌ 禁止，應統一使用 `[gridRefs]`)
- [ ] **HTML 標籤**：檢查是否誤用了 `<app-dlp-grid>`？ (❌ 禁止，應使用標准 `<dlp-grid>`)
- [ ] **State 取得**：檢查是否使用了 `getRawValue()`？ (❌ 禁止，應使用 `formRefs.formData`)
- [ ] **LOV 欄位**：`keyMapping` 是否與後端回傳格式一致？
- [ ] **按鈕動作**：點擊後是否有執行 `patchValue` 或 `refresh`？

## 9. 參考範例 (Reference Implementations - Source of Truth)
*   **Form 配置**: [apu030-form.control.ts](file:///D:/dlp-develop/DLP.Web/DLP.Web.AppPortal/ClientApp/src/app/views/ap/vn/controls/apu030-form.control.ts)
*   **Grid 配置**: [apu030.control.ts](file:///D:/dlp-develop/DLP.Web/DLP.Web.AppPortal/ClientApp/src/app/views/ap/vn/controls/apu030.control.ts)
*   **Service 邏輯**: [apu030.service.ts](file:///D:/dlp-develop/DLP.Web/DLP.Web.AppPortal/ClientApp/src/app/views/ap/vn/services/apu030.service.ts)
    - *重點*: 同步 User Context 的 `patchValue` 寫法，以及 `formData` 的正確調用。
