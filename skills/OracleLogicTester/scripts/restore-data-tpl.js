import dotenv from 'dotenv';
import oracledb from 'oracledb';

dotenv.config({ path: './.env' });
process.env.NLS_LANG = 'TRADITIONAL CHINESE_TAIWAN.AL32UTF8';

async function restoreData() {
    let conn;
    try {
        const config = JSON.parse(process.env.ORACLE_DBS_CONFIG).find(c => c.name === 'VN-SIT');
        conn = await oracledb.getConnection(config);
        
        // --- 範本：還原測試資料 ---
        console.log("Restoring data...");
        await conn.execute('UPDATE MY_TABLE SET STATUS = NULL WHERE ID = :p1', { p1: 'TEST_ID' });
        await conn.execute('DELETE FROM LOG_TABLE WHERE ID = :p1', { p1: 'TEST_ID' });
        
        await conn.commit();
        console.log("Restoration complete.");

    } catch (e) {
        console.error(e);
    } finally {
        if (conn) await conn.close();
    }
}
restoreData();
