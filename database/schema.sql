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
