import { EditableCallbackParams } from '@ag-grid-community/core';

/** 
 * # Oracle UI 實作代碼範例 (UI Implementation Examples)
 */

// 1. 權限與維護狀態控管 (Permission & Maintenance Control)
// 對應 update_allowed = false (僅新增可改)
export const EDITABLE_INSERT_ONLY = {
    editable: (params: EditableCallbackParams) => (params.node as any).isInsertRow()
};

// 2. 數值屬性映射 (Number Mapping)
// Oracle NUMBER -> type: EDlpGridColumnType.number
export const NUMBER_COLUMN_MAPPING = {
    type: 'number', // EDlpGridColumnType.number
    precision: 2, 
    allowNullNumber: true, 
    cellStyle: { 'text-align': 'right' }, // this._pubFunction.rightTextAlign
    valueFormatter: '... (千份位)'
};

// 3. 純顯示符號 (Display Labels in Grid)
// 若 XML 有如 % 的固定提示字，應在 Grid 中獨立佔一欄
export const SYMBOL_COLUMN_SAMPLE = {
    headerName: '', 
    width: 30, 
    valueGetter: () => '%', 
    cellStyle: { 'padding-left': '0px' }, 
    editable: false
};
