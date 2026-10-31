const { Pool, types } = require('pg');
require('dotenv').config();

// PostgreSQL OID 1082 is DATE.
// Prevent pg from converting DATE to a JavaScript Date object (which causes timezone shifts to UTC).
// Always parse as clean raw string "YYYY-MM-DD".
types.setTypeParser(1082, (val) => val);

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'personal_organizer',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]: Unexpected error on idle client', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  withTransaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
