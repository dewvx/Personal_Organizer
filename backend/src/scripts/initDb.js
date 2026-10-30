require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initDatabase() {
  console.log('🔄 Starting PostgreSQL database initialization...');

  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'personal_organizer';

  // 1. Connect to default 'postgres' database to ensure 'personal_organizer' database exists
  const rootPool = new Pool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres',
  });

  try {
    console.log(`Checking if database "${dbName}" exists...`);
    const checkDbRes = await rootPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDbRes.rowCount === 0) {
      console.log(`Creating database "${dbName}"...`);
      await rootPool.query(`CREATE DATABASE "${dbName}" WITH ENCODING 'UTF8';`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('❌ Error checking/creating database:', err.message);
    console.log('👉 Please ensure PostgreSQL is running and password in backend/.env is correct.');
  } finally {
    await rootPool.end();
  }

  // 2. Connect to the target database and execute schema.sql & seeds.sql
  const targetPool = new Pool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const seedsPath = path.resolve(__dirname, '../../../database/seeds.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('Executing schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await targetPool.query(schemaSql);
      console.log('✅ Tables, triggers, and indexes created successfully.');
    }

    if (fs.existsSync(seedsPath)) {
      console.log('Executing seeds.sql...');
      const seedsSql = fs.readFileSync(seedsPath, 'utf8');
      await targetPool.query(seedsSql);
      console.log('✅ Starter categories and sample entries inserted successfully.');
    }

    console.log('🎉 Database initialization complete!');
  } catch (err) {
    console.error('❌ Error executing database scripts:', err.message);
  } finally {
    await targetPool.end();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
