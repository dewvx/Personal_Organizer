-- ====================================================================
-- Personal Organizer Initial Seeds (PostgreSQL)
-- ====================================================================

-- 1. หมวดหมู่เริ่มต้น (Starter Categories)
INSERT INTO categories (name, description, icon, color, sort_order)
VALUES 
  ('To-do List', 'งานและกิจกรรมที่ต้องทำให้เสร็จ', 'check-square', '#3B82F6', 1),
  ('Shopping List', 'รายการสินค้าและของใช้ที่ต้องซื้อ', 'shopping-cart', '#10B981', 2),
  ('Expense Notes', 'บันทึกค่าใช้จ่ายและงบประมาณส่วนตัว', 'wallet', '#F59E0B', 3),
  ('Personal Notes', 'บันทึกความคิด ข้อความ และไอเดีย', 'file-text', '#8B5CF6', 4),
  ('Goals', 'เป้าหมายและสิ่งที่ต้องการพัฒนาตนเอง', 'target', '#EC4899', 5),
  ('Reminders', 'สิ่งที่ต้องจำและแจ้งเตือนสำคัญ', 'bell', '#EF4444', 6)
ON CONFLICT (name) DO NOTHING;

-- 2. ข้อมูลตัวอย่างสำหรับทดสอบ (Sample Entries)
INSERT INTO entries (category_id, title, description, entry_date, due_date, status, priority, amount, quantity, tags, is_favorite, is_archived, recurring)
SELECT 
  id,
  'ส่งรายงานสรุปยอดขายประจำเดือน',
  'รวบรวมไฟล์ Excel จากทีมการตลาด และจัดทำ Presentation สรุปส่งผู้บริหาร',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 days',
  'in_progress'::entry_status,
  'high'::entry_priority,
  NULL,
  NULL,
  '["work", "report"]'::jsonb,
  TRUE,
  FALSE,
  'monthly'
FROM categories WHERE name = 'To-do List'
ON CONFLICT DO NOTHING;

INSERT INTO entries (category_id, title, description, entry_date, due_date, status, priority, amount, quantity, tags, is_favorite, is_archived, recurring)
SELECT 
  id,
  'ซื้อของสดและวัตถุดิบทำอาหารที่ตลาด',
  'แวะซื้อที่ตลาดสดช่วงเช้าวันเสาร์',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 day',
  'pending'::entry_status,
  'medium'::entry_priority,
  350.00,
  3,
  '["shopping", "groceries", "market"]'::jsonb,
  TRUE,
  FALSE,
  'weekly'
FROM categories WHERE name = 'Shopping List'
ON CONFLICT DO NOTHING;

INSERT INTO entries (category_id, title, description, entry_date, due_date, status, priority, amount, quantity, tags, is_favorite, is_archived, recurring)
SELECT 
  id,
  'ค่าบริการอินเทอร์เน็ตบ้าน Fiber',
  'ชำระผ่าน Mobile Banking รอบบิลต้นเดือน',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '5 days',
  'pending'::entry_status,
  'medium'::entry_priority,
  640.93,
  NULL,
  '["bills", "utility"]'::jsonb,
  FALSE,
  FALSE,
  'monthly'
FROM categories WHERE name = 'Expense Notes'
ON CONFLICT DO NOTHING;

INSERT INTO entries (category_id, title, description, entry_date, due_date, status, priority, amount, quantity, tags, is_favorite, is_archived, recurring)
SELECT 
  id,
  'ไอเดียฟีเจอร์ใหม่สำหรับ Personal Organizer',
  'อยากเพิ่มระบบ Export เป็น CSV/PDF และระบบสรุปกราฟสถิติรายสัปดาห์',
  CURRENT_DATE,
  NULL,
  'completed'::entry_status,
  'low'::entry_priority,
  NULL,
  NULL,
  '["ideas", "project"]'::jsonb,
  TRUE,
  FALSE,
  'none'
FROM categories WHERE name = 'Personal Notes'
ON CONFLICT DO NOTHING;

-- 3. รายการย่อยสำหรับ "ซื้อของสดและวัตถุดิบทำอาหารที่ตลาด"
INSERT INTO entry_items (entry_id, title, amount, quantity, is_completed, sort_order)
SELECT 
  e.id, 'ผักกาดขาว & บรอกโคลี', 60.00, 1, TRUE, 1
FROM entries e WHERE e.title = 'ซื้อของสดและวัตถุดิบทำอาหารที่ตลาด'
LIMIT 1;

INSERT INTO entry_items (entry_id, title, amount, quantity, is_completed, sort_order)
SELECT 
  e.id, 'แอปเปิลฟูจิ & ส้มสายน้ำผึ้ง', 140.00, 1, FALSE, 2
FROM entries e WHERE e.title = 'ซื้อของสดและวัตถุดิบทำอาหารที่ตลาด'
LIMIT 1;

INSERT INTO entry_items (entry_id, title, amount, quantity, is_completed, sort_order)
SELECT 
  e.id, 'อกไก่ลอกหนัง 1 กก.', 150.00, 1, FALSE, 3
FROM entries e WHERE e.title = 'ซื้อของสดและวัตถุดิบทำอาหารที่ตลาด'
LIMIT 1;
