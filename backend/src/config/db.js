import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let poolConfig;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  // Parse cloud URL (e.g. Aiven MySQL / Clever Cloud)
  poolConfig = {
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  // Local or standard cloud parameters
  poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME || 'unidesk_db',
    user: process.env.DB_USER || 'unidesk_app_user',
    password: process.env.DB_PASSWORD || 'UniDesk#SecureApp2026!',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };
}

export const pool = mysql.createPool(poolConfig);

/**
 * Execute parameterized query using database engine Prepared Statements.
 * Complies with Core Matrix 4 (SQL Injection Prevention).
 */
export async function executeQuery(sql, params = []) {
  const startTime = Date.now();
  const [rows, fields] = await pool.execute(sql, params);
  const durationMs = Date.now() - startTime;
  return { rows, fields, durationMs };
}

/**
 * Execute procedure call with session variable retrieval
 */
export async function executeProcedure(callSql, inParams = [], outVarNames = []) {
  const startTime = Date.now();
  const connection = await pool.getConnection();
  try {
    // 1. Call procedure with IN parameters
    const [callResult] = await connection.execute(callSql, inParams);

    // 2. Fetch OUT variables if specified
    let outValues = {};
    if (outVarNames.length > 0) {
      const selectOutSql = `SELECT ${outVarNames.join(', ')}`;
      const [outRows] = await connection.query(selectOutSql);
      if (outRows && outRows.length > 0) {
        outValues = outRows[0];
      }
    }

    const durationMs = Date.now() - startTime;
    return { callResult, outValues, durationMs };
  } finally {
    connection.release();
  }
}

/**
 * Diagnostic health check verifying connection role & server version
 */
export async function getEngineDiagnostics() {
  const connection = await pool.getConnection();
  try {
    const startTime = Date.now();
    const [userRows] = await connection.query('SELECT CURRENT_USER() AS currentUser, CURRENT_ROLE() AS currentRole, VERSION() AS dbVersion, DATABASE() AS dbName');
    const [tablesRows] = await connection.query("SELECT COUNT(*) AS tableCount FROM information_schema.tables WHERE table_schema = DATABASE()");
    const [triggerRows] = await connection.query("SELECT COUNT(*) AS triggerCount FROM information_schema.triggers WHERE trigger_schema = DATABASE()");
    const [procedureRows] = await connection.query("SELECT COUNT(*) AS routineCount FROM information_schema.routines WHERE routine_schema = DATABASE()");
    const [auditRows] = await connection.query("SELECT COUNT(*) AS auditCount FROM audit_logs");
    const pingLatency = Date.now() - startTime;

    return {
      connected: true,
      currentUser: userRows[0].currentUser,
      currentRole: userRows[0].currentRole,
      dbVersion: userRows[0].dbVersion,
      dbName: userRows[0].dbName,
      host: poolConfig.host || 'Cloud Cluster',
      port: poolConfig.port || 3306,
      tableCount: tablesRows[0].tableCount,
      triggerCount: triggerRows[0].triggerCount,
      routineCount: procedureRows[0].routineCount,
      auditRecordsGenerated: auditRows[0].auditCount,
      latencyMs: pingLatency
    };
  } finally {
    connection.release();
  }
}

export default pool;
