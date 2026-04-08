# LOV 設定規範對照表 (DLP Form vs DLP Grid)

| 特性 | DLP Form LOV | DLP Grid LOV |
|---|---|---|
| 型別標記 | `type: 'lov'` | `type: EDlpGridColumnType.lov` |
| 屬性位置 | 直接攤平在欄位物件 | 包裹在 `cellEditorParams: <IDlpGridLovEditorParams>{...}` 內 |
| 動態查詢參數 | `payload: () => ({...})` | 將 `cellEditorParams` 改為函式 `(params) => <IDlpGridLovEditorParams>{...}` |
| 選取後回呼 | `onChange: () => {}` | `onCellValueChanged: (params) => {}` 或 `onPostChange` |

> [!WARNING]
> **最常見錯誤**：在 Grid 的 `cellEditorParams` 中誤用 Form 的屬性攤平寫法，或在 Form 欄位上加了 `cellEditorParams` 包裹，兩者結構完全不同，不可混用。
