# Oracle Forms XML 分析報告範本 (Output Template)

產出的 `_xml_analysis.md` 必須包含以下標題層級與結構，這將作為後續開發的 SSOT：

```markdown
# [Program ID] XML 分析報告

## 1. 介面階層與排版 (UI Mapping)
- Canvas: CANVAS1 (主畫面)
  - Row 1 (Y: 10): 
    - COMPANY_NO (Text, Prompt: 整帳公司別)
    - YYYYMM (Date, Prompt: 整帳年月)
...

## 2. 資料結構 (Data Model)
- Block: ZCP51_BLK (對應資料網格)
  - 欄位清單 (Name, DataType, MaxLength)
...

## 3. 觸發器與邏輯 (Triggers)
- WHEN-NEW-FORM-INSTANCE: 調用 PC_XXX_INIT ...
- BTN_TRANSFER (WHEN-BUTTON-PRESSED): ...
- POST-QUERY: 抓取關聯名稱 ...
- WHEN-VALIDATE-RECORD: 資料驗證規則 ...

## 4. LOV 查詢 (LOVs)
- LOV_FACTORY: SELECT ... FROM ...
- List Items: 靜態選項 (Values)
```
