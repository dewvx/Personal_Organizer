require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function migrate() {
  console.log('🔄 Running Phase 3 Database Migrations...');
  try {
    // 1. Add monthly_budget to categories
    await pool.query(`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12, 2) NULL DEFAULT NULL;
    `);
    console.log('✅ Added monthly_budget to categories table.');

    // 2. Create habits table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description VARCHAR(255) NULL,
        icon VARCHAR(50) NOT NULL DEFAULT 'check',
        color VARCHAR(20) NOT NULL DEFAULT '#10B981',
        frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
        target_days INT NOT NULL DEFAULT 7,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created habits table.');

    // 3. Create habit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE ON UPDATE CASCADE,
        log_date DATE NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_habit_daily_log UNIQUE (habit_id, log_date)
      );
      CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, log_date);
    `);
    console.log('✅ Created habit_logs table.');

    // 4. Insert starter habits if empty
    const checkHabits = await pool.query('SELECT COUNT(*) FROM habits');
    if (parseInt(checkHabits.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO habits (name, description, icon, color, frequency, target_days, sort_order)
        VALUES 
          ('ดื่มน้ำ 2 ลิตร', 'ดื่มน้ำเปล่าให้ครบ 8 แก้วต่อวันเพื่อสุขภาพที่ดี', 'droplet', '#06B6D4', 'daily', 7, 1),
          ('ออกกำลังกาย 30 นาที', 'คาร์ดิโอหรือเวทเทรนนิ่งเบาๆ', 'activity', '#F59E0B', 'daily', 5, 2),
          ('อ่านหนังสือ 20 นาที', 'อ่านหนังสือหรือบทความพัฒนาตนเอง', 'book-open', '#8B5CF6', 'daily', 7, 3),
          ('นอนก่อน 5 ทุ่ม', 'พักผ่อนให้เพียงพออย่างน้อย 7-8 ชั่วโมง', 'moon', '#3B82F6', 'daily', 7, 4);
      `);
      console.log('✅ Seeded 4 starter habits.');
    }

    console.log('🎉 Phase 3 Database Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
