/* 
 * # DLP 後端 SQL 標準範本 (PL/SQL Templates)
 */

-- 1. 標準 JSON 參數解析架構 (Standard JSON Parsing)
-- 使用 CURSOR 配合 JSON_TABLE 進行解析
-- LOV 程序應具備分頁與過濾能力，參數包含 StartRow, EndRow, FilterCondition, SortCondition 等。
CURSOR ParamObj IS
    SELECT *
      FROM JSON_TABLE(vJsonData, '$'
           COLUMNS (
               StartRow PATH '$.StartRow',
               EndRow PATH '$.EndRow',
               FilterCondition PATH '$.FilterCondition',
               SortCondition PATH '$.SortCondition',
               ...
           )) json_data;
vParam ParamObj%ROWTYPE;


-- 2. 直接跳轉模式 (GOTO Exit Pattern)
-- 為了確保在多重檢查邏輯中能「直接跳轉」至最後的游標開啟動作，建議使用 GOTO 標籤與 SYS_REFCURSOR。
IF 條件不符 THEN
   vResCode := '-2';
   GOTO SEND_RESULT;
END IF;
...
<<SEND_RESULT>>
OPEN vResult FOR SELECT vResCode AS RES_CODE FROM DUAL;


-- 3. SQLERRM 安全賦值格式 (SQLERRM Safe Pattern)
-- ✅ 正確寫法：先賦值給區域變數。Oracle 不允許將 SQLERRM 直接放在 OPEN ... FOR SELECT 的欄位清單中。
EXCEPTION
  WHEN OTHERS THEN
    vResCode := '-1';
    vResMsg  := SQLERRM; -- ✅ 必須先賦值給變數
    OPEN vResult FOR SELECT vResCode AS RES_CODE, vResMsg AS RES_MSG FROM DUAL;


-- 4. 標準分頁查詢邏輯 (vSQLStmt Pattern)
-- 為了支援 Ag-Grid 的動態過濾與排序，應統一使用 vSQLStmt 字串變數進行構建。
vSQLStmt := 'SELECT Row_Number() Over(ORDER BY ' || vParams.SortCondition || ' 預設排序欄位 ) ITEM, A.* FROM (...) A WHERE ' || NVL(vParams.FilterCondition, '1=1');

-- 開啟分頁游標
OPEN vInfo FOR 'SELECT * FROM (SELECT A.*, ROWNUM RN FROM (' || vSQLStmt || ') A WHERE ROWNUM <= ' || NVL(vParams.EndRow, 999999) || ') WHERE RN >= ' || NVL(vParams.StartRow, 1);
-- 開啟總數游標
OPEN vCount FOR 'SELECT COUNT(*) AS TOTAL_COUNT FROM (' || vSQLStmt || ')';


-- 5. 彙總合計游標 (Aggregation Cursor Pattern)
-- 若前端需要顯示合計值（如 Summary Row），應在 Procedure 中額外開啟一個快照式的 Cursor。
vSumStmt := 'SELECT SUM(AMT) AS TOTAL_AMT FROM (' || vSQLStmt || ')';
OPEN vAmtSum FOR vSumStmt;
