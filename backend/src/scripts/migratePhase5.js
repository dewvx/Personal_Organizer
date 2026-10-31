require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query, pool } = require('../config/database');

async function migrate() {
  console.log('🔄 Running Phase 5 (FEAT-B4 & FEAT-E1) database migrations...');
  try {
    // 1. Add custom_schema to categories
    await query(`
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS custom_schema JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);
    console.log('✅ Added custom_schema to categories table.');

    // 2. Add custom_values to entries
    await query(`
      ALTER TABLE entries
      ADD COLUMN IF NOT EXISTS custom_values JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);
    console.log('✅ Added custom_values to entries table.');

    // 3. Create dashboard_layouts table
    await query(`
      CREATE TABLE IF NOT EXISTS dashboard_layouts (
        id SERIAL PRIMARY KEY,
        layout_config JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created dashboard_layouts table.');

    // Insert default dashboard layout if empty
    const existing = await query(`SELECT COUNT(*)::int AS count FROM dashboard_layouts`);
    if (existing.rows[0].count === 0) {
      const defaultLayout = [
        { id: 'stats', label: 'สถิติภาพรวม (Summary Stats)', visible: true, order: 1 },
        { id: 'habits', label: 'กิจวัตรประจำวัน (Daily Habits)', visible: true, order: 2 },
        { id: 'goals', label: 'เป้าหมายชีวิต (Life Goals)', visible: true, order: 3 },
        { id: 'urgent_tasks', label: 'งานด่วนและใกล้ถึงกำหนด (Urgent Tasks)', visible: true, order: 4 },
        { id: 'budget', label: 'งบประมาณรายจ่าย (Category Budgets)', visible: true, order: 5 },
        { id: 'recent_entries', label: 'รายการล่าสุด (Recent Lists)', visible: true, order: 6 },
      ];
      await query(
        `INSERT INTO dashboard_layouts (id, layout_config) VALUES (1, $1) ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(defaultLayout)]
      );
      console.log('✅ Seeded default dashboard layout.');
    }

    console.log('🎉 Phase 5 database migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
