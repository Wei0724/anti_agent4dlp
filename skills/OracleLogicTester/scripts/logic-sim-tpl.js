import dotenv from 'dotenv';
import oracledb from 'oracledb';

dotenv.config({ path: './.env' });
process.env.NLS_LANG = 'TRADITIONAL CHINESE_TAIWAN.AL32UTF8';

async function simulateLogic() {
    let conn;
    try {
        const config = JSON.parse(process.env.ORACLE_DBS_CONFIG).find(c => c.name === 'VN-SIT');
        conn = await oracledb.getConnection(config);
        
        // --- 範本：模擬觸發器邏輯 ---
        const plsql = `
        DECLARE
            v_val1 VARCHAR2(100) := :p1;
        BEGIN
            -- 1. 邏輯檢查
            -- 2. DML 操作
            UPDATE MY_TABLE SET STATUS = 'P' WHERE ID = v_val1;
            
            -- 自定義回傳或日誌
            DBMS_OUTPUT.PUT_LINE('Executed for ' || v_val1);
        END;
        `;
        
        await conn.execute(plsql, { p1: 'TEST_ID' });
        await conn.commit();
        console.log("Logic simulation committed.");

    } catch (e) {
        console.error(e);
    } finally {
        if (conn) await conn.close();
    }
}
simulateLogic();
