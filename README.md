# Personal Organizer — ระบบจัดการรายการและบันทึกข้อมูลส่วนตัวแบบ All-in-One
> **"One App, All Your Lists."**

เว็บแอปพลิเคชันจัดการรายการและบันทึกข้อมูลส่วนตัวแบบครบวงจร ออกแบบภายใต้แนวคิด **Modern Minimalist Dashboard** ที่เน้นความเรียบง่าย คล่องตัว และรองรับการใช้งานผ่านโทรศัพท์มือถือเป็นหลัก (Mobile-First)

---

## 🌟 ฟีเจอร์หลัก (Core Features & Enhancements)

- 📝 **Notes & Journal (ระบบบันทึกโน้ตและไดอารี่):**
  - บันทึกไอเดีย โน้ตอิสระ ไดอารี่ประจำวัน และ Scratchpad จดด่วน
  - ระบบ **Mood Tracker** ติดตามอารมณ์ความรู้สึก 5 ระดับ (😄, 🙂, 😐, 🙁, 😫) พร้อม Calendar Heatmap
  - เชื่อมโยงโน้ตเข้ากับ Task หรือ Goal ได้ พร้อมระบบปักหมุด (Pin to top) และค้นหาแท็ก
- 💰 **Income & Expense Tracker (ระบบบัญชีและการเงินแบบ All-in-One):**
  - รองรับหลายกระเป๋าเงิน (เงินสด, บัญชีธนาคาร, บัตรเครดิต, E-Wallet, เงินออม)
  - จัดการรายรับ รายจ่าย และโอนเงินระหว่างกระเป๋า (Auto-balance atomic update)
  - สรุปตัวเลขเงินออมสุทธิ (Net Savings) และอัตราการออม (Savings Rate %)
  - ตั้งงบประมาณรายเดือน (Monthly Budgets) แยกตามหมวดหมู่
- 🔔 **Smart Reminders (ระบบเตือนความจำอัจฉริยะ):**
  - ตั้งเวลาเตือนความจำพร้อมกำหนดรอบทำซ้ำ (ทุกวัน, ทุกสัปดาห์, ทุกเดือน)
  - ระบบ **Snooze** เลื่อนเตือน (+15 นาที, +1 ชม., +1 วัน)
  - ระบบ **Daily Digest** สรุปภารกิจยามเช้า และ **Weekly Summary** สรุปผลงานประจำสัปดาห์อัตโนมัติ
- 📊 **Dashboard & Expense Analytics:**
  - สรุปตัวเลขสถิติรายการทั้งหมด, งานค้าง, รายการที่เสร็จสิ้น, รายการโปรด
  - แถบเตือนงานค้างเกินกำหนด (Overdue) และงาน 7 วันข้างหน้า
  - **Expense Analytics:** แถบวิเคราะห์สัดส่วนรายจ่ายแยกตามหมวดหมู่ (เปอร์เซ็นต์และยอดเงินจริง)
- 🛒 **Sub-Items / Checklist & Granular Expenses (รายการย่อย & คำนวณรายจ่ายอัตโนมัติ):**
  - รองรับการกรอกรายการย่อยในแต่ละบันทึก เช่น รายการซื้อของที่ตลาด (1. ผัก 50฿, 2. ผลไม้ 100฿)
  - **Auto-Calculate Total Amount:** ระบบจะรวมยอดเงินและจำนวนชิ้นจากรายการย่อยขึ้นมาเป็นยอดรวมของรายการให้อัตโนมัติ
  - Checkbox ติ๊กถูกทำเครื่องหมายรายการย่อยได้ทันทีจากหน้าการ์ด พร้อมแถบ Progress Bar
- 🌙 **Dark Mode (โหมดมืด-สว่าง):** สลับโหมดใช้งานกลางคืนหรือกลางวันได้ง่ายด้วย 1-Click พร้อมบันทึกลง LocalStorage
- 📥 **Export & Backup Data:** ส่งออกข้อมูลทั้งหมดเป็นไฟล์ **Excel (CSV)** (รองรับภาษาไทย 100%) หรือไฟล์ **JSON** สำรองข้อมูล
- 🔄 **Recurring Tasks:** รองรับการตั้งค่ารายการทำซ้ำ (ทุกวัน, ทุกสัปดาห์, ทุกเดือน)
- 🗂️ **Custom Categories:** ผู้ใช้สร้างและจัดการหมวดหมู่ได้เอง 100% พร้อมเลือกไอคอนและสีประจำหมวดหมู่
- 🔍 **Search & Multi-Filter:** ระบบค้นหาแบบเรียลไทม์ และฟิลเตอร์ตามหมวดหมู่, สถานะ, ความสำคัญ, วันที่, หรือปักหมุด
- ⭐ **Favorites & Archive:** ปักหมุดรายการสำคัญ และเก็บรายการเข้าคลัง Archive เมื่อไม่ต้องการให้แสดงในหน้าหลัก

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend
- **Framework:** React.js 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (Class-based Dark Mode + Clean Minimal Palette)
- **Icons:** Lucide React Icons
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Web Framework:** Express.js (Layered Architecture: Routes, Controllers, Services, Models)
- **Database Driver:** `pg` (node-postgres) พร้อม Connection Pool และ Parameterized Queries ป้องกัน SQL Injection 100%

### Database
- **DBMS:** PostgreSQL 17 / 18
- **Schema & Features:** ตาราง `categories`, `entries`, `entry_items`, JSONB สำหรับจัดเก็บ Tags, Triggers สำหรับ `updated_at`, Foreign Keys CASCADE, และ GIN/B-Tree Indexes

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
Personal_Organizer/
├── backend/                  # RESTful API Server (Node.js + Express)
│   ├── src/
│   │   ├── config/           # Database pool & environment
│   │   ├── controllers/      # Route controllers (Entry, Category, Dashboard)
│   │   ├── middlewares/      # Error handler & validations
│   │   ├── models/           # Data access & SQL queries (entryModel, entryItemModel, categoryModel)
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
│   │   ├── components/       # UI Components, Layouts, Entries, Dashboard
│   │   ├── context/          # ToastContext, ThemeContext (Dark Mode)
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Dashboard, AllLists, Categories, Favorites, Archive
│   │   ├── services/         # API clients (EntryService with Export)
│   │   ├── types/            # TypeScript interfaces
│   │   └── index.css         # Tailwind directives & styles
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── database/                 # PostgreSQL Scripts
│   ├── schema.sql            # Table definitions (entries, entry_items, categories)
│   └── seeds.sql             # Starter categories, sample entries, and sub-items
│
├── package.json              # Monorepo root scripts
└── README.md
```

---

## 🚀 วิธีการรันใช้งานระบบ

### 1. การตั้งค่า Database (PostgreSQL)
ตรวจสอบการตั้งค่าในไฟล์ `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=รหัสผ่าน_PostgreSQL_ของคุณ
DB_NAME=personal_organizer
CLIENT_URL=http://localhost:5173
```

รันคำสั่งเพื่อสร้างตารางและอัปเดต Schema ล่าสุด (รวมถึงตาราง `entry_items`):
```bash
npm run db:init
```

### 2. รัน Backend API
```bash
npm run dev:backend
# API จะเปิดทำงานที่: http://localhost:5000
```

### 3. รัน Frontend Web App
```bash
npm run dev:frontend
# เว็บแอปพลิเคชันจะเปิดที่: http://localhost:5173
```
