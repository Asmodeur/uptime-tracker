const { Pool } = require('pg');
require('dotenv').config();

let pool;
let isPgConnected = false;
const localDb = require('./local_db');

if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost_mock') {
  try {
    pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'uptime_db',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });
    console.log(`[Database] Connecting to Amazon RDS PostgreSQL at ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}...`);
  } catch (err) {
    console.warn('[Database] Failed to initialize PostgreSQL pool:', err.message);
  }
}

// Universal query dispatcher
async function query(sql, params = []) {
  if (pool) {
    try {
      const res = await pool.query(sql, params);
      isPgConnected = true;
      return res;
    } catch (pgError) {
      console.warn(`[Database] PostgreSQL error (${pgError.message}). Seamlessly falling back to embedded database.`);
      return localDb.query(sql, params);
    }
  }
  return localDb.query(sql, params);
}

module.exports = {
  query,
  isPostgresConnected: () => isPgConnected,
  getMode: () => (pool && isPgConnected ? 'Amazon RDS (PostgreSQL)' : 'Local Emulated Database (RDS Mock)'),
};