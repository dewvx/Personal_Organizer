# 04. Security Audit — Personal Organizer

**Project:** Personal Organizer ("One App, All Your Lists")  
**Audit Date:** October 2026  
**Auditor:** Senior Cyber Security Architect & Full Stack Security Auditor  
**Classification:** Application Security & Vulnerability Assessment  

---

## 1. Executive Summary

จากการตรวจสอบด้านความปลอดภัย (Application Security Audit) ของระบบ **Personal Organizer** ครอบคลุมทั้งฝั่ง Client, API Server, และ Database พบช่องโหว่ด้านความปลอดภัยร้ายแรงในระดับ **Critical** และ **High** หลายประการ โดยเฉพาะอย่างยิ่งในระบบ **Privacy PIN Lock** และ **API Access Control**

**ข้อค้นพบหลัก (Key Security Findings):**
1. **Critical:** ระบบรหัสผ่าน Privacy PIN ถูกจัดเก็บเป็น **Plaintext (ข้อความธรรมดาที่ไม่ผ่านการเข้ารหัสลับ)** ใน Browser `localStorage` และสามารถ Bypass ได้ง่ายดายผ่าน DevTools
2. **Critical:** Backend API ขาดระบบ Authentication & Authorization ส่งผลให้ Endpoint ทั้งหมดเปิดโล่ง (Public API) สามารถเข้าถึงหรือทำลายข้อมูลได้โดยไม่ต้องผ่านรหัส PIN
3. **High:** ขาดระบบป้องกันการโจมตีแบบ Brute-force บนรหัส PIN 4 หลัก (ทดสอบความเป็นไปได้ 10,000 รูปแบบได้ภายในไม่กี่วินาที)
4. **Medium:** ขาด Security Headers (เช่น Content Security Policy, HSTS, X-Frame-Options) และขาดการ Sanitization ป้องกัน Stored XSS ในระดับ Database

> [!CAUTION]
> ตามข้อกำหนดความปลอดภัย รายงานฉบับนี้ไม่มีการเปิดเผยรหัสผ่าน ค่า Connection String หรือความลับจากไฟล์ `.env` โดยจะอ้างอิงเฉพาะโครงสร้างการทำงานและชื่อตัวแปรเท่านั้น

---

## 2. Privacy PIN Lock Security Analysis

### 2.1 Plaintext PIN Storage in LocalStorage (CRITICAL)
- **ไฟล์อ้างอิง:** [frontend/src/components/common/PinLockModal.tsx#L32-L89](file:///d:/Personal_Organizer/frontend/src/components/common/PinLockModal.tsx#L32-L89)
- **โค้ดที่เป็นช่องโหว่:**
  ```typescript
  // frontend/src/components/common/PinLockModal.tsx
  const currentSavedPin = localStorage.getItem('app_pin_code'); // อ่าน PIN ตรงๆ
  ...
  localStorage.setItem('app_pin_code', pin); // บันทึก PIN 4 หลักตรงๆ เช่น "1234"
  ```
- **การวิเคราะห์การโจมตี (Attack Vectors):**
  1. **DevTools Inspection:** หากใครสามารถเข้าถึงอุปกรณ์ของผู้ใช้ได้ชั่วคราว เพียงเปิด F12 -> Application -> Local Storage หรือพิมพ์คำสั่ง:
     ```javascript
     console.log(localStorage.getItem('app_pin_code'));
     ```
     ก็จะเห็นรหัส PIN 4 หลักทันทีโดยไม่มีการเข้ารหัสหรือ Salting ใดๆ ทั้งสิ้น
  2. **Bypass via Console:** ผู้ไม่หวังดีสามารถปลดล็อกหน้าจอได้ทันทีโดยไม่ต้องรู้รหัส PIN เพียงพิมพ์:
     ```javascript
     localStorage.removeItem('app_pin_code');
     location.reload();
     ```
     หน้าจอล็อกจะหายไปทันที เนื่องจากแอปพลิเคชันถือว่ายังไม่ได้ตั้งรหัส PIN!

---

### 2.2 Lack of PIN Hashing & Salt (CRITICAL)
- **การวิเคราะห์:**
  - ระบบไม่มีการใช้ฟังก์ชัน One-way Cryptographic Hash (เช่น `Argon2id`, `bcrypt`, หรือ `PBKDF2`) ร่วมกับ Salt
  - แม้กระทั่ง Web Crypto API (`crypto.subtle.digest('SHA-256', ...)`) ในเบราว์เซอร์ก็ไม่ได้ถูกเรียกใช้งาน
- **ระดับความเสี่ยง:** **Critical**

---

### 2.3 Absence of Brute-Force Protection (HIGH)
- **ไฟล์อ้างอิง:** [frontend/src/components/common/PinLockModal.tsx#L42-L52](file:///d:/Personal_Organizer/frontend/src/components/common/PinLockModal.tsx#L42-L52)
- **การวิเคราะห์:**
  - PIN มีความยาวเพียง 4 หลัก (ตัวเลข 0-9) ซึ่งมีความเป็นไปได้เพียง $10^4 = 10,000$ รูปแบบ
  - ในโค้ดเมื่อกรอกผิด มีเพียงคำสั่งดีเลย์ 500ms และเคลียร์ตัวเลข:
    ```typescript
    setError('รหัส PIN ไม่ถูกต้อง');
    setTimeout(() => setPin(''), 500);
    ```
  - **ไม่มีตัวนับจำนวนครั้งที่กรอกผิด (Failed Attempt Counter)**, **ไม่มีระบบหน่วงเวลาแบบ Exponential Backoff**, และ **ไม่มีระบบ Auto-lockout** ทำให้สคริปต์อัตโนมัติสามารถ Brute-force ครบทุกกรณีได้ภายในเวลาไม่เกิน 1 นาที

---

### 2.4 Zero Backend Enforcement / Client-Side Only Lock (CRITICAL)
- **การวิเคราะห์:**
  - ระบบ PIN Lock ถูกพัฒนาเป็นเพียง **UI Overlay Modal ฝั่ง Client เท่านั้น**
  - Backend API (`http://localhost:5000/api/*`) ไม่ทราบและไม่มีการตรวจสอบรหัส PIN หรือ Token ใดๆ
  - ผู้โจมตีสามารถข้ามหน้าจอล็อกของ Frontend โดยการยิง HTTP Request ตรงไปยัง Backend ผ่าน `curl` หรือ Postman เพื่อดึง แก้ไข หรือลบข้อมูลทั้งหมดในฐานข้อมูลได้ 100%:
    ```bash
    curl http://localhost:5000/api/entries
    curl -X DELETE http://localhost:5000/api/entries/1
    ```

---

## 3. Application & API Security

### 3.1 Authentication & Multi-Tenancy Isolation
- **สถานะ:** *Not Implemented (Single Global Tenant)*
- **ความเสี่ยง:**
  - ฐานข้อมูลไม่มีตาราง `users` และไม่มีคอลัมน์ `user_id` ในตาราง `entries` และ `categories`
  - ข้อมูลในระบบไม่มีการแบ่งแยกสิทธิ์ (Data Access Control) หากมีการ Deploy แอปพลิเคชันขึ้นสู่ Network ภายนอก ผู้ใช้ทุกคนจะเห็นและแก้ไขข้อมูลร่วมกันในฐานข้อมูลเดียวกันทันที

---

### 3.2 SQL Injection Assessment
- **สถานะ:** *Protected via Parameterized Queries*
- **การวิเคราะห์:**
  - ไฟล์ [categoryModel.js](file:///d:/Personal_Organizer/backend/src/models/categoryModel.js), [entryModel.js](file:///d:/Personal_Organizer/backend/src/models/entryModel.js), และ [entryItemModel.js](file:///d:/Personal_Organizer/backend/src/models/entryItemModel.js) ใช้ Parameterized Queries (`$1, $2, ...`) กับไลบรารี `pg` อย่างเคร่งครัด
  - ไม่พบการต่อ String SQL (`"SELECT ... WHERE id = " + id`) โดยตรง ทำให้ระบบปลอดภัยจากการโจมตีประเภท SQL Injection ทั่วไป 100%

---

### 3.3 Cross-Site Scripting (XSS) & Input Sanitization
- **สถานะ:** *Partially Protected (Medium Risk)*
- **การวิเคราะห์:**
  - **Frontend:** React ป้องกัน XSS ได้ในระดับหนึ่งผ่านการ Escape HTML Entities อัตโนมัติใน JSX
  - **ช่องโหว่ที่พบ:**
    1. Backend ไม่มีการใช้ Input Sanitizer (เช่น `DOMPurify` หรือ `validator`) เพื่อลบแท็ก HTML หรือ Script Tag ออกจากฟิลด์ `title`, `description`, และ `tags`
    2. หากในอนาคตมีการนำฟิลด์ `description` ไปแสดงผลผ่าน `dangerouslySetInnerHTML` หรือส่งออกไปยัง Third-party Service (เช่น เว็บภายนอกหรือระบบ Preview) จะกลายเป็น Stored XSS ทันที

---

### 3.4 File Upload & Export Security
- **File Upload:**
  - ระบบปัจจุบัน**ไม่มีฟังก์ชันอัปโหลดไฟล์** จึงไม่มีความเสี่ยงด้าน Malicious File Execution หรือ Unrestricted File Upload
- **Export Data:**
  - ฟังก์ชันส่งออก CSV ใน [entryController.js#L180-L199](file:///d:/Personal_Organizer/backend/src/controllers/entryController.js#L180-L199) มีการ Escape Double Quote (`replace(/"/g, '""')`)
  - **CSV Injection (Formula Injection):** หากชื่อรายการ (`title`) ขึ้นต้นด้วยอักขระ `=, +, -, @` เมื่อเปิดไฟล์ในโปรแกรม Microsoft Excel อาจทำให้เกิดการรันคำสั่งภายนอกหรือ Formula Execution ได้ ควรมีการ Sanitization โดยการเติม Single Quote (`'`) นำหน้าหากพบอักขระพิเศษดังกล่าว

---

### 3.5 Network & Transport Security
1. **CORS Configuration:**
   - ใน [backend/src/app.js#L9-L13](file:///d:/Personal_Organizer/backend/src/app.js#L9-L13):
     ```javascript
     app.use(cors({
       origin: process.env.CLIENT_URL || '*',
       methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
       allowedHeaders: ['Content-Type', 'Authorization'],
     }));
     ```
   - หากไม่ได้ตั้งค่า `CLIENT_URL` ระบบจะ Fallback เป็น `*` (Wildcard) ซึ่งอนุญาตให้เว็บไซต์ใดๆ บนอินเทอร์เน็ตยิง Request เข้ามาที่ Backend ได้
2. **Missing Security Headers:**
   - Backend ไม่ได้ติดตั้งไลบรารี `helmet` ส่งผลให้ขาด Headers สำคัญ:
     - `Content-Security-Policy (CSP)`
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY` (เสี่ยงต่อ Clickjacking)
     - `Strict-Transport-Security (HSTS)`
3. **Missing Rate Limiting:**
   - Backend ไม่มีไลบรารี `express-rate-limit` ทำให้เสี่ยงต่อการถูกยิง DoS หรือ Flood Request ได้ง่าย

---

## 4. Master Security Findings & Vulnerability Matrix

| # | ประเด็นความปลอดภัย | ตำแหน่งไฟล์ที่พบ | ผลกระทบ | ระดับความรุนแรง | แนวทางแก้ไข (Remediation) |
| :-: | :--- | :--- | :--- | :---: | :--- |
| **SEC-01** | **เก็บ PIN เป็น Plaintext ใน LocalStorage** | `frontend/src/components/common/PinLockModal.tsx` (L68) | ผู้เข้าถึงเครื่องหรือสคริปต์ XSS สามารถอ่านและ Bypass รหัสได้ทันที | **Critical** | ย้ายการตรวจสอบ PIN ไปไว้ที่ Backend และ Hash ด้วย `Argon2id` / `bcrypt` |
| **SEC-02** | **Backend API ขาด Authentication** | `backend/src/app.js` และ Routes ทั้งหมด | ทุก Endpoint เปิดเป็น Public สามารถถูกดึงหรือลบข้อมูลได้โดยไม่ต้องล็อกอิน | **Critical** | เพิ่ม Auth Middleware ตรวจสอบ Session Cookie หรือ JWT Bearer Token |
| **SEC-03** | **ขาด Brute-force Protection บน PIN** | `frontend/src/components/common/PinLockModal.tsx` (L42) | PIN 4 หลักถูกสุ่มลองได้ครบ 10,000 รูปแบบในเวลาอันรวดเร็ว | **High** | เพิ่ม Failed Attempt Counter, หน่วงเวลาเพิ่มขึ้นเป็นทวีคูณ และ Lockout หลังผิด 5 ครั้ง |
| **SEC-04** | **CORS Fallback เป็น Wildcard (`*`)** | `backend/src/app.js` (L10) | เว็บไซต์ภายนอกที่ไม่ได้รับอนุญาตสามารถเรียกใช้งาน API ได้ | **Medium** | บังคับให้ `CLIENT_URL` ต้องระบุ Origin ชัดเจน และห้ามใช้ `*` ใน Production |
| **SEC-05** | **ขาด Security Headers (`helmet`)** | `backend/src/app.js` | ขาดการป้องกัน Clickjacking, MIME-sniffing, และ XSS | **Medium** | ติดตั้งและเปิดใช้งาน `helmet()` ใน Express Middleware |
| **SEC-06** | **เสี่ยงต่อ CSV Formula Injection** | `backend/src/controllers/entryController.js` (L180) | ฟังก์ชัน Export อาจสั่งรันโค้ดอันตรายเมื่อเปิดใน Microsoft Excel | **Medium** | Sanitise ข้อความที่ขึ้นต้นด้วย `=`, `+`, `-`, `@` ก่อนสร้างไฟล์ CSV |
| **SEC-07** | **ขาด Rate Limiting บน API** | `backend/src/app.js` | เสี่ยงต่อการถูกโจมตีแบบ Denial of Service (DoS) หรือ Resource Exhaustion | **Low** | ติดตั้ง `express-rate-limit` เพื่อจำกัด Request ต่อ IP เช่น 100 requests / 15 นาที |
