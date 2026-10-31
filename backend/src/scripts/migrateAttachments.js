require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query, pool } = require('../config/database');

async function migrate() {
  console.log('🔄 Running entry_attachments migration...');
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS entry_attachments (
        id SERIAL PRIMARY KEY,
        entry_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_entry_attachments_entry
          FOREIGN KEY (entry_id)
          REFERENCES entries(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_entry_attachments_entry_id ON entry_attachments(entry_id);
    `);

    console.log('✅ entry_attachments migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
