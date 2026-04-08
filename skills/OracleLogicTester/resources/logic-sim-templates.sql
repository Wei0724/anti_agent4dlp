/* 
 * # Oracle 邏輯模擬與診斷範本 (Logic Simulation Templates)
 */

-- 1. 結構與相依性預檢 (Schema Pre-check)
-- 預警 ORA-00904 或長度超限
SELECT column_name, data_type, data_length, nullable 
  FROM all_tab_columns 
 WHERE table_name = 'MY_TABLE' 
   AND owner = 'MY_OWNER';

-- 2. 權限自適應探測 (Permission Detection)
-- 執行腳本探測 OADBA 權限，若失敗自動切換至 ALL_ 視圖
BEGIN
  EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM DBA_TABLES';
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Using ALL_ views due to limited permissions.');
END;

-- 3. 自動編譯與錯誤查詢 (Auto-Compile & Fix)
-- 標註使用 SKILL: OracleLogicTester
SELECT * FROM all_errors WHERE name = 'MY_PACKAGE' AND type = 'PACKAGE BODY';
