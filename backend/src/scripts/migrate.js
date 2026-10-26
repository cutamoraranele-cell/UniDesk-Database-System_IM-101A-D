import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_DIR = path.resolve(__dirname, '../../../database');

export async function runMigrations(overrideUrl = null) {
  const targetUrl = overrideUrl || process.env.DATABASE_URL;
  const isCloud = Boolean(targetUrl && targetUrl.trim() !== '');

  console.log('================================================================');
  console.log(' UNIDESK DATABASE SYSTEM - AUTOMATED MIGRATION & DEPLOYMENT RUNNER');
  console.log('================================================================');

  let connectionConfig;

  if (isCloud) {
    console.log(`Connecting to Cloud Cluster via DATABASE_URL...`);
    connectionConfig = {
      uri: targetUrl,
      multipleStatements: true,
      ssl: { rejectUnauthorized: false }
    };
  } else {
    console.log(`Connecting to MySQL Engine at ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}...`);
    connectionConfig = {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_ADMIN_USER || 'root',
      password: process.env.DB_ADMIN_PASSWORD || '',
      multipleStatements: true
    };
  }

  let connection;
  const results = [];

  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('[SUCCESS] Database Engine Connection Established.\n');

    // Get active database name
    const [dbRows] = await connection.query('SELECT DATABASE() AS currentDb');
    const activeDb = dbRows[0]?.currentDb || 'unidesk_db';
    console.log(`Active Target Database: ${activeDb}\n`);

    const sqlFiles = [
      '01_schema_3nf.sql',
      '02_triggers.sql',
      '03_procedures_functions.sql',
      '04_rbac.sql',
      '05_seed_data.sql'
    ];

    for (const file of sqlFiles) {
      const filePath = path.join(SQL_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`[WARN] File missing: ${filePath}`);
        results.push({ file, status: 'SKIPPED', message: 'File not found' });
        continue;
      }

      console.log(`Executing Module: ${file}...`);
      let sqlContent = fs.readFileSync(filePath, 'utf8');

      // Strip DELIMITER statements for mysql2 driver compatibility
      let cleanedSql = sqlContent
        .replace(/DELIMITER\s+\$\$/gi, '')
        .replace(/DELIMITER\s+;/gi, '')
        .split('$$')
        .join(';');

      // If on cloud DB (e.g. Aiven defaultdb), adapt schema to use the active database
      if (isCloud && activeDb !== 'unidesk_db') {
        cleanedSql = cleanedSql
          .replace(/CREATE DATABASE IF NOT EXISTS `?unidesk_db`?[^;]*;/gi, '')
          .replace(/USE `?unidesk_db`?;/gi, `USE \`${activeDb}\`;`)
          .replace(/`unidesk_db`\./gi, `\`${activeDb}\`.`);
      }

      try {
        await connection.query(cleanedSql);
        console.log(`  -> [SUCCESS] Applied ${file}`);
        results.push({ file, status: 'SUCCESS' });
      } catch (err) {
        // On managed cloud (Aiven/Clever Cloud), RBAC user/role provisioning might have restricted privileges
        if (file === '04_rbac.sql' && isCloud) {
          console.warn(`  -> [WARN] ${file} partially restricted by cloud provider: ${err.message}`);
          results.push({ file, status: 'PARTIAL', warning: err.message });
        } else {
          console.error(`  -> [FAILED] ${file}: ${err.message}`);
          results.push({ file, status: 'FAILED', error: err.message });
          throw err;
        }
      }
    }

    console.log('\n================================================================');
    console.log(' ALL 3NF SCHEMAS, TRIGGERS, PROCEDURES, RBAC & SEEDS DEPLOYED!');
    console.log('================================================================');
    return { success: true, activeDb, results };
  } catch (err) {
    console.error('\n[MIGRATION FAILED]:', err.message);
    return { success: false, error: err.message, results };
  } finally {
    if (connection) await connection.end();
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations().then((res) => {
    if (!res.success) process.exit(1);
  });
}
