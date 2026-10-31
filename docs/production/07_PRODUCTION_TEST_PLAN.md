# แผนการทดสอบระบบก่อนขึ้นใช้งานจริง (Production Testing Plan)
**โปรเจกต์:** Personal Organizer  
**วันที่จัดทำ:** 31 ตุลาคม 2026  
**ผู้จัดทำ:** Senior QA Engineer, Senior Backend Engineer, Application Security Engineer  

---

## 1. บทนำและขอบเขตการทดสอบ (Scope of Testing)

เอกสารฉบับนี้กำหนดแผนการทดสอบแบบรอบด้าน (End-to-End Test Plan) เพื่อตรวจสอบความถูกต้อง ความมั่นคงปลอดภัย และเสถียรภาพของระบบ Personal Organizer ก่อนปล่อยขึ้นใช้งานจริง ครอบคลุม 7 โดเมนหลัก พร้อมเกณฑ์การยอมรับ (Acceptance Criteria) ที่ชัดเจน

---

## 2. รายละเอียดแผนการทดสอบรายด้าน (Testing Domains & Acceptance Criteria)

### 2.1 การทดสอบเชิงฟังก์ชัน (Functional Testing)

| รหัสทดสอบ | กรณีทดสอบ (Test Case) | ขั้นตอนการดำเนินการ | ผลลัพธ์ที่คาดหวัง | เกณฑ์การยอมรับ (Acceptance Criteria) |
|---|---|---|---|---|
| **FT-01** | สร้าง Entry พร้อม Checklist และ Tags | กรอกข้อมูลใน EntryFormModal เพิ่ม Checklist 3 รายการ และเลือกหมวดหมู่ | ข้อมูลถูกบันทึก แสดงผลบน All Lists พร้อมสถานะ Checklist ครบถ้วน | ข้อมูลใน PostgreSQL ถูกต้องทั้งตาราง `entries` และ `entry_items` (Pass 100%) |
| **FT-02** | Quick Capture Bar 3-Second Input | พิมพ์คำสั่งด่วน `ซื้อกาแฟ #shopping !high 85` ใน Quick Capture Bar | บันทึกเป็นรายการ "ซื้อกาแฟ" ในหมวด Shopping ความสำคัญ high จำนวนเงิน 85 บาท | Parse ข้อมูลสำเร็จภายใน 3 วินาที ไม่เกิด Error |
| **FT-03** | Shopping Focus Mode | เปิดรายการที่มี Checklist แล้วกดเปิด Shopping Mode ติ๊กรายการซื้อ | รายการที่ติ๊กเปลี่ยนสถานะเป็นขีดฆ่า และมีเสียง/Haptic สั่นตอบรับ | อัปเดต `is_completed` ไปยังฐานข้อมูลทันที |
| **FT-04** | Habit Tracking & Daily Streaks | กดบันทึก Log ของกิจวัตรประจำวันในหน้า Dashboard หรือ Widget | แถบความคืบหน้าเพิ่มขึ้น Streak นับวันต่อเนื่องถูกต้อง | ห้ามบันทึกซ้ำในวันเดียวกัน (`unique_habit_daily_log` ทำงานถูกต้อง) |
| **FT-05** | Template Instantiation | เลือกเทมเพลตมาตรฐาน (เช่น "Packing List") แล้วกดยืนยันสร้าง | สร้าง Entry ใหม่พร้อม Checklist Items ตามที่เทมเพลตกำหนดไว้ | สร้างข้อมูลสำเร็จครบทุก Sub-items |

---

### 2.2 การทดสอบการเชื่อมโยงระบบ (Integration Testing)

| รหัสทดสอบ | กรณีทดสอบ (Test Case) | ขั้นตอนการดำเนินการ | ผลลัพธ์ที่คาดหวัง | เกณฑ์การยอมรับ (Acceptance Criteria) |
|---|---|---|---|---|
| **IT-01** | Database Rollback on Item Creation Failure | จำลองข้อผิดพลาดในตาราง `entry_items` ระหว่างสร้างรายการหลัก | `withTransaction` ทำการ Rollback ทั้งหมด | ตาราง `entries` จะต้องไม่มีแถวหลงเหลืออยู่ (No Partial Writes) |
| **IT-02** | Attachment Upload & Storage Link | อัปโหลดรูปภาพใบเสร็จผ่าน `POST /api/entries/:id/attachments` | บันทึกไฟล์ลงดิสก์ `/uploads/` และบันทึกแถวลง `entry_attachments` | สามารถเรียกดูไฟล์ผ่าน URL `/uploads/<filename>` ได้สมบูรณ์ |
| **IT-03** | Web Push Subscription Flow | กดเปิดรับการแจ้งเตือนใน NotificationSettingsModal | เบราว์เซอร์ขอ Permission และส่ง Endpoint ไปยัง `/api/notifications/subscribe` | มีข้อมูลลงทะเบียนใหม่ในตาราง `push_subscriptions` |

---

### 2.3 การทดสอบความมั่นคงปลอดภัย (Security Testing)

| รหัสทดสอบ | กรณีทดสอบ (Test Case) | เครื่องมือ / คำสั่ง | เกณฑ์การยอมรับ (Acceptance Criteria) |
|---|---|---|---|
| **ST-01** | PIN Authentication Bypass Attempt | ยิง `POST /api/entries/import` โดยไม่ส่ง Token หรือไม่ได้ผ่านการยืนยัน PIN | เซิร์ฟเวอร์ต้องตอบกลับ **401 Unauthorized** (หลังจากติดตั้ง Guard) ห้ามตอบ 200 OK |
| **ST-02** | Rate Limiting Brute-force Prevention | ยิง `POST /api/auth/verify-pin` ด้วยรหัสผิด 10 ครั้งติดต่อกัน | เซิร์ฟเวอร์ต้องตัดการทำงานด้วย **429 Too Many Requests** ทันทีหลังจากครั้งที่ 5 |
| **ST-03** | SQL Injection Fuzzing | ทดสอบส่ง Payload `' OR 1=1 --` ในช่อง Search และ Query Parameters | เซิร์ฟเวอร์ต้องจัดการเป็นข้อความธรรมดา ไม่เกิด SQL Syntax Error หรือ Data Leakage |
| **ST-04** | Stored XSS via File Upload | อัปโหลดไฟล์ `xss.html` ที่มี `<script>alert(1)</script>` | เบราว์เซอร์ต้องไม่รัน Script เมื่อเปิดไฟล์ (ถูกบังคับดาวน์โหลดเป็น Attachment หรือติด CSP) |
| **ST-05** | Zero-Knowledge Encryption Tamper Test | แก้ไขตัวอักษร 1 ไบต์ในไฟล์ Encrypted Backup แล้วสั่ง Import | ฟังก์ชัน Decrypt ต้องปฏิเสธและแจ้งเตือน "รหัสผ่านไม่ถูกต้องหรือไฟล์เสียหาย" |

---

### 2.4 การทดสอบความเสถียรขณะออฟไลน์ (Offline & Sync Testing)

| รหัสทดสอบ | กรณีทดสอบ (Test Case) | ขั้นตอนการดำเนินการ | เกณฑ์การยอมรับ (Acceptance Criteria) |
|---|---|---|---|
| **OT-01** | Add & Mutate Offline Entries | ปิดสัญญาณเน็ต -> สร้าง Entry A -> แก้ไข Entry A -> เปิดเน็ต | เมื่อต่อเน็ต ข้อมูล Entry A บนเซิร์ฟเวอร์ต้องเป็นเวอร์ชันล่าสุดที่ถูกแก้ไข ไม่เกิด 404 |
| **OT-02** | Add & Delete Offline Entries | ปิดเน็ต -> สร้าง Entry B -> ลบ Entry B -> เปิดเน็ต | เมื่อต่อเน็ต ต้องไม่มี Entry B ตกค้างบนเซิร์ฟเวอร์ (Zero Zombie Records) |
| **OT-03** | Network Drop During Sync | ตัดการเชื่อมต่อระหว่างที่ Client กำลังส่งคำสั่งใน Outbox | เมื่อเปิดเน็ตใหม่ ต้องไม่เกิดการสร้างรายการซ้ำซ้อนในฐานข้อมูล (Idempotent Sync) |
| **OT-04** | Service Worker Offline App Shell | ปิดเน็ตแล้วเปิดหน้าเว็บใหม่ (`Hard Refresh`) | หน้าเว็บต้องสามารถเปิดขึ้นมาได้จาก Cache Storage โดยไม่ขึ้นรูปไดโนเสาร์ |

---

### 2.5 การทดสอบประสิทธิภาพและการรับโหลด (Performance Testing)

| รหัสทดสอบ | พารามิเตอร์ทดสอบ | เครื่องมือ | เกณฑ์การยอมรับ (Acceptance Criteria) |
|---|---|---|---|
| **PT-01** | Load Test: 100 Virtual Users Concurrency (CRUD API) | k6 / Autocannon (Duration: 5 นาที) | P95 Response Time < **50ms**, Error Rate = **0.00%** |
| **PT-02** | Dashboard Analytics Load Test | Concurrency: 50 req/sec | P95 Response Time < **80ms**, CPU Usage < **70%** |
| **PT-03** | Core Web Vitals Audit | Google Lighthouse (Mobile Profile) | Performance Score > **90**, LCP < **1.5s**, CLS < **0.02** |
| **PT-04** | Initial JS Bundle Verification | Vite Build Output Inspection | ขนาดไฟล์ JavaScript ก้อนแรกรวมต้อง < **200 kB** (หลังทำ Code-splitting) |

---

### 2.6 การทดสอบการสำรองและกู้คืนข้อมูล (Backup & Disaster Recovery Testing)

| รหัสทดสอบ | กรณีทดสอบ | ขั้นตอนการดำเนินการ | เกณฑ์การยอมรับ (Acceptance Criteria) |
|---|---|---|---|
| **BT-01** | Automated Database Backup Script | รันสคริปต์ `scripts/backup-db.sh` บน Host | ได้ไฟล์ `.dump` และ `uploads.tar.gz` ที่มีขนาดสมบูรณ์ ไม่เป็น 0 byte |
| **BT-02** | Cold Database Restore Drill | สั่ง Drop ฐานข้อมูลทดสอบ แล้วรัน `pg_restore` จากไฟล์ Backup | ข้อมูลตารางทั้งหมดกลับมาครบ 100% และไม่มี Orphan Records ใน `entry_items` |
| **BT-03** | Encrypted Client-Side Backup & Restore | Export Backup ด้วย Password A -> ล้างแคช -> Import ด้วย Password A | ข้อมูล Categories, Entries, Habits กลับมาครบถ้วนสมบูรณ์ |

---

### 2.7 การทดสอบการนำขึ้นระบบจริง (Deployment Verification Testing)

| รหัสทดสอบ | กรณีทดสอบ | เกณฑ์การยอมรับ (Acceptance Criteria) |
|---|---|---|
| **DT-01** | Docker Cold Boot Test | สั่ง `docker compose -f docker-compose.prod.yml up -d` -> ทุก Container (`nginx`, `backend`, `postgres`) ต้องมีสถานะเป็น `healthy` ภายใน 30 วินาที |
| **DT-02** | Data Persistence Test | สั่ง `docker compose down` แล้วสั่ง `up -d` ใหม่ -> ข้อมูลใน Database และไฟล์ใน Uploads ต้องอยู่ครบถ้วน ไม่สูญหาย |
| **DT-03** | SSL Certificate & HTTPS Enforcement | ทดสอบเข้าผ่าน `http://domain.com` -> ต้องถูก 301 Redirect ไปยัง `https://domain.com` ทันที พร้อมเกรด SSL A+ บน SSL Labs |
