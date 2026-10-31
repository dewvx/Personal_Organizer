# รายการตรวจสอบความปลอดภัยระดับโปรดักชัน (Production Security Checklist)
**โปรเจกต์:** Personal Organizer  
**มาตรฐานอ้างอิง:** OWASP Top 10 (2021), CIS Benchmark, Web Application Security Guidelines  
**วันที่ตรวจสอบ:** 31 ตุลาคม 2026  
**ผู้ตรวจสอบ:** Application Security Engineer & Senior Backend Engineer  

---

## 1. ผลการประเมินสรุป (Security Audit Summary)

จากการตรวจสอบความปลอดภัยในระดับ Source Code, สถาปัตยกรรม Network, และการจัดเก็บข้อมูล พบว่าระบบมีจุดแข็งในด้าน **Client-Side Zero-Knowledge Encryption (PBKDF2 + AES-GCM)** และการใช้ **Parameterized Queries** ที่ป้องกัน SQL Injection ได้อย่างดีเยี่ยม

อย่างไรก็ตาม พบช่องโหว่ร้ายแรง (Critical Severity) หลายจุดในระดับ API Authentication, File Upload Handling และการจัดเก็บรหัสลับ ซึ่งจำเป็นต้องได้รับการแก้ไขทันทีก่อนนำขึ้นสู่สภาพแวดล้อม Production

---

## 2. ตารางตรวจสอบและสถานะความปลอดภัย (Security Checklist Matrix)

| หัวข้อความปลอดภัย | สถานะปัจจุบัน | ระดับความเสี่ยง | ผลการตรวจสอบจริง (Verified Finding) | คำแนะนำสำหรับ Production (Recommendation) |
|---|---|---|---|---|
| **Environment Variables** | ⚠️ Partial Pass | Medium | มีไฟล์ `.env` สำหรับ Development ใน `.gitignore` แต่ขาดการตรวจสอบตัวแปร (Validation) ตอนเริ่มระบบ | ใช้ `zod` หรือ `dotenv-safe` ตรวจสอบตัวแปรที่จำเป็นตอน Boot up หากขาดตัวแปรให้ Throw Error ทันที |
| **Secret Management** | 🛑 Fail | **Critical** | พบค่าสำรอง Hardcoded Fallback VAPID Private/Public Key ในไฟล์ `backend/src/config/webPush.js` บรรทัดที่ 3-4 | ลบ Fallback String ทิ้งทันที บังคับอ่านจาก Environment Variables เท่านั้น และหมุนเวียน (Rotate) คีย์ใหม่ก่อน Deploy |
| **CORS Policy** | ⚠️ Partial Pass | High | โค้ดใน `backend/src/app.js` กำหนด Origin เป็น `process.env.CLIENT_URL || '*'` หากไม่ใส่ตัวแปรจะเปิดกว้างให้ทุกโดเมนเข้าถึงได้ | กำหนดค่า Whitelist เฉพาะ Trusted Domains เช่น `https://organizer.yourdomain.com` และปิด Wildcard |
| **HTTPS Requirements** | 🛑 Blocked | **Critical** | ระบบปัจจุบันยังไม่มี TLS/SSL Termination ทำให้ฟังก์ชันสำคัญอย่าง Web Crypto API (`window.crypto.subtle`), Service Worker PWA, และ Web Push API ไม่สามารถทำงานได้บนโดเมนจริง | ต้องติดตั้ง Nginx Reverse Proxy พร้อม Let's Encrypt SSL/TLS 1.3 และตั้งค่า HSTS เพื่อบังคับ HTTPS ทั้งหมด |
| **HTTP Security Headers** | 🛑 Fail | High | เซิร์ฟเวอร์ Express ขาด Security Headers พื้นฐาน เช่น Content-Security-Policy, X-Frame-Options, X-Content-Type-Options | ติดตั้งโมดูล `helmet` ใน `app.js` เพื่อกำหนด Headers ป้องกัน Clickjacking, MIME Sniffing, และ Cross-Origin Attacks |
| **Rate Limiting** | 🛑 Fail | High | ไม่มี Middleware จำกัดอัตราการเรียก API ทำให้เสี่ยงต่อการถูก Brute-force รหัส PIN, Denial of Service (DoS) หรือการสแปมคิว Push Notification | ติดตั้ง `express-rate-limit` กำหนด Global Limit 100 req/15min และ Strict Limit สำหรับ `/api/auth/verify-pin` 5 req/min |
| **Input Validation** | ⚠️ Partial Pass | Medium | ตรวจสอบข้อมูลแบบ Ad-hoc (เช่น เช็ก `!title.trim()`) ขาด Schema Validation ที่รัดกุมสำหรับ Data Types | นำ Zod หรือ Joi มาใช้ทำ Request Body Schema Validation ก่อนเข้าถึง Controller Layer |
| **File Upload Validation** | 🛑 Fail | **Critical** | ตรวจสอบเฉพาะ MIME Type จาก Header ฝั่งไคลเอนต์ (`file.mimetype`) และใช้นามสกุลไฟล์เดิมจากผู้ใช้ เสี่ยงต่อการอัปโหลด Script หรือ HTML ปลอมแปลง | ตรวจสอบ File Magic Bytes Header จริง (เช่น ใช้ `file-type`), สุ่มสร้างนามสกุลใหม่ตาม Type จริง และจำกัดขนาดไม่เกิน 5MB |
| **File Access Control** | 🛑 Fail | High | โฟลเดอร์ `/uploads` ถูกเปิดผ่าน `express.static()` โดยตรง ใครก็ตามที่มี URL สามารถเข้าถึงไฟล์แนบส่วนบุคคลได้โดยไม่มีการยืนยันตัวตน | ทำ Private Static Serving หรือย้ายมาให้บริการผ่าน Route `/api/attachments/:id/download` ที่ตรวจสิทธิ์ผู้ใช้ก่อน |
| **SQL Injection** | ✅ Pass | Safe | จากการตรวจสอบทุกโมเดลใน `backend/src/models/*.js` ใช้ Parameterized Queries (`$1, $2, ...`) ทั้งหมด ไม่พบ String Concatenation ใน SQL | รักษาแนวปฏิบัติการใช้ Parameterized Query ตลอดไป และเขียน Linter Rule ห้ามใช้ String Template ใน SQL |
| **Cross-Site Scripting (XSS)** | ⚠️ Partial Pass | Medium | React DOM มี Built-in Sanitization สำหรับ String ทั่วไป แต่โฟลเดอร์ Static Uploads สามารถถูกใช้เป็นพาหะโจมตี Stored XSS ได้หากมีผู้อัปโหลด HTML | ตั้งค่า `Content-Security-Policy: default-src 'self'` และเพิ่ม Header `X-Content-Type-Options: nosniff` |
| **PIN Authentication** | 🛑 Fail | **Critical** | PIN ถูกเข้ารหัสด้วย Bcrypt ลงฐานข้อมูลอย่างถูกต้อง แต่การล็อกเป็นเพียง UI Modal ใน Frontend เท่านั้น ตัว REST API ทุกตัวยังเปิดโล่งโดยไม่มี Guard ตรวจสอบ | สร้าง Session Token หรือ Signed Cookie เมื่อปลดล็อก PIN สำเร็จ และใช้ Middleware ตรวจสอบ Token ทุก Request |
| **Backup Encryption** | ✅ Pass | Safe | ใช้ Web Crypto API มาตรฐาน: PBKDF2 (100,000 iterations, SHA-256) และ AES-GCM (256-bit) พร้อม IV และ Salt แบบสุ่ม 16 bytes ตรวจสอบ Authentication Tag สมบูรณ์ | ปลอดภัยสูงมาก จัดเป็น Zero-Knowledge Client-side Encryption ที่ได้มาตรฐานสากล |
| **VAPID Key Security** | 🛑 Fail | **Critical** | มี Hardcoded Private Key ใน Source Code เสี่ยงต่อการรั่วไหล | ลบรหัสลับออกจากโค้ด ใช้เฉพาะ Secret Management ในเซิร์ฟเวอร์ และสร้าง Key คู่ใหม่ก่อนเริ่มใช้งานจริง |

---

## 3. รายละเอียดการตรวจสอบเชิงลึก (Deep-Dive Analysis)

### 3.1 การตรวจสอบระบบ PIN Authentication
* **Source Code ที่เกี่ยวข้อง:**
  - Backend: [`backend/src/controllers/authController.js`](file:///d:/Personal_Organizer/backend/src/controllers/authController.js#L23-L45)
  - Frontend: [`frontend/src/components/common/PinLockModal.tsx`](file:///d:/Personal_Organizer/frontend/src/components/common/PinLockModal.tsx#L40-L64)
  - Layout: [`frontend/src/App.tsx`](file:///d:/Personal_Organizer/frontend/src/App.tsx#L67-L85)

* **ผลการวิเคราะห์การเข้ารหัส PIN:**
  - การจัดเก็บรหัส PIN ทำงานอย่างถูกต้องโดยใช้ `bcrypt.hash(pin, 10)` ลงในตาราง `app_settings` (Key: `pin_hash`)
  - โค้ดใน Controller ตรวจสอบ Format ตัวเลข 4 หลัก (`/^\d{4}$/`)
  - *จุดบกพร่องร้ายแรง:* เมื่อผู้ใช้กรอก PIN ถูกต้อง ฟังก์ชัน `verifyPin` ส่งข้อมูลกลับมาเพียง:
    ```json
    { "success": true, "data": { "verified": true, "hasPin": true }, "message": "ปลดล็อกสำเร็จ" }
    ```
    Frontend นำสถานะนี้ไปบันทึกใน `sessionStorage.setItem('app_unlocked', 'true')` แต่ **ไม่มีการออก Access Token (JWT)** ให้แก่เบราว์เซอร์
    ส่งผลให้ API Endpoints สำคัญ เช่น:
    - `GET /api/entries/export` (ดาวน์โหลดข้อมูลรายการทั้งหมด)
    - `POST /api/entries/import` (เขียนทับหรือลบรายการทั้งหมด)
    - `DELETE /api/entries/:id` (ลบรายการ)
    สามารถถูกเรียกผ่านโปรแกรมใดๆ บนเครือข่ายได้ทันทีโดยไม่ต้องผ่านกระบวนการยืนยัน PIN เลย

---

### 3.2 การตรวจสอบระบบสำรองข้อมูลแบบเข้ารหัส (Backup Encryption)
* **Source Code ที่เกี่ยวข้อง:**
  - Module: [`frontend/src/utils/cryptoBackup.ts`](file:///d:/Personal_Organizer/frontend/src/utils/cryptoBackup.ts#L48-L159)
  - UI Component: [`frontend/src/components/common/EncryptedBackupModal.tsx`](file:///d:/Personal_Organizer/frontend/src/components/common/EncryptedBackupModal.tsx)

* **ผลการวิเคราะห์ทางวิทยาการรหัสลับ (Cryptographic Review):**
  1. **Key Derivation Function:** ใช้ `PBKDF2` ร่วมกับ `HMAC-SHA-256` วนรอบ 100,000 ครั้ง (เป็นไปตามเกณฑ์ขั้นต่ำของ NIST SP 800-132)
  2. **Cipher Algorithm:** ใช้ `AES-GCM` ความยาวกุญแจ 256 บิต ซึ่งเป็น Authenticated Encryption with Associated Data (AEAD) ให้ทั้งการรักษาความลับ (Confidentiality) และการตรวจสอบความถูกต้องของข้อมูล (Integrity)
  3. **Entropy & Salt/IV:**
     - Salt: สุ่มขนาด 16 ไบต์ผ่าน `window.crypto.getRandomValues(new Uint8Array(16))`
     - IV: สุ่มขนาด 12 ไบต์ (96 บิต ซึ่งเป็นขนาดที่เหมาะสมที่สุดของ AES-GCM)
  4. **Tamper Detection:** หากไฟล์ Backup ถูกแก้ไขแม้แต่บิตเดียว หรือกรอกรหัสผ่านผิด ฟังก์ชัน `window.crypto.subtle.decrypt` จะปฏิเสธการถอดรหัสและ Throw OperationError ทันที ทำให้ข้อมูลไม่รั่วไหล
  5. *เงื่อนไขสำหรับ Production:* การทำงานของ Web Crypto API ถูกจำกัดให้รันได้เฉพาะใน **Secure Contexts (HTTPS)** เท่านั้น หาก Deploy ด้วย HTTP ธรรมดา `window.crypto.subtle` จะเป็น `undefined` และแอปจะเกิด Runtime Exception ทันทีเมื่อผู้ใช้กด Backup

---

### 3.3 การตรวจสอบระบบจัดการไฟล์อัปโหลด (File Upload & Access Control)
* **Source Code ที่เกี่ยวข้อง:**
  - Middleware: [`backend/src/middlewares/upload.js`](file:///d:/Personal_Organizer/backend/src/middlewares/upload.js)
  - Controller: [`backend/src/controllers/attachmentController.js`](file:///d:/Personal_Organizer/backend/src/controllers/attachmentController.js)
  - Static Mount: [`backend/src/app.js`](file:///d:/Personal_Organizer/backend/src/app.js#L21)

* **ความเสี่ยงและช่องโหว่ที่ตรวจสอบพบ:**
  1. **MIME Type Spoofing:** `fileFilter` ใช้ `allowedMimeTypes.includes(file.mimetype)` ซึ่งค่า `file.mimetype` อ่านมาจาก HTTP Header `Content-Type` ที่ Client สามารถแก้ไขส่งค่าใดมาก็ได้
  2. **File Extension Injection:** ในบรรทัดที่ 17 ของ `upload.js` ใช้ `path.extname(file.originalname)` มาต่อท้ายชื่อไฟล์ที่บันทึกบนดิสก์ หากส่งไฟล์ `malicious.svg` หรือ `malicious.html` แต่ระบุ `Content-Type: image/png` เซิร์ฟเวอร์จะบันทึกไฟล์เป็นนามสกุล `.svg` หรือ `.html`
  3. **Stored XSS Execution:** เมื่อเปิด Static Mount `app.use('/uploads', express.static(uploadDir))` โดยไม่มีการตั้งค่า Headers `Content-Security-Policy` หรือ `X-Content-Type-Options: nosniff` หากผู้ใช้คลิกเปิดลิงก์ไฟล์ที่เป็น SVG หรือ HTML จะทำให้ JavaScript ที่ฝังอยู่ในไฟล์นั้นรันภายใต้ Session ของแอปทันที
  4. **Unauthenticated Public Access:** ไฟล์ในโฟลเดอร์ `/uploads` ไม่มีระบบตรวจสอบสิทธิ์ ใครก็ตามที่ส่ง Request มายัง `/uploads/<filename>` จะสามารถดูไฟล์ได้ทั้งหมด

---

## 4. แผนปฏิบัติการยกระดับความปลอดภัย (Security Hardening Action Plan)

### ขั้นที่ 1: กำจัดรหัสลับและตั้งค่า Environment Validation (Prioritized Blocker)
- แก้ไข [`backend/src/config/webPush.js`](file:///d:/Personal_Organizer/backend/src/config/webPush.js):
  ```javascript
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error('FATAL: VAPID keys must be configured in environment variables.');
  }
  ```
- ลบคีย์ชุดเก่าและสั่งสร้างคู่คีย์ใหม่สำหรับ Production ผ่านคำสั่ง:
  ```bash
  npx web-push generate-vapid-keys
  ```

### ขั้นที่ 2: ป้องกัน API ด้วย PIN Session / Token Guard
- สร้าง Middleware `requirePinAuth` ใน Backend:
  - เมื่อ `verifyPin` ถูกต้อง ให้สร้าง Signed Token (เช่น HMAC-SHA256 Token หรือ Session Cookie แบบ `HttpOnly; Secure; SameSite=Strict`) มีอายุ 24 ชั่วโมง
  - นำ Middleware นี้ไปครอบ Routes ใน `entryRoutes`, `categoryRoutes`, `goalRoutes`, `habitRoutes` ทั้งหมด

### ขั้นที่ 3: ปรับปรุงความปลอดภัยของ File Upload
- ติดตั้ง `file-type` ใน Backend เพื่อตรวจสอบ Magic Bytes จาก Buffer ก่อนบันทึก
- กำหนด Header สำหรับ Static Directory ใน Nginx / Express:
  ```javascript
  app.use('/uploads', express.static(uploadDir, {
    setHeaders: (res) => {
      res.setHeader('Content-Security-Policy', "default-src 'none'");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'attachment'); // บังคับดาวน์โหลด ไม่เปิดรันบนเบราว์เซอร์
    }
  }));
  ```

### ขั้นที่ 4: ติดตั้ง Helmet และ Rate Limiting
- ติดตั้งแพ็กเกจ `helmet` และ `express-rate-limit` ใน `backend/package.json`
- เพิ่มการทำงานใน `backend/src/app.js`:
  ```javascript
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');

  app.use(helmet());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: 'Too many requests, please try again later.' }
  }));
  ```
