-- ====================================================================
-- Personal Organizer Database Schema (PostgreSQL 17 / 18)
-- "One App, All Your Lists."
-- ====================================================================

-- 1. ฟังก์ชันอัตโนมัติสำหรับ updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. สร้าง ENUM Types
DO $$ BEGIN
  CREATE TYPE entry_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE entry_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. ตาราง categories (หมวดหมู่รายการ)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'folder',
  color VARCHAR(20) NOT NULL DEFAULT '#6366F1',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger อัปเดต updated_at ของ categories
DROP TRIGGER IF EXISTS trigger_categories_updated_at ON categories;
CREATE TRIGGER trigger_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. ตาราง entries (รายการและบันทึกข้อมูลยืดหยุ่น)
CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  category_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NULL,
  status entry_status NOT NULL DEFAULT 'pending',
  priority entry_priority NOT NULL DEFAULT 'medium',
  amount NUMERIC(12, 2) NULL,
  quantity INT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  recurring VARCHAR(20) NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_entries_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- เพิ่มคอลัมน์ recurring ในกรณีที่สร้างตาราง entries ไว้ก่อนหน้า
ALTER TABLE entries ADD COLUMN IF NOT EXISTS recurring VARCHAR(20) NOT NULL DEFAULT 'none';

-- Trigger อัปเดต updated_at ของ entries
DROP TRIGGER IF EXISTS trigger_entries_updated_at ON entries;
CREATE TRIGGER trigger_entries_updated_at
BEFORE UPDATE ON entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. ตาราง entry_items (รายการย่อย / Checklist / รายจ่ายย่อยในแต่ละรายการ)
CREATE TABLE IF NOT EXISTS entry_items (
  id SERIAL PRIMARY KEY,
  entry_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NULL DEFAULT 0,
  quantity INT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_entry_items_entry
    FOREIGN KEY (entry_id)
    REFERENCES entries(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Trigger อัปเดต updated_at ของ entry_items
DROP TRIGGER IF EXISTS trigger_entry_items_updated_at ON entry_items;
CREATE TRIGGER trigger_entry_items_updated_at
BEFORE UPDATE ON entry_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Indexes สำหรับการค้นหาและกรองข้อมูล
CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_due_date ON entries(due_date);
CREATE INDEX IF NOT EXISTS idx_entries_favorite ON entries(is_favorite);
CREATE INDEX IF NOT EXISTS idx_entries_archived ON entries(is_archived);
CREATE INDEX IF NOT EXISTS idx_entries_entry_date ON entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_tags ON entries USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_entry_items_entry_id ON entry_items(entry_id);

-- 7. ตาราง app_settings (การตั้งค่าระบบและรหัสความปลอดภัย)
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trigger_app_settings_updated_at ON app_settings;
CREATE TRIGGER trigger_app_settings_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. เพิ่มคอลัมน์ monthly_budget ใน categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12, 2) NULL DEFAULT NULL;

-- 9. ตาราง habits (การติดตามกิจวัตรและสร้างนิสัยเชิงบวก)
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

DROP TRIGGER IF EXISTS trigger_habits_updated_at ON habits;
CREATE TRIGGER trigger_habits_updated_at
BEFORE UPDATE ON habits
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. ตาราง habit_logs (บันทึกความคืบหน้าของกิจวัตรรายวัน)
CREATE TABLE IF NOT EXISTS habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INT NOT NULL,
  log_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_habit_logs_habit
    FOREIGN KEY (habit_id)
    REFERENCES habits(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT unique_habit_daily_log UNIQUE (habit_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, log_date);

-- 11. ตาราง goals (การตั้งเป้าหมายชีวิตและหมุดหมายสำคัญ)
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

DROP TRIGGER IF EXISTS trigger_goals_updated_at ON goals;
CREATE TRIGGER trigger_goals_updated_at
BEFORE UPDATE ON goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- เพิ่มคอลัมน์ goal_id ในตาราง entries
ALTER TABLE entries ADD COLUMN IF NOT EXISTS goal_id INT NULL;

DO $$ BEGIN
  ALTER TABLE entries
    ADD CONSTRAINT fk_entries_goal
    FOREIGN KEY (goal_id)
    REFERENCES goals(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_entries_goal ON entries(goal_id);

-- 12. ตาราง entry_attachments (ไฟล์แนบรูปภาพใบเสร็จ/สลิปโอนเงิน)
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

-- 13. ตาราง push_subscriptions (การลงทะเบียนรับการแจ้งเตือน Web Push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- 14. ตาราง templates (คลังเทมเพลตมาตรฐานและเทมเพลตของผู้ใช้)
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category_name VARCHAR(100) NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'sparkles',
  color VARCHAR(20) NOT NULL DEFAULT '#6366F1',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  estimated_amount NUMERIC(12, 2) NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_templates_is_builtin ON templates(is_builtin);

-- 15. ฟิลด์ข้อมูลกำหนดเอง (FEAT-B4 Custom Schema per Category & Custom Values per Entry)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS custom_schema JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS custom_values JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 16. ตาราง dashboard_layouts (FEAT-E1 Modular Dashboard Layout Configuration)
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id SERIAL PRIMARY KEY,
  layout_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
