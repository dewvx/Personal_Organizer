const { Pool, types } = require('pg');
require('dotenv').config();

// PostgreSQL OID 1082 is DATE.
// Prevent pg from converting DATE to a JavaScript Date object (which causes timezone shifts to UTC).
// Always parse as clean raw string "YYYY-MM-DD".
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'personal_organizer',
  max: 20, // max connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]: Unexpected error on idle client', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
