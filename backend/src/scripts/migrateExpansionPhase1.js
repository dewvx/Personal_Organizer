require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query, pool } = require('../config/database');

async function migrate() {
  console.log('🔄 Running Expansion Phase 1 (Notes, Finance, Smart Reminders) migrations...');
  try {
    // 1. Table notes
    await query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        note_type VARCHAR(20) NOT NULL DEFAULT 'note',
        mood VARCHAR(20) NULL,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        color VARCHAR(20) NOT NULL DEFAULT '#6366F1',
        linked_entry_id INT NULL REFERENCES entries(id) ON DELETE SET NULL,
        linked_goal_id INT NULL REFERENCES goals(id) ON DELETE SET NULL,
        note_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      DROP TRIGGER IF EXISTS trigger_notes_updated_at ON notes;
      CREATE TRIGGER trigger_notes_updated_at
      BEFORE UPDATE ON notes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_notes_note_date ON notes(note_date);
      CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(note_type);
      CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);
      CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON notes(is_archived);
      CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN (tags);
    `);
    console.log('✅ Created notes table and indexes.');

    // 2. Table wallets
    await query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(30) NOT NULL DEFAULT 'cash',
        balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
        icon VARCHAR(50) NOT NULL DEFAULT 'wallet',
        color VARCHAR(20) NOT NULL DEFAULT '#6366F1',
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      DROP TRIGGER IF EXISTS trigger_wallets_updated_at ON wallets;
      CREATE TRIGGER trigger_wallets_updated_at
      BEFORE UPDATE ON wallets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Created wallets table.');

    // Seed default wallet if empty
    const walletCount = await query(`SELECT COUNT(*)::int AS count FROM wallets`);
    if (walletCount.rows[0].count === 0) {
      await query(`
        INSERT INTO wallets (name, type, balance, icon, color, sort_order)
        VALUES 
          ('เงินสด (Cash)', 'cash', 0, 'wallet', '#10B981', 1),
          ('บัญชีธนาคาร (Bank Account)', 'bank', 0, 'building-2', '#3B82F6', 2)
      `);
      console.log('✅ Seeded default wallets (เงินสด, บัญชีธนาคาร).');
    }

    // 3. Table transactions
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        category_id INT NULL REFERENCES categories(id) ON DELETE SET NULL,
        to_wallet_id INT NULL REFERENCES wallets(id) ON DELETE SET NULL,
        type VARCHAR(10) NOT NULL DEFAULT 'expense',
        amount NUMERIC(14, 2) NOT NULL,
        note TEXT NULL,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
        attachment_path VARCHAR(500) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON transactions;
      CREATE TRIGGER trigger_transactions_updated_at
      BEFORE UPDATE ON transactions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_tags ON transactions USING GIN (tags);
    `);
    console.log('✅ Created transactions table and indexes.');

    // 4. Table monthly_budgets
    await query(`
      CREATE TABLE IF NOT EXISTS monthly_budgets (
        id SERIAL PRIMARY KEY,
        category_id INT NULL REFERENCES categories(id) ON DELETE CASCADE,
        year_month VARCHAR(7) NOT NULL,
        budget_amount NUMERIC(14, 2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_budget_per_category_month UNIQUE (category_id, year_month)
      );

      CREATE INDEX IF NOT EXISTS idx_monthly_budgets_ym ON monthly_budgets(year_month);
    `);
    console.log('✅ Created monthly_budgets table.');

    // 5. Table reminders
    await query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        entry_id INT NULL REFERENCES entries(id) ON DELETE CASCADE,
        note_id INT NULL REFERENCES notes(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NULL,
        remind_at TIMESTAMPTZ NOT NULL,
        repeat_type VARCHAR(20) NOT NULL DEFAULT 'none',
        is_sent BOOLEAN NOT NULL DEFAULT FALSE,
        is_snoozed BOOLEAN NOT NULL DEFAULT FALSE,
        snooze_until TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      DROP TRIGGER IF EXISTS trigger_reminders_updated_at ON reminders;
      CREATE TRIGGER trigger_reminders_updated_at
      BEFORE UPDATE ON reminders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
      CREATE INDEX IF NOT EXISTS idx_reminders_is_sent ON reminders(is_sent);
      CREATE INDEX IF NOT EXISTS idx_reminders_entry_id ON reminders(entry_id);
      CREATE INDEX IF NOT EXISTS idx_reminders_note_id ON reminders(note_id);
    `);
    console.log('✅ Created reminders table and indexes.');

    // Update dashboard_layouts default if necessary to include new widgets
    const currentLayout = await query(`SELECT layout_config FROM dashboard_layouts WHERE id = 1`);
    if (currentLayout.rows.length > 0) {
      let layout = currentLayout.rows[0].layout_config;
      if (typeof layout === 'string') layout = JSON.parse(layout);
      const hasFinance = layout.some(w => w.id === 'finance');
      const hasNotes = layout.some(w => w.id === 'notes');
      const hasReminders = layout.some(w => w.id === 'reminders');

      let order = layout.length + 1;
      let modified = false;

      if (!hasFinance) {
        layout.push({ id: 'finance', label: 'สรุปการเงิน (Finance Summary)', visible: true, order: order++ });
        modified = true;
      }
      if (!hasNotes) {
        layout.push({ id: 'notes', label: 'บันทึกด่วน & ไดอารี่ (Recent Notes)', visible: true, order: order++ });
        modified = true;
      }
      if (!hasReminders) {
        layout.push({ id: 'reminders', label: 'การแจ้งเตือนสำคัญ (Smart Reminders)', visible: true, order: order++ });
        modified = true;
      }

      if (modified) {
        await query(`UPDATE dashboard_layouts SET layout_config = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1`, [JSON.stringify(layout)]);
        console.log('✅ Updated dashboard_layouts to include new finance, notes, and reminders widgets.');
      }
    }

    console.log('🎉 Expansion Phase 1 migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrate;
