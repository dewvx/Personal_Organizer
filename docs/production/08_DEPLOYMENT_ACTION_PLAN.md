# แผนการดำเนินงานและเตรียมความพร้อมสู่การใช้งานจริง (Deployment Action Plan)
**โปรเจกต์:** Personal Organizer  
**สถานะปัจจุบัน:** รอการแก้ไข P0 Blockers และรอการอนุมัติก่อนเริ่มดำเนินการ  
**วันที่จัดทำ:** 31 ตุลาคม 2026  
**ผู้จัดทำ:** Senior DevOps Engineer, Senior Backend Engineer, Application Security Engineer  

---

## 1. ข้อกำหนดสำคัญด้านความปลอดภัย (Important Safeguard Notice)

> 🛑 **คำเตือนสำคัญ (Deployment Gate):**  
> งานในขั้นตอนนี้เป็นขั้นตอนการตรวจสอบและวางแผน (Audit & Planning) เท่านั้น  
> **ห้ามเริ่มกระบวนการ Deploy หรือเปลี่ยนแปลงการตั้งค่าบนเครื่องเซิร์ฟเวอร์จริงจนกว่าจะได้รับความเห็นชอบและอนุมัติจากผู้ใช้**

---

## 2. แผนการดำเนินงานเรียงตามลำดับความสำคัญ (Prioritized Action Plan)

### 🔴 Phase 0: การแก้ไขข้อบกพร่องวิกฤตที่ขัดขวางการ Deploy (P0 Blockers)

| ลำดับ | รายการงาน (Task Description) | ไฟล์ที่ต้องแก้ไข / สร้างเพิ่ม | ผลลัพธ์ที่ต้องการ |
|---|---|---|---|
| **P0-1** | **กำจัด Hardcoded Private Key ใน Web Push** | - [`backend/src/config/webPush.js`](file:///d:/Personal_Organizer/backend/src/config/webPush.js)<br>- `backend/.env.example` | ลบ Fallback String ทั้งหมด บังคับให้อ่านจาก `process.env` เท่านั้น หากไม่มีค่าให้เซิร์ฟเวอร์หยุดทำงานทันที (Fail-fast) |
| **P0-2** | **ป้องกัน API ด้วย PIN Session / Access Token** | - `backend/src/middlewares/authGuard.js` *(ใหม่)*<br>- [`backend/src/controllers/authController.js`](file:///d:/Personal_Organizer/backend/src/controllers/authController.js)<br>- [`backend/src/routes/entryRoutes.js`](file:///d:/Personal_Organizer/backend/src/routes/entryRoutes.js)<br>- [`backend/src/routes/categoryRoutes.js`](file:///d:/Personal_Organizer/backend/src/routes/categoryRoutes.js)<br>- [`frontend/src/services/api.ts`](file:///d:/Personal_Organizer/frontend/src/services/api.ts)<br>- [`frontend/src/App.tsx`](file:///d:/Personal_Organizer/frontend/src/App.tsx) | เมื่อปลดล็อก PIN ถูกต้อง ออก Token และให้ Axios แนบ `Authorization: Bearer <token>` ไปกับทุก Request บล็อกไม่ให้ภายนอกยิง Import/Export หรือลบข้อมูลได้ |
| **P0-3** | **ป้องกัน Stored XSS และจำกัดสิทธิ์โฟลเดอร์ Uploads** | - [`backend/src/middlewares/upload.js`](file:///d:/Personal_Organizer/backend/src/middlewares/upload.js)<br>- [`backend/src/app.js`](file:///d:/Personal_Organizer/backend/src/app.js) | ตรวจสอบ File Magic Bytes Header จริง บังคับใช้นามสกุลไฟล์ที่ปลอดภัย และใส่ Header `Content-Disposition: attachment` ป้องกันเบราว์เซอร์รัน HTML/SVG |
| **P0-4** | **ปรับปรุง Database Health Check ให้ Probe ฐานข้อมูลจริง** | - [`backend/src/app.js`](file:///d:/Personal_Organizer/backend/src/app.js#L24-L30) | เพิ่ม `pool.query('SELECT 1')` ใน `/api/health` หากต่อ DB ไม่ได้ให้คืน HTTP 503 |
| **P0-5** | **แก้ไขปัญหา Negative ID Mutation ในระบบ Offline Sync** | - [`frontend/src/services/entryService.ts`](file:///d:/Personal_Organizer/frontend/src/services/entryService.ts)<br>- [`frontend/src/hooks/useNetworkSync.ts`](file:///d:/Personal_Organizer/frontend/src/hooks/useNetworkSync.ts) | เพิ่ม ID Mapping Table หรือเปลี่ยนระบบ ID ให้ใช้ UUID เพื่อไม่ให้คำสั่ง Update/Delete ของรายการที่สร้างตอนออฟไลน์เกิด 404 และข้อมูลสูญหาย |

---

### 🟡 Phase 1: การเสริมความมั่นคงปลอดภัยและเสถียรภาพ (P1 Security & Reliability Hardening)

| ลำดับ | รายการงาน (Task Description) | ไฟล์ที่ต้องแก้ไข / สร้างเพิ่ม | ผลลัพธ์ที่ต้องการ |
|---|---|---|---|
| **P1-1** | **ติดตั้ง Security Headers และ Rate Limiting** | - [`backend/package.json`](file:///d:/Personal_Organizer/backend/package.json)<br>- [`backend/src/app.js`](file:///d:/Personal_Organizer/backend/src/app.js) | ติดตั้ง `helmet` และ `express-rate-limit` จำกัดการ Brute-force PIN และจำกัด Request DoS |
| **P1-2** | **สร้าง Automated Scheduler สำหรับงานแจ้งเตือน** | - `backend/src/services/schedulerService.js` *(ใหม่)*<br>- [`backend/server.js`](file:///d:/Personal_Organizer/backend/server.js)<br>- [`backend/package.json`](file:///d:/Personal_Organizer/backend/package.json) | ติดตั้ง `node-cron` เพื่อรัน `NotificationService.checkDueAndNotify()` อัตโนมัติทุกเช้าเวลา 08:00 น. ตามเวลาไทย (Asia/Bangkok) |
| **P1-3** | **ลบไฟล์แนบจริงบนดิสก์เมื่อ Entry ถูกลบ (ป้องกัน Orphan Files)** | - [`backend/src/models/entryModel.js`](file:///d:/Personal_Organizer/backend/src/models/entryModel.js#L515-L519) | เพิ่มคำสั่งค้นหาและลบไฟล์ใน `/uploads/` ก่อนสั่ง `DELETE FROM entries` |
| **P1-4** | **จัดระเบียบ Database Migration และ Seed Data** | - `backend/src/scripts/initDb.js`<br>- `database/schema.sql`<br>- `database/seeds.sql` | ป้องกันการ Insert ข้อมูลซ้ำเมื่อรันซ้ำ และเพิ่มตารางควบคุม Migration |

---

### 🔵 Phase 2: การปรับปรุงประสิทธิภาพและ Bundle (P2 Performance Optimization)

| ลำดับ | รายการงาน (Task Description) | ไฟล์ที่ต้องแก้ไข / สร้างเพิ่ม | ผลลัพธ์ที่ต้องการ |
|---|---|---|---|
| **P2-1** | **ทำ Code-Splitting แยกหน้าจอและโมดอลด้วย React.lazy** | - [`frontend/src/App.tsx`](file:///d:/Personal_Organizer/frontend/src/App.tsx) | ลดขนาด Bundle แรกจาก 586 kB ให้เหลือต่ำกว่า 200 kB |
| **P2-2** | **แยก Vendor Chunks ใน Vite Configuration** | - [`frontend/vite.config.ts`](file:///d:/Personal_Organizer/frontend/vite.config.ts) | แยก `react`, `lucide-react`, `axios` ออกเป็นก้อนแยกเพื่อให้เบราว์เซอร์แคชได้ |
| **P2-3** | **เพิ่มระบบ Pagination ควบคุมการแสดงผลรายการขนาดใหญ่** | - [`frontend/src/pages/AllListsPage.tsx`](file:///d:/Personal_Organizer/frontend/src/pages/AllListsPage.tsx) | ป้องกันอาการกระตุกเมื่อเรนเดอร์รายการเกิน 50 รายการ |
| **P2-4** | **เปิดใช้งาน HTTP Compression ใน Express** | - [`backend/src/app.js`](file:///d:/Personal_Organizer/backend/src/app.js) | ติดตั้ง `compression` middleware ลดขนาด Payload ลง 60-70% |

---

### 🟢 Phase 3: การจัดเตรียมคอนเทนเนอร์และกระบวนการ Deploy (P3 Production Infrastructure)

| ลำดับ | รายการงาน (Task Description) | ไฟล์ที่ต้องแก้ไข / สร้างเพิ่ม | ผลลัพธ์ที่ต้องการ |
|---|---|---|---|
| **P3-1** | **สร้าง Multi-stage Production Dockerfiles** | - `backend/Dockerfile.prod`<br>- `frontend/Dockerfile.prod` | สร้าง Image ขนาดเล็ก ปลอดภัย รันด้วยสิทธิ์ `USER node` |
| **P3-2** | **จัดเตรียมการตั้งค่า Nginx Reverse Proxy และ SSL** | - `nginx/nginx.conf`<br>- `nginx/conf.d/default.conf` | จัดการ SSL Termination, บังคับ HTTPS, และกำหนด Security Headers |
| **P3-3** | **สร้าง Docker Compose สำหรับ Production Environment** | - `docker-compose.prod.yml`<br>- `.env.production.example` | ผูก Network ภายใน, Persistent Volumes และ Restart Policy |
| **P3-4** | **สร้างสคริปต์สำรองข้อมูลอัตโนมัติ (Automated Backup Script)** | - `scripts/backup-db.sh` | สคริปต์รันผ่าน Cron บน Host ทำ `pg_dump` และ Archive โฟลเดอร์ `uploads/` |

---

## 3. รายการตรวจสอบก่อนปล่อยระบบ (Pre-Flight Verification Checklist)

ก่อนเปิดรับทราฟฟิกจริง ต้องตรวจสอบรายการต่อไปนี้ทั้งหมด (Check off ทุกข้อ):

- [ ] **1. Secrets Inspection:** ตรวจสอบว่าไม่มีรหัสผ่าน, Private VAPID Key หรือ Database String ค้างอยู่ใน Git Commit History
- [ ] **2. Environment Variables:** ยืนยันว่าไฟล์ `.env.production` บนเซิร์ฟเวอร์กรอกค่าครบถ้วนและปลอดภัย (รหัสผ่าน DB มีความยาวอย่างน้อย 24 ตัวอักษร)
- [ ] **3. SSL/TLS Certificate:** ตรวจสอบใบรับรอง Let's Encrypt บนโดเมนจริง และตรวจสอบการ Redirect จาก HTTP เป็น HTTPS 100%
- [ ] **4. Database Connection:** ทดสอบเรียก `/api/health` ต้องตอบกลับ `status: "ok"` พร้อมแสดง Latency ของ DB ต่ำกว่า 10ms
- [ ] **5. Web Push Notification:** ทำการส่ง Test Push Notification ไปยังอุปกรณ์ทดสอบเพื่อยืนยันว่า VAPID Keys คู่ใหม่ทำงานถูกต้อง
- [ ] **6. Offline Storage:** ทดสอบปิดเน็ต บันทึกรายการใหม่ และเปิดเน็ตเพื่อยืนยันว่าข้อมูลซิงค์ขึ้นเซิร์ฟเวอร์โดยไม่เกิด Error 404
- [ ] **7. Encrypted Backup:** ทดสอบ Export และ Import ไฟล์สำรองข้อมูลที่เข้ารหัสด้วย Web Crypto API
- [ ] **8. Security Headers:** ตรวจสอบความสมบูรณ์ของ Headers ผ่าน https://securityheaders.com ให้ได้คะแนนอย่างน้อยระดับ A

---

## 4. แผนการย้อนกลับกรณีเกิดเหตุฉุกเฉิน (Rollback Plan)

หากพบปัญหาขัดข้องร้ายแรงหลัง Deploy เช่น ฐานข้อมูลเสียหาย หรือ Container ไม่สามารถเปิดบริการได้ ให้ปฏิบัติตามขั้นตอนดังนี้:

1. **สลับทราฟฟิก (Traffic Isolation):**
   เปลี่ยนการตั้งค่า Nginx ให้ชี้ไปยังหน้าบำรุงรักษา (`maintenance.html`) ชั่วคราว:
   ```bash
   cp /usr/share/nginx/html/maintenance.html /usr/share/nginx/html/index.html
   ```
2. **หยุดบริการคอนเทนเนอร์:**
   ```bash
   docker compose -f docker-compose.prod.yml stop backend
   ```
3. **กู้คืนฐานข้อมูลจาก Snapshot ล่าสุด:**
   ```bash
   pg_restore -h localhost -U postgres -d personal_organizer_prod -c /backups/latest_stable.dump
   ```
4. **Rollback Source Code / Docker Image:**
   สั่ง Pull หรือ Checkout กลับไปยัง Git Tag เวอร์ชันเสถียรก่อนหน้า:
   ```bash
   git checkout tags/v1.0.0-stable
   docker compose -f docker-compose.prod.yml up -d --build
   ```
5. **ทดสอบยืนยันระบบ:**
   รันแบบสอบถาม Integrity Check และตรวจสอบ `/api/health` ก่อนเปิดให้ผู้ใช้เข้าใช้งานอีกครั้ง
