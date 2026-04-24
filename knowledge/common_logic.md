# DLP 遷移共用邏輯知識庫 (Shared Knowledge)

## 1. 權限與基礎資料 (Permissions & Base Data)
### Table: `yy011` (使用者權限)
- **用途**: 決定使用者可見的公司別。
- **常用 SQL**:
  ```sql
  select * from yy011 where yy011_user_id = :user_id;
  ```

### Table: `sd130` (公司主檔)
- **用途**: 儲存公司代號與中/英文名稱。
- **欄位**: `sd130_company_no`, `sd130_chi_name_abe`.

## 2. 業務計算邏輯 (Business Functions)
### Function: `CA_GET_STYLE_PRICE`
- **參數**: `(company_no, style, p3, yyyymm)`
- **說明**: 根據年月獲取該型體的單價。
- **應用**: CAR320, CAR110 (預計).

## 3. 資料區塊特性 (Data Blocks)
- **出貨制令**: `ca090` (NTD), `ca090usd` (USD).
- **鞋型體**: `hr410`.
- **指令檔**: `wo020`.
