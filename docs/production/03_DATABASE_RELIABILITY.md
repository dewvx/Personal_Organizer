# รายงานความน่าเชื่อถือและการจัดการฐานข้อมูล (Database Reliability & Operations)
**โปรเจกต์:** Personal Organizer  
**ฐานข้อมูล:** PostgreSQL 17  
**วันที่ตรวจสอบ:** 31 ตุลาคม 2026  
**ผู้ตรวจสอบ:** Senior Database Administrator & Senior DevOps Engineer  

---

## 1. บทสรุปการประเมินฐานข้อมูล (Database Audit Summary)

ฐานข้อมูลของ Personal Organizer ถูกออกแบบบน PostgreSQL โดยมีการรวม Schema จากทั้ง 5 Phases ไว้อย่างเป็นระเบียบในไฟล์ [`database/schema.sql`](file:///d:/Personal_Organizer/database/schema.sql) มีการใช้ Data Types ที่เหมาะสม (เช่น `DATE`, `NUMERIC(12, 2)`, `JSONB`, `TIMESTAMPTZ`, และ ENUM)

อย่างไรก็ดี ในระดับความพร้อมสำหรับการนำไปใช้งานจริง (Production Reliability) ยังมีจุดที่ต้องปรับปรุงเรื่อง **การเชื่อมต่อ SSL/TLS**, **กลยุทธ์การรัน Migration ที่เป็นมาตรฐาน**, **การป้องกันไฟล์ขยะจากการลบแบบ Cascade**, และ **ขั้นตอนการสำรอง/กู้คืนข้อมูลที่สามารถทดสอบได้จริง**

---

## 2. การตรวจสอบการตั้งค่า Connection Pool

### 2.1 การตั้งค่าปัจจุบันใน Source Code
* **ไฟล์ที่พบ:** [`backend/src/config/database.js`](file:///d:/Personal_Organizer/backend/src/config/database.js#L9-L18)
* **โค้ดที่ใช้งาน:**
  ```javascript
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'personal_organizer',
    max: 20, // max connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  ```

### 2.2 การประเมินทางวิศวกรรม (Engineering Assessment)
* **ข้อดีที่พบ (Verified Strengths):**
  - มีการกำหนด `types.setTypeParser(1082, (val) => val)` ในบรรทัดที่ 7 เพื่อป้องกันไม่ให้ Driver แปลง PostgreSQL `DATE` เป็น JavaScript `Date` ซึ่งจะทำให้เกิดปัญหา Timezone Shifting เพี้ยนไป 1 วันเมื่อแปลงเป็น UTC
  - มีการกำหนด `idleTimeoutMillis: 30000` (ตัด Connection ที่ไม่มีการใช้งานใน 30 วินาที)
  - มีการดักจับ Event `pool.on('error')` เพื่อ Log ปัญหาการเชื่อมต่อ
* **จุดที่ต้องปรับปรุงสำหรับ Production (Recommendations):**
  - **ขาด SSL/TLS Support:** หากโฮสต์ฐานข้อมูลบนคลาวด์ (เช่น AWS RDS, Supabase, DigitalOcean) มักจะบังคับให้เชื่อมต่อผ่าน SSL/TLS แต่ในโค้ดไม่มี Parameter `ssl` รองรับ
  - **Pool Size:** ค่า `max: 20` เหมาะสมสำหรับ Container เดียว แต่หากรันแบบ Multi-instance หรือ Cluster ร่วมกับ PM2 จะทำให้จำนวน Connection รวมเกินขีดจำกัดของ PostgreSQL Server แนะนำให้ปรับตามสูตร `((core_count * 2) + effective_spindle_count)`

---

## 3. การจัดการธุรกรรมข้อมูล (Transaction Management)

### 3.1 การตรวจสอบฟังก์ชัน `withTransaction`
* **ไฟล์ที่พบ:** [`backend/src/config/database.js`](file:///d:/Personal_Organizer/backend/src/config/database.js#L27-L40)
* **รูปแบบการทำงาน:**
  ```javascript
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
  }
  ```

### 3.2 การนำไปใช้งานจริงในโมเดล
* **จุดที่ผ่านการตรวจสอบ (Verified Pass):**
  - การสร้าง Entry พร้อม Checklist Items ใน [`backend/src/models/entryModel.js`](file:///d:/Personal_Organizer/backend/src/models/entryModel.js#L309-L350) มีการใช้ `withTransaction` ครอบคลุมการ Insert ตาราง `entries` และ `entry_items` หากการสร้าง Item ล้มเหลว ข้อมูลหลักจะถูก Rollback ทันที ป้องกันข้อมูลค้างเติ่ง
  - การ Import ข้อมูลสำรอง (`importEntries`) ในบรรทัดที่ 820 ก็ใช้ `withTransaction` ครอบคลุมทั้งขั้นตอน
  - บล็อก `finally { client.release(); }` ทำงานอย่างถูกต้อง ไม่พบปัญหา Connection Leak

---

## 4. ข้อจำกัดความสัมพันธ์ Foreign Key และการเกิดไฟล์ขยะ (Orphan Files)

### 4.1 การตรวจสอบ Foreign Key Constraints
จาก [`database/schema.sql`](file:///d:/Personal_Organizer/database/schema.sql):
1. `entries.category_id` -> `categories(id)` ON DELETE SET NULL ON UPDATE CASCADE
2. `entries.goal_id` -> `goals(id)` ON DELETE SET NULL ON UPDATE CASCADE
3. `entry_items.entry_id` -> `entries(id)` ON DELETE CASCADE ON UPDATE CASCADE
4. `habit_logs.habit_id` -> `habits(id)` ON DELETE CASCADE ON UPDATE CASCADE
5. `entry_attachments.entry_id` -> `entries(id)` ON DELETE CASCADE ON UPDATE CASCADE

### 4.2 ข้อบกพร่องที่ค้นพบ (Critical Operational Flaw)
* เมื่อผู้ใช้สั่งลบรายการ Entry หลัก คำสั่ง `DELETE FROM entries WHERE id = $1` ใน [`backend/src/models/entryModel.js`](file:///d:/Personal_Organizer/backend/src/models/entryModel.js#L515) จะทำงาน
* PostgreSQL จะทำ `ON DELETE CASCADE` ลบแถวข้อมูลในตาราง `entry_attachments` ออกจากฐานข้อมูลโดยอัตโนมัติ
* **แต่ไม่มีโค้ดใดไปสั่งลบไฟล์จริงบนดิสก์ (`fs.unlinkSync`) ในโฟลเดอร์ `/uploads/`!**
* ส่งผลให้ไฟล์รูปภาพและเอกสารที่แนบไว้กลายเป็น **ไฟล์ขยะกำพร้า (Orphan Files)** ตกค้างอยู่บนเซิร์ฟเวอร์ สะสมขนาดดิสก์เพิ่มขึ้นเรื่อยๆ โดยไม่มีการกวาดล้าง
* **แนวทางแก้ไข:** ใน `EntryModel.delete` ต้องค้นหารายการ `file_path` ใน `entry_attachments` ทั้งหมดเพื่อสั่งลบไฟล์บนดิสก์ก่อนส่งคำสั่ง `DELETE FROM entries`

---

## 5. การวิเคราะห์ดัชนีการสืบค้น (Indexes Performance Audit)

ตารางสรุป Indexes ในระบบปัจจุบัน:

| ตาราง | ดัชนี (Index Name) | คอลัมน์ที่ Index | วัตถุประสงค์และการประเมิน |
|---|---|---|---|
| `categories` | `categories_name_key` (Unique) | `name` | ป้องกันชื่อหมวดหมู่ซ้ำ (ผ่าน) |
| `entries` | `idx_entries_category` | `category_id` | เร่งการกรองตามหมวดหมู่ (ผ่าน) |
| `entries` | `idx_entries_status` | `status` | เร่งการกรองตามสถานะ (ผ่าน) |
| `entries` | `idx_entries_due_date` | `due_date` | เร่งการดึงงานที่ครบกำหนด/แจ้งเตือน (ผ่าน) |
| `entries` | `idx_entries_favorite` | `is_favorite` | เร่งหน้า Favorites (ผ่าน) |
| `entries` | `idx_entries_archived` | `is_archived` | เร่งการคัดแยกงานที่จัดเก็บ (ผ่าน) |
| `entries` | `idx_entries_entry_date` | `entry_date` | เร่งการแสดงผลในปฏิทิน (ผ่าน) |
| `entries` | `idx_entries_tags` | `tags USING GIN` | เร่งการค้นหา Tag ภายใน JSONB (ดีมาก) |
| `entries` | `idx_entries_goal` | `goal_id` | เชื่อมโยงงานเข้ากับเป้าหมาย (ผ่าน) |
| `entry_items` | `idx_entry_items_entry_id` | `entry_id` | เร่งการ Join รายการย่อย (ผ่าน) |
| `habit_logs` | `unique_habit_daily_log` | `(habit_id, log_date)` | Unique Constraint ป้องกันการบันทึกซ้ำต่อวัน (ดีเยี่ยม) |
| `push_subscriptions` | `idx_push_subscriptions_endpoint` | `endpoint` | ป้องกันการลงทะเบียนซ้ำ (ผ่าน) |
| `templates` | `idx_templates_is_builtin` | `is_builtin` | แยกเทมเพลตระบบออกจากเทมเพลตผู้ใช้ (ผ่าน) |

* **ข้อเสนอแนะเพิ่มเติม:** แนะนำให้สร้าง Composite Index:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_entries_status_due_archived 
  ON entries (is_archived, status, due_date);
  ```
  เพื่อเพิ่มความเร็วในการรันฟังก์ชัน `NotificationService.checkDueAndNotify()` ซึ่ง Query กรอง `is_archived = false AND status != 'completed' AND due_date <= CURRENT_DATE` บ่อยครั้ง

---

## 6. กลยุทธ์การจัดการ Migration (Database Migration Strategy)

### 6.1 สถานะปัจจุบัน
ปัจจุบันการสร้างตารางและ Migration กระจัดกระจายอยู่ในรูปของสคริปต์ Node เดี่ยวๆ:
- `backend/src/scripts/initDb.js`
- `backend/src/scripts/migrateAttachments.js`
- `backend/src/scripts/migrateGoals.js`
- `backend/src/scripts/migratePhase3.js`
- `backend/src/scripts/migratePhase5.js`
- `backend/src/scripts/migratePush.js`
- `backend/src/scripts/migrateSettings.js`
- `backend/src/scripts/migrateTemplates.js`

### 6.2 ความเสี่ยง
1. ขาดตารางบันทึกประวัติการรัน (`schema_migrations`) ทำให้ไม่ทราบว่าสคริปต์ใดรันไปแล้วบ้าง
2. สคริปต์ `initDb.js` ทำการรัน `database/seeds.sql` เสมอ ซึ่งใน `seeds.sql` มีการ Insert ข้อมูลตัวอย่างโดยไม่มี Unique Constraint บน Title ส่งผลให้ข้อมูลตัวอย่างถูกเพิ่มซ้ำทุกครั้งที่รัน `initDb.js`

### 6.3 แนวทางมาตรฐานสำหรับ Production
นำเครื่องมือ Migration ที่รองรับ Transaction เช่น `node-pg-migrate` มาใช้งาน โดยกำหนดโฟลเดอร์ `database/migrations/`:
```bash
npx node-pg-migrate create add_dashboard_layouts_table
```
ทำให้การรัน Migration เป็นแบบ Idempotent และรองรับการ Rollback คำสั่ง `down` ได้อย่างปลอดภัย

---

## 7. ยุทธศาสตร์การสำรองข้อมูลที่ทดสอบได้จริง (Verifiable Backup Strategy)

### 7.1 ข้อมูลที่ต้องสำรอง
1. **ฐานข้อมูลเชิงสัมพันธ์:** PostgreSQL DB (`personal_organizer`)
2. **ไฟล์แนบทางกายภาพ:** โฟลเดอร์ `backend/uploads/`

### 7.2 สคริปต์สำรองข้อมูลอัตโนมัติ (Automated Backup Script)
สร้างไฟล์สคริปต์ `scripts/backup-db.sh` ที่รันผ่าน Linux Cron หรือ Docker Container:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${POSTGRES_DB:-personal_organizer}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-postgres}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"
UPLOADS_TAR="${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"

echo "📦 [1/3] Starting PostgreSQL backup for ${DB_NAME}..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -F c \
  -b \
  -v \
  -f "${BACKUP_FILE}" \
  "${DB_NAME}"

echo "📁 [2/3] Archiving persistent uploads directory..."
tar -czf "${UPLOADS_TAR}" -C /app uploads

echo "🧹 [3/3] Rotating old backups (Keeping last 7 days)..."
find "${BACKUP_DIR}" -type f -mtime +7 -delete

echo "✅ Backup completed successfully at $(date)!"
```

---

## 8. ยุทธศาสตร์และขั้นตอนการกู้คืนข้อมูล (Verifiable Restore Strategy)

### 8.1 แผนซ้อมกู้คืนข้อมูล (Disaster Recovery Drill)
เพื่อให้มั่นใจว่าไฟล์ Backup สามารถใช้งานได้จริง ให้ทดสอบกระบวนการ Restore ดังนี้:

#### ขั้นตอนที่ 1: เตรียมฐานข้อมูลทดสอบ (Staging / Scratch DB)
```bash
# สร้างฐานข้อมูลจำลองสำหรับทดสอบกู้คืน
createdb -h localhost -U postgres personal_organizer_restore_test
```

#### ขั้นตอนที่ 2: รันคำสั่ง Restore จากไฟล์ Dump
```bash
pg_restore -h localhost -U postgres -d personal_organizer_restore_test -v -c <BACKUP_FILE>.dump
```

#### ขั้นตอนที่ 3: แตกไฟล์ Uploads ไปยังโฟลเดอร์เป้าหมาย
```bash
tar -xzf <UPLOADS_TAR>.tar.gz -C /target_directory/
```

#### ขั้นตอนที่ 4: รันแบบสอบถามเพื่อยืนยันความสมบูรณ์ (Integrity Verification Queries)
รัน SQL เพื่อตรวจสอบจำนวนระเบียนและความสัมพันธ์ของข้อมูล:
```sql
-- 1. ตรวจสอบจำนวนหมวดหมู่และรายการ
SELECT 'categories' AS table_name, count(*) FROM categories
UNION ALL
SELECT 'entries', count(*) FROM entries
UNION ALL
SELECT 'entry_items', count(*) FROM entry_items
UNION ALL
SELECT 'entry_attachments', count(*) FROM entry_attachments
UNION ALL
SELECT 'habits', count(*) FROM habits;

-- 2. ตรวจสอบความถูกต้องของ Foreign Key ที่ไม่มีเจ้าของ (Orphan Records Check)
SELECT count(*) AS orphan_items FROM entry_items WHERE entry_id NOT IN (SELECT id FROM entries);
SELECT count(*) AS orphan_attachments FROM entry_attachments WHERE entry_id NOT IN (SELECT id FROM entries);
```
*เกณฑ์การผ่าน (Acceptance Criteria):* `orphan_items` และ `orphan_attachments` ต้องมีค่าเท่ากับ **0** เสมอ

---

## 9. การปรับปรุงระบบตรวจสอบสุขภาพฐานข้อมูล (Database Health Check)

แก้ไข `backend/src/app.js` ในส่วนของ `/api/health` ให้ทดสอบการ Ping ฐานข้อมูลจริง:

```javascript
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  try {
    const dbRes = await pool.query('SELECT NOW() as db_time, current_database() as db_name');
    const latency = Date.now() - startTime;

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        latencyMs: latency,
        time: dbRes.rows[0].db_time,
        database: dbRes.rows[0].db_name,
        pool: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        }
      }
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});
```
เมื่อตั้งค่าลักษณะนี้ Docker Container Health Check จะสามารถสั่งรีสตาร์ต Service ได้โดยอัตโนมัติทันทีที่การเชื่อมต่อฐานข้อมูลมีปัญหา
