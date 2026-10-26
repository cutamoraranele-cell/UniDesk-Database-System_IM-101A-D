import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_DIR = path.resolve(__dirname, '../../../database');

async function runMigrations() {
  console.log('================================================================');
  console.log(' UNIDESK DATABASE SYSTEM - AUTOMATED MIGRATION & DEPLOYMENT RUNNER');
  console.log('================================================================');

  let connectionConfig;

  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    console.log(`Connecting to Cloud Cluster via DATABASE_URL...`);
    connectionConfig = {
      uri: process.env.DATABASE_URL,
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
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('[SUCCESS] Database Engine Connection Established.\n');

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
        console.error(`[ERROR] File missing: ${filePath}`);
        continue;
      }

      console.log(`Executing Module: ${file}...`);
      let sqlContent = fs.readFileSync(filePath, 'utf8');

      // If the file uses DELIMITER, strip or handle DELIMITER commands for mysql2
      const cleanedSql = sqlContent
        .replace(/DELIMITER\s+\$\$/gi, '')
        .replace(/DELIMITER\s+;/gi, '')
        .split('$$')
        .join(';');

      try {
        await connection.query(cleanedSql);
        console.log(`  -> [SUCCESS] Applied ${file}`);
      } catch (err) {
        console.error(`  -> [FAILED] ${file}: ${err.message}`);
        throw err;
      }
    }

    console.log('\n================================================================');
    console.log(' ALL 3NF SCHEMAS, TRIGGERS, PROCEDURES, RBAC & SEEDS DEPLOYED!');
    console.log('================================================================');
  } catch (err) {
    console.error('\n[MIGRATION FAILED]:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runMigrations();
