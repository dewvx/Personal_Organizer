# Personal Organizer — ระบบจัดการรายการและบันทึกข้อมูลส่วนตัวแบบ All-in-One
> **"One App, All Your Lists."**

เว็บแอปพลิเคชันจัดการรายการและบันทึกข้อมูลส่วนตัวแบบครบวงจร ออกแบบภายใต้แนวคิด **Modern Minimalist Dashboard** ที่เน้นความเรียบง่าย คล่องตัว และรองรับการใช้งานผ่านโทรศัพท์มือถือเป็นหลัก (Mobile-First)

---

## 🌟 ฟีเจอร์หลัก (Core Features)

- 📊 **Dashboard ภาพรวม:** สรุปตัวเลขสถิติรายการทั้งหมด, รายการที่ยังค้าง, รายการที่เสร็จสิ้น, รายการโปรด/ปักหมุด, รายการล่าสุด และรายการที่ใกล้ครบกำหนด
- 📋 **Flexible Entry System:** รายการเดียวรองรับได้หลากหลายประเภท (To-do, Shopping List, Expense Notes, Personal Notes, Goals, Reminders) ด้วยฟิลด์ข้อมูลที่ยืดหยุ่น (กำหนดส่ง, ปริมาณ, ยอดเงิน, แท็ก ฯลฯ)
- 🗂️ **Custom Categories:** ผู้ใช้สร้างและจัดการหมวดหมู่ได้เอง 100% พร้อมเลือกไอคอนและสีประจำหมวดหมู่
- 🔍 **Search & Filter:** ระบบค้นหาแบบเรียลไทม์ และฟิลเตอร์ตามหมวดหมู่, สถานะ, ความสำคัญ, วันที่, หรือปักหมุด
- ⭐ **Favorites & Archive:** ปักหมุดรายการสำคัญ และเก็บรายการเข้าคลัง Archive เมื่อไม่ต้องการให้แสดงในหน้าหลัก

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend
- **Framework:** React.js 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (Modern Clean Slate/Indigo Palette)
- **Icons:** Lucide React Icons
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Web Framework:** Express.js (RESTful Architecture: Routes, Controllers, Services, Models)
- **Database Driver:** `pg` (node-postgres) พร้อม Connection Pool และ Parameterized Queries ป้องกัน SQL Injection 100%

### Database
- **DBMS:** PostgreSQL 17 / 18
- **Schema & Features:** JSONB สำหรับจัดเก็บและค้นหา Tags, Triggers สำหรับ `updated_at`, Foreign Keys, และ Indexes ประสิทธิภาพสูง

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
Personal_Organizer/
├── backend/                  # RESTful API Server (Node.js + Express)
│   ├── src/
│   │   ├── config/           # Database pool & environment
│   │   ├── controllers/      # Route controllers
│   │   ├── middlewares/      # Error handler & validations
│   │   ├── models/           # Data access & SQL queries
│   │   ├── routes/           # Express routers
│   │   ├── scripts/          # Database auto-init script
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Standard response helpers
│   │   └── app.js            # Express app
│   ├── .env.example
│   ├── package.json
│   └── server.js             # Server startup
│
├── frontend/                 # Client Application (React + Vite + TS)
│   ├── src/
│   │   ├── components/       # UI Components & Layouts
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # App pages
│   │   ├── services/         # API clients
│   │   ├── types/            # TypeScript interfaces
│   │   └── index.css         # Tailwind directives & styles
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── database/                 # PostgreSQL Scripts
│   ├── schema.sql            # Table definitions, types, triggers, indexes
│   └── seeds.sql             # Starter categories & sample entries
│
├── package.json              # Monorepo root scripts
└── README.md
```

---

## 🚀 วิธีการติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. การตั้งค่า Database (PostgreSQL)
ตรวจสอบการตั้งค่าในไฟล์ `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=personal_organizer
CLIENT_URL=http://localhost:5173
```

รันคำสั่งเพื่อสร้างตารางและข้อมูลเริ่มต้นอัตโนมัติ:
```bash
npm run db:init
```
*(หรือสามารถนำไฟล์ `database/schema.sql` และ `database/seeds.sql` ไป Execute ใน pgAdmin / psql โดยตรงได้เช่นกัน)*

### 2. รัน Backend API
```bash
npm run dev:backend
# API จะเปิดทำงานที่: http://localhost:5000
# ทดสอบ Health Check ได้ที่: http://localhost:5000/api/health
```

### 3. รัน Frontend Development Server
```bash
npm run dev:frontend
# เว็บแอปพลิเคชันจะเปิดที่: http://localhost:5173
```
