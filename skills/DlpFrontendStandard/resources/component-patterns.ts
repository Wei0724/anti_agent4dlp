import { EDlpGridColumnType, IDlpGridLovEditorParams, IDlpGridSelectableOption } from 'dlp-shared-datagrid';
import { of } from 'rxjs';

/** 
 * # DLP 前端元件配置模式 (Standard Patterns)
 */

// 1. DLP Form LOV 範例（屬性直接攤平，使用 onChange）
export const FORM_LOV_SAMPLE = {
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
};

// 1.5. DLP Form Radio / Options 範例
export const FORM_RADIO_SAMPLE = {
  key: 'REPORT_TYPE',
  type: 'radio',   // 或者 'select'
  label: '報表類型',
  width: 20,
  defaultValue: 'PREVIEW',
  options$: of([   // ❌ 注意：Form 中絕對不可使用 selectableOptions
    { value: 'PREVIEW', label: '檢核表' },
    { value: 'IN_DUE_FORM', label: '正式' }
  ])
};

// 1.6. DLP Form Button 範例
export const FORM_BUTTON_SAMPLE = {
  text: '執行',
  type: 'button',
  icon: 'play_arrow', // ❌ 注意：Form 的 button 沒有 color 屬性，請使用 icon 輔助
  width: 10,
  onClick: () => {
    // 按鈕動作邏輯
  }
};

// 2. DLP Grid LOV 範例（屬性包在 cellEditorParams 內，使用 onCellValueChanged）
export const GRID_LOV_SAMPLE = {
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
};

// 3. getQueryInfo 實作模式
export const GRID_QUERY_INFO_PATTERNS = {
  // 情境 A: 基本查詢 (僅帶入額外業務參數)
  caseA: () => {
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
  },
  // 情境 B: 進階查詢 (使用 extraCondition 帶入非網格過濾條件)
  caseB: () => {
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
};

// 4. Select Editor (下拉選單)
export const SELECT_EDITOR_SAMPLE = {
  field: 'AP340_TYPE',
  headerName: '帳戶類別',
  type: EDlpGridColumnType.select,
  editable: true,
  cellRendererEditable: true,   // ← 必填，否則無法點擊
  selectableOptions: of(<IDlpGridSelectableOption[]>[
    { label: '同城帳戶', value: 'A' },
    { label: '異地帳戶', value: 'B' }
  ])
};

// 5. Date Column Configuration (日期欄位格式控管)
export const DATE_COLUMN_SAMPLE = {
    headerName: '關賬日期',
    field: 'AP110_CLOSE_DATE',
    type: EDlpGridColumnType.date,
    dateFormat: 'yyyy/MM/dd'      // ✅ 優先使用此寫法
    // dateValueType: 'string'    // 若後端回傳為 ISO 字串時選用
};

// 6. ag-grid Import 路徑 (v27+ 模組化套件)
// ✅ 正確
import { EditableCallbackParams } from '@ag-grid-community/core';
// ❌ 錯誤（找不到模組）
// import { EditableCallbackParams } from 'ag-grid-community';

// 7. Grid Summary (網格彙總與累計)
export const GRID_SUMMARY_SAMPLE = {
  alignedCellDefs: [{
    type: 'sum',
    getDataFromQueryResult: (result) => ({ sum: result.dsResult.vAmtSum?.[0]?.TOTAL_AMT })
  }]
};

// 8. Grid HTML 宣告與事件綁定
export const GRID_HTML_SAMPLE = `
<div dlp-comp-title>{{ '權限設定檔' | translate }}</div>
<dlp-grid
  [gridRefs]="state.ap100GridRefs"
  (save)="onAp100GridSave($event)"
  (deleteRow)="onAp100GridDelete($event)"
  (rowSelected)="onAp100GridRowSelected($event)">
</dlp-grid>
`;

// 9. 標準導入模板 (Standard Import Templates)
// 當無法確定路徑時，請務必先參考此處或詢問使用者，絕對禁止憑空猜測路徑。

/** 
 * ### A. Service 常用導入
 */
/*
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SharedApi } from 'app/shared/api/shared.api';
import { AppLoaderService } from 'dlp-shared-components';
import { 
  ApiService, 
  ICallSpDataSetParams, 
  NotificationService, 
  PubFunctionService, 
  WebHandleService 
} from 'dlp-shared-services';
import { isEmptyValue } from 'dlp-shared-utils';
import { XXXState } from '../states/xxx.state';
*/

/** 
 * ### B. State 常用導入
 */
/*
import { Injectable } from '@angular/core';
import { DlpGridRefs } from 'dlp-shared-datagrid';
import { DlpFormRefs } from 'dlp-shared-form';
import { BaseApiParams, ECommonApiType } from 'dlp-shared-models';
import { AsyncState, StateRefs } from 'dlp-shared-states';
*/

/** 
 * ### C. Control/Component 常用導入
 */
/*
import { 
  DlpColDef, 
  EDlpGridCheckboxValueType, 
  EDlpGridColumnType, 
  IDlpGridLovEditorParams 
} from 'dlp-shared-datagrid';
import { DlpFieldConfigurationsType } from 'dlp-shared-form';
*/
