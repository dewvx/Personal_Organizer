require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function migrate() {
  console.log('🔄 Running Goals & Milestones Database Migration...');
  try {
    // 1. Create goals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        target_date DATE NULL,
        target_amount NUMERIC(12, 2) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        color VARCHAR(20) NOT NULL DEFAULT '#6366F1',
        icon VARCHAR(50) NOT NULL DEFAULT 'target',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created goals table.');

    // 2. Add goal_id to entries table
    await pool.query(`
      ALTER TABLE entries ADD COLUMN IF NOT EXISTS goal_id INT NULL;
    `);

    try {
      await pool.query(`
        ALTER TABLE entries
          ADD CONSTRAINT fk_entries_goal
          FOREIGN KEY (goal_id)
          REFERENCES goals(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE;
      `);
      console.log('✅ Added fk_entries_goal constraint.');
    } catch (e) {
      console.log('Constraint fk_entries_goal already exists.');
    }

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_entries_goal ON entries(goal_id);
    `);

    // 3. Insert sample goal if empty
    const checkGoals = await pool.query('SELECT COUNT(*) FROM goals');
    if (parseInt(checkGoals.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO goals (title, description, target_date, target_amount, status, color, icon)
        VALUES 
          ('เก็บเงินสำรองฉุกเฉิน 50,000 บาท', 'สร้างกองทุนฉุกเฉินสำหรับครอบครัว', CURRENT_DATE + INTERVAL '90 days', 50000, 'active', '#10B981', 'piggy-bank'),
          ('พัฒนาสุขภาพ & ซ้อมวิ่งมินิมาราธอน', 'วิ่งสะสมระยะทางให้ได้ 100 กม. ใน 3 เดือน', CURRENT_DATE + INTERVAL '60 days', NULL, 'active', '#F59E0B', 'trophy');
      `);
      console.log('✅ Seeded 2 starter goals.');
    }

    console.log('🎉 Goals migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
