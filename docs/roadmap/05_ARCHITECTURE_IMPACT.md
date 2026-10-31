# 05. Architecture Impact & Migration Strategy — Personal Organizer

**Project:** Personal Organizer ("One App, All Your Lists")  
**Target Architecture:** Personal Life Management Platform  
**Date:** October 2026  
**Author:** Lead Software Architect & Principal Database Architect  
**Classification:** Technical Architecture Impact & Zero-Downtime Migration Blueprint  

---

## 1. Executive Summary

การยกระดับ Personal Organizer จากแอปพลิเคชันบันทึกรายการแบบเดิม ไปสู่ **Personal Life Management Platform** จำเป็นต้องมีการปรับเปลี่ยนและขยายสถาปัตยกรรม (Architectural Evolution) อย่างเป็นระบบ ทั้งในส่วนของ **Frontend Component Structure**, **State Management & Routing**, **Backend API**, และ **Database Schema**

หัวใจสำคัญของการเปลี่ยนแปลงครั้งนี้คือ **"Zero-Data-Loss & High Backward Compatibility" (ต้องไม่มีข้อมูลเดิมสูญหาย และระบบเดิมต้องทำงานได้อย่างต่อเนื่องในทุกขั้นตอนของการอัปเกรด)**

---

## 2. Target System Architecture Diagram (Future State)

```mermaid
flowchart TD
    subgraph Client ["Modern Client Layer (React 19 + PWA)"]
        Router["Client-Side Router<br/>(react-router-dom v6/v7)"]
        Pages["Lazy-Loaded Pages<br/>(Dashboard, Lists, Kanban, Habits, Goals)"]
        QuickCapture["Quick Capture Drawer<br/>(Global 3-Sec Input)"]
        QueryCache["TanStack Query Cache<br/>(Optimistic UI & Cache Invalidation)"]
        OfflineStore[("Local IndexedDB Store<br/>(Dexie.js / Offline Persister)")]
        SW["Service Worker (sw.js)<br/>App Shell Cache + Push"]
    end

    subgraph API_Gateway ["Secure API Layer (Node.js/Express)"]
        SecurityMW["Security Middleware<br/>(Helmet, CORS, Rate Limit)"]
        AuthMW["Session / PIN Auth Middleware<br/>(Bcrypt Token Validation)"]
        Controllers["Refactored Controllers<br/>(Entries, Categories, Habits, Goals, Backup)"]
        Services["Business Services Layer<br/>(Transaction Managed)"]
        Validators["Input Validation Layer<br/>(Zod Schemas)"]
    end

    subgraph Database ["Resilient Data Layer (PostgreSQL 17/18)"]
        PGPool["Connection Pool with Transactions"]
        SchemaMigration["Migration Engine<br/>(Knex / Prisma Migrations)"]
        NewTables[("Normalized Relational Tables<br/>categories, entries, entry_items,<br/>habits, habit_logs, goals, attachments")]
    end

    Router --> Pages
    Pages --> QuickCapture
    Pages --> QueryCache
    QueryCache <--> OfflineStore
    Pages -.-> SW

    QueryCache -->|Secure REST Requests| SecurityMW
    SecurityMW --> AuthMW
    AuthMW --> Validators
    Validators --> Controllers
    Controllers --> Services
    Services --> PGPool
    PGPool --> SchemaMigration
    SchemaMigration --> NewTables
```

---

## 3. Frontend Component Architecture Impact

### 3.1 New Components to Introduce (คอมโพเนนต์ใหม่ที่จะถูกสร้างขึ้น)
1. **`QuickCaptureBar.tsx` / `QuickCaptureDrawer.tsx`:** แถบจดด่วนระดับ Global ติดตั้งไว้ที่ Header และ Bottom Navigation พร้อม Regex/NLP Parser ย่อยข้อความ
2. **`KanbanBoardPage.tsx` & `KanbanColumn.tsx`:** หน้ารวมกระดานคัมบัง รองรับ Drag & Drop การ์ดรายการระหว่างคอลัมน์สถานะ
3. **`HabitTrackerCard.tsx` & `HabitMatrix.tsx`:** การ์ดติดตามนิสัยประจำวันในหน้า Dashboard พร้อม Dot Grid สัปดาห์ละ 7 วัน
4. **`GoalCard.tsx` & `GoalFormModal.tsx`:** คอมโพเนนต์เป้าหมายชีวิตและแถบวัดความก้าวหน้า
5. **`ImportModal.tsx`:** หน้าต่าง Drag & Drop อัปโหลดไฟล์ JSON/CSV พร้อมระบบ Dry-Run Preview
6. **`AttachmentUploader.tsx` & `ImageViewerModal.tsx`:** ระบบอัปโหลดรูปภาพใบเสร็จ/สลิป และ Modal ดูภาพขยาย

### 3.2 Existing Components to Refactor (คอมโพเนนต์เดิมที่ต้องปรับปรุง)
1. **[`App.tsx`](file:///d:/Personal_Organizer/frontend/src/App.tsx):**
   - **การเปลี่ยนแปลง:** นำ `react-router-dom` (`<BrowserRouter>`, `<Routes>`, `<Route>`) เข้ามาแทนที่ State-based Tab Switcher เดิม
   - **การปรับปรุง:** ลบตัวแปร `refreshKey` และการบังคับ Remount (`key={`..._${refreshKey}`}`) ออกทั้งหมด นำ TanStack Query มารับหน้าที่ Cache Invalidation
2. **[`EntryCard.tsx`](file:///d:/Personal_Organizer/frontend/src/components/entries/EntryCard.tsx):**
   - **การเปลี่ยนแปลง:** แยกความรับผิดชอบ (SRP Refactoring) โดยสกัด Sub-item Checklist ออกเป็น `SubItemsChecklist.tsx` และสกัด Action Menu ออกเป็น `EntryActionsMenu.tsx`
3. **[`EntryFormModal.tsx`](file:///d:/Personal_Organizer/frontend/src/components/entries/EntryFormModal.tsx):**
   - **การเปลี่ยนแปลง:** ปัจจุบันมีความยาวถึง 600 บรรทัด จะถูกแยกเป็นโมดูลย่อย:
     - `SubItemsEditor.tsx` (จัดการรายการย่อย)
     - `SpeechInputButton.tsx` (ปุ่มแปลงเสียงพูดภาษาไทย)
     - `CategorySelector.tsx` (ตัวเลือกหมวดหมู่)
4. **[`Header.tsx`](file:///d:/Personal_Organizer/frontend/src/components/layout/Header.tsx):**
   - **การเปลี่ยนแปลง:** เพิ่ม Quick Capture Trigger และใส่ Hook `useDebounce(searchQuery, 300)` เพื่อหน่วงเวลาการยิงค้นหา
5. **[`ArchivePage.tsx`](file:///d:/Personal_Organizer/frontend/src/pages/ArchivePage.tsx) & [`CategoriesPage.tsx`](file:///d:/Personal_Organizer/frontend/src/pages/CategoriesPage.tsx):**
   - **การเปลี่ยนแปลง:** ลบคำสั่ง `window.location.reload()` ทิ้ง และเพิ่มคลาส Tailwind `dark:` ให้รองรับโหมดมืดอย่างสมบูรณ์

---

## 4. Database Schema Evolution & Zero-Data-Loss Migration

เพื่อให้ระบบสามารถรองรับฟีเจอร์ใหม่ทั้งหมดใน Roadmap โดย**ไม่สูญเสียข้อมูลเดิมแม้แต่แถวเดียว** เราได้วางแผนการทำ Database Migration เป็น 3 ขั้นตอน:

### 4.1 Target Entity Relationship Diagram (Schema ขั้นสมบูรณ์)

```mermaid
erDiagram
    categories ||--o{ entries : "classifies (SET NULL)"
    entries ||--o{ entry_items : "contains (CASCADE)"
    entries ||--o{ entry_attachments : "attaches (CASCADE)"
    goals ||--o{ entries : "associates (SET NULL)"
    habits ||--o{ habit_logs : "records (CASCADE)"

    app_settings {
        varchar(50) key PK
        text value "NOT NULL"
        timestamptz updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    categories {
        serial id PK
        varchar(100) name UK
        varchar(255) description
        varchar(50) icon
        varchar(20) color
        int sort_order
        numeric(12_2) monthly_budget "NEW (NULL)"
        jsonb custom_schema "NEW (DEFAULT '[]')"
        timestamptz created_at
        timestamptz updated_at
    }

    goals {
        serial id PK "NEW TABLE"
        varchar(255) title "NOT NULL"
        text description
        date target_date
        numeric(12_2) target_amount
        varchar(20) status "DEFAULT 'in_progress'"
        timestamptz created_at
        timestamptz updated_at
    }

    entries {
        serial id PK
        int category_id FK "NULL"
        int goal_id FK "NEW (NULL)"
        varchar(255) title "NOT NULL"
        text description
        date entry_date
        date due_date
        entry_status status
        entry_priority priority
        numeric(12_2) amount
        int quantity
        jsonb tags
        boolean is_favorite
        boolean is_archived
        varchar(20) recurring
        int sort_order "NEW (DEFAULT 0)"
        jsonb custom_values "NEW (DEFAULT '{}')"
        timestamptz created_at
        timestamptz updated_at
    }

    entry_items {
        serial id PK
        int entry_id FK "NOT NULL"
        varchar(255) title "NOT NULL"
        numeric(12_2) amount
        int quantity
        boolean is_completed
        int sort_order
        timestamptz created_at
        timestamptz updated_at
    }

    entry_attachments {
        serial id PK "NEW TABLE"
        int entry_id FK "NOT NULL"
        varchar(255) file_name "NOT NULL"
        varchar(500) file_path "NOT NULL"
        int file_size "NOT NULL"
        varchar(100) mime_type "NOT NULL"
        timestamptz created_at
    }

    habits {
        serial id PK "NEW TABLE"
        varchar(255) name "NOT NULL"
        varchar(50) icon "DEFAULT 'check'"
        varchar(20) color "DEFAULT '#10B981'"
        varchar(20) frequency "DEFAULT 'daily'"
        int target_days_per_week "DEFAULT 7"
        timestamptz created_at
        timestamptz updated_at
    }

    habit_logs {
        serial id PK "NEW TABLE"
        int habit_id FK "NOT NULL"
        date log_date "NOT NULL"
        boolean is_completed "DEFAULT TRUE"
        text notes
        timestamptz created_at
    }
```

---

### 4.2 Non-Destructive SQL Migration Scripts

คำสั่ง SQL ด้านล่างนี้ถูกออกแบบให้เป็น **Idempotent (สามารถรันซ้ำได้โดยไม่เกิด Error และไม่กระทบข้อมูลเดิม)**:

```sql
-- ====================================================================
-- MIGRATION V2.0: Non-Destructive Evolution Script
-- ====================================================================

-- 1. ตารางเก็บการตั้งค่าความปลอดภัยระดับระบบ (แทนที่การเก็บใน LocalStorage)
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. ขยายตาราง categories เดิม (ปลอดภัย 100% ต่อข้อมูลเดิม)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12, 2) NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS custom_schema JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. สร้างตาราง goals (เป้าหมายชีวิต) ก่อน เพื่อใช้อ้างอิง FK
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  target_date DATE NULL,
  target_amount NUMERIC(12, 2) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. ขยายตาราง entries เดิม (เพิ่ม sort_order, goal_id, custom_values)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS goal_id INT NULL REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS custom_values JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 5. ตารางแนบไฟล์และรูปภาพสลิป (entry_attachments)
CREATE TABLE IF NOT EXISTS entry_attachments (
  id SERIAL PRIMARY KEY,
  entry_id INT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_attachments_entry_id ON entry_attachments(entry_id);

-- 6. ตารางระบบติดตามนิสัยประจำวัน (habits & habit_logs)
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'check',
  color VARCHAR(20) NOT NULL DEFAULT '#10B981',
  frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  target_days_per_week INT NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_habit_date UNIQUE(habit_id, log_date)
);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(log_date);
```

---

## 5. State Management & Data Flow Evolution

การเปลี่ยนผ่านระบบ State Management เพื่อแก้ปัญหา Re-render ซ้ำซ้อนและยกเลิก Hard Page Reload:

```mermaid
sequenceDiagram
    autonumber
    actor User as ผู้ใช้งาน
    participant UI as React UI Component
    participant Hook as useEntryActions (TanStack Query)
    participant IDB as Local IndexedDB
    participant API as Backend REST API
    participant DB as PostgreSQL (Transaction)

    User->>UI: ติ๊กถูก / ลบรายการ
    UI->>Hook: เรียก mutate(id, action)
    Hook->>UI: Optimistic Update ทันที (UI ตอบสนอง 0ms)
    Hook->>IDB: แคชข้อมูลลง IndexedDB ในเครื่อง
    Hook->>API: ส่ง HTTP Request (PATCH / DELETE)
    API->>DB: BEGIN TRANSACTION -> EXECUTE -> COMMIT
    DB-->>API: ยืนยันการเปลี่ยนแปลง (200 OK)
    API-->>Hook: Response Payload สำเร็จ
    Hook->>UI: ยืนยัน State ถูกต้อง (No Reload Needed!)
```

### สรุปการปรับเปลี่ยน Data Flow:
1. **Optimistic Updates:** เมื่อผู้ใช้กดติ๊กถูกหรือลบรายการ UI จะอัปเดตหน้าจอทันทีโดยไม่ต้องรอเครือข่าย ให้ความรู้สึกลื่นไหลสูงสุด
2. **Automatic Cache Invalidation:** ใช้ `queryClient.invalidateQueries({ queryKey: ['entries'] })` เพื่อให้ข้อมูลในทุกหน้า (Dashboard, AllLists, Calendar, Kanban) ซิงค์ตัวเลขตรงกันอัตโนมัติ โดยไม่ต้องพึ่งพา `window.location.reload()` อีกต่อไป
3. **Offline Fallback:** หากเครือข่ายออฟไลน์ ข้อมูลจะถูกบันทึกรอไว้ใน IndexedDB และส่งต่อไปยัง API ทันทีเมื่อกลับมาออนไลน์

---

## 6. Backward Compatibility & Risk Assessment

| จุดเสี่ยงในการเปลี่ยนแปลง | ผลกระทบที่อาจเกิดขึ้น | แผนการควบคุมและป้องกัน (Mitigation Strategy) |
| :--- | :--- | :--- |
| **การเพิ่มคอลัมน์ใหม่ใน `entries`** | ซอฟต์แวร์เดิมอาจ Query พังหากมีการใช้ `SELECT *` | ทุกคอลัมน์ใหม่ถูกกำหนดให้เป็น `NULL` หรือมี `DEFAULT` ที่ปลอดภัย โค้ดเดิมสามารถอ่านข้อมูลได้ตามปกติ 100% |
| **การนำ Client-side Router เข้ามา** | บุ๊กมาร์กเดิมหรือประวัติในเบราว์เซอร์อาจเพี้ยน | กำหนด Route ค่าเริ่มต้น `/` ให้ชี้ไปที่ `DashboardPage` เสมือนของเดิม |
| **การเปลี่ยนวิธีเก็บ PIN ไปไว้ที่ Backend** | ผู้ใช้เดิมที่เคยตั้ง PIN ใน LocalStorage อาจเข้าไม่ได้ | ในรอบอัปเกรดแรก ให้เขียน Migration Script ใน React: หากพบ `app_pin_code` ใน LocalStorage ให้ยิง API ส่งไป Hash และบันทึกลง Database ทันที จากนั้นจึงลบออกจาก LocalStorage |
| **การเปิดใช้ Service Worker Pre-cache** | ผู้ใช้อาจติด Cache ไฟล์เวอร์ชันเก่า | กำหนด `CACHE_NAME = 'organizer-pwa-v2'` และใส่คำสั่งลบ Cache เก่าทั้งหมดใน `activate` event ของ Service Worker |
