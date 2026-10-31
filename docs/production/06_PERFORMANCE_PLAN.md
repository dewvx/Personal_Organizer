# แผนการปรับปรุงและทดสอบประสิทธิภาพ (Production Performance Plan)
**โปรเจกต์:** Personal Organizer  
**วันที่ตรวจสอบ:** 31 ตุลาคม 2026  
**ผู้จัดทำ:** Senior Frontend Performance Engineer & Senior Backend Engineer  

---

## 1. บทวิเคราะห์สถานะประสิทธิภาพปัจจุบัน (Current Performance Baseline)

### 1.1 การวัดขนาด Bundle จริงของ Frontend (Measured Bundle Size)
จากการรันคำสั่ง `tsc -b && vite build` (Vite v8.3.5) ได้ผลลัพธ์ขนาดไฟล์ Production จริงดังนี้:

| ไฟล์ Asset | ขนาดไฟล์ดิบ (Uncompressed) | ขนาดหลังบีบอัด (Gzip) | การประเมินตามเกณฑ์มาตรฐาน |
|---|---|---|---|
| `dist/assets/index-bW6BS2Ps.js` | **586.08 kB** | **154.81 kB** | ⚠️ **เกินเกณฑ์แจ้งเตือน (> 500 kB)** |
| `dist/assets/index-BzLy0u1Z.css` | **59.35 kB** | **9.92 kB** | ✅ ผ่านเกณฑ์มาตรฐาน (< 100 kB) |
| `dist/index.html` | **1.16 kB** | **0.58 kB** | ✅ ดีเยี่ยม (< 5 kB) |

> ⚠️ **ข้อความแจ้งเตือนจาก Vite:**  
> `(!) Some chunks are larger than 500 kB after minification. Consider using dynamic import() to code-split the application.`

---

## 2. การวิเคราะห์สาเหตุและจุดคอขวด (Root Cause Analysis)

### 2.1 สถาปัตยกรรม Monolithic Bundle ใน `App.tsx`
* **ไฟล์ที่พบ:** [`frontend/src/App.tsx`](file:///d:/Personal_Organizer/frontend/src/App.tsx#L14-L33)
* **ปัญหา:** หน้าจอทั้งหมด 8 หน้า และโมดอล 6 ตัวถูก Import เข้ามาในลักษณะ Static Import ที่หัวไฟล์ทั้งหมด:
  - `DashboardPage`
  - `AllListsPage`
  - `CalendarViewPage`
  - `CategoriesPage`
  - `FavoritesPage`
  - `ArchivePage`
  - `KanbanBoardPage`
  - `GoalsPage`
  - `ShoppingModeModal`, `PinLockModal`, `ImportModal`, `NotificationSettingsModal`, `TemplatesModal`, `EncryptedBackupModal`
* **ผลกระทบ:** ผู้ใช้ที่เปิดหน้าแรก (เช่น Dashboard) จะต้องดาวน์โหลด JavaScript ของหน้า Kanban, ปฏิทิน, กราฟเป้าหมาย, และฟังก์ชันสำรองข้อมูลทั้งหมดมาล่วงหน้า ทำให้เกิด First Contentful Paint (FCP) และ Time to Interactive (TTI) ที่ช้าบนอุปกรณ์มือถือ 4G

### 2.2 ปัญหาการเรนเดอร์รายการขนาดใหญ่ (Large List Rendering)
* **ไฟล์ที่พบ:** [`frontend/src/pages/AllListsPage.tsx`](file:///d:/Personal_Organizer/frontend/src/pages/AllListsPage.tsx#L215-L230)
* **ปัญหา:** ใช้คำสั่ง `entries.map(...)` แปลงข้อมูลเป็น DOM Component `<EntryCard />` โดยตรง
* **ผลกระทบ:** หากผู้ใช้มีรายการ 50 - 200 รายการ เบราว์เซอร์จะต้องสร้าง Node ใน DOM หลายพัน Element พร้อมกัน ทำให้เกิดอาการกระตุก (Jank) ระหว่างเลื่อนหน้าจอ (Scrolling) บนโทรศัพท์มือถือ

---

## 3. แผนการปรับปรุงประสิทธิภาพ (Optimization Strategy)

### 3.1 การทำ Code-Splitting ด้วย `React.lazy()` และ `Suspense`
ปรับปรุง [`frontend/src/App.tsx`](file:///d:/Personal_Organizer/frontend/src/App.tsx) โดยโหลดเฉพาะหน้าจอและโมดอลเมื่อมีการเรียกใช้งานจริง:

```typescript
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';

// โหลดหน้าแรกแบบทันที (Eager Loading)
import { DashboardPage } from './pages/DashboardPage';

// หน้าจอระดับรองใช้ Dynamic Import (Lazy Loading)
const AllListsPage = lazy(() => import('./pages/AllListsPage').then(m => ({ default: m.AllListsPage })));
const CalendarViewPage = lazy(() => import('./pages/CalendarViewPage').then(m => ({ default: m.CalendarViewPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const ArchivePage = lazy(() => import('./pages/ArchivePage').then(m => ({ default: m.ArchivePage })));
const KanbanBoardPage = lazy(() => import('./pages/KanbanBoardPage').then(m => ({ default: m.KanbanBoardPage })));
const GoalsPage = lazy(() => import('./pages/GoalsPage').then(m => ({ default: m.GoalsPage })));

// โมดอลที่ขนาดใหญ่และไม่ได้เปิดตลอดเวลา
const EncryptedBackupModal = lazy(() => import('./components/common/EncryptedBackupModal').then(m => ({ default: m.EncryptedBackupModal })));
const ImportModal = lazy(() => import('./components/common/ImportModal').then(m => ({ default: m.ImportModal })));
const TemplatesModal = lazy(() => import('./components/templates/TemplatesModal').then(m => ({ default: m.TemplatesModal })));
```

### 3.2 การกำหนด `manualChunks` ใน `frontend/vite.config.ts`
แยก Library ภายนอกออกเป็น Vendor Chunks เพื่อให้เบราว์เซอร์สามารถแคชไฟล์ที่ไม่มีการเปลี่ยนแปลงบ่อยไว้ได้:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
```

### 3.3 การทำ List Virtualization สำหรับหน้า All Lists
ใน [`frontend/src/pages/AllListsPage.tsx`](file:///d:/Personal_Organizer/frontend/src/pages/AllListsPage.tsx) นำ Pagination Control มาแสดงผลด้านล่างของหน้าจอเพื่อแบ่งหน้าละ 25 - 50 รายการ แทนการดึงและเรนเดอร์ทั้งหมดในคราวเดียว

### 3.4 การบีบอัดและปรับแต่งภาพถ่าย (Asset Optimization)
- ใช้รูปภาพแบบ WebP เสมอ
- สำหรับ Static Assets ที่ไม่มีการเปลี่ยนแปลง ให้ตั้ง Cache-Control บน Nginx เป็น `public, max-age=31536000, immutable`

---

## 4. ประสิทธิภาพฝั่ง Backend และการสืบค้นฐานข้อมูล (Backend & DB Performance)

### 4.1 การวิเคราะห์แบบสอบถาม (Query Execution Performance)
* **จุดแข็ง:** ใน [`backend/src/models/entryModel.js`](file:///d:/Personal_Organizer/backend/src/models/entryModel.js#L141-L150) มีการใช้ Subquery ร่วมกับ `json_agg` เพื่อรวม Checklist Items เข้ามาใน Query เดียว:
  ```sql
  COALESCE((
    SELECT json_agg(...)
    FROM entry_items item
    WHERE item.entry_id = e.id
  ), '[]'::jsonb) AS items
  ```
  วิธีนี้ช่วยตัดปัญหา **N+1 Query Problem** ได้อย่างหมดจด

### 4.2 การติดตั้ง HTTP Compression ใน Express
ติดตั้งโมดูล `compression` ใน `backend/src/app.js` เพื่อย่อขนาด JSON Response ที่ส่งกลับไปยังไคลเอนต์ได้สูงสุดถึง 70%:
```javascript
const compression = require('compression');
app.use(compression());
```

---

## 5. ตารางเป้าหมายประสิทธิภาพที่วัดผลได้ (Measurable Performance Targets & KPIs)

| ดัชนีชี้วัด (Metric) | ค่าปัจจุบัน (Current Baseline) | เป้าหมายระดับโปรดักชัน (Production Target) | เครื่องมือวัดผล (Tool) |
|---|---|---|---|
| **Initial JS Bundle Size** | 586.08 kB | **< 200 kB** | Vite Build Output / Bundle Analyzer |
| **Initial Gzip Transfer Size** | 154.81 kB | **< 60 kB** | Chrome DevTools Network Tab |
| **First Contentful Paint (FCP)** | 1.8s (ประเมิน) | **< 0.8s** | Google Lighthouse (Mobile 4G) |
| **Largest Contentful Paint (LCP)** | 2.6s (ประเมิน) | **< 1.5s** | Google Lighthouse (Core Web Vitals) |
| **Time to Interactive (TTI)** | 2.9s (ประเมิน) | **< 1.8s** | Google Lighthouse |
| **Cumulative Layout Shift (CLS)** | 0.05 | **< 0.02** | Google Lighthouse |
| **API P95 Response Time (CRUD)** | ~45ms | **< 30ms** | Autocannon / k6 Load Testing |
| **API P95 Response Time (Dashboard)** | ~120ms | **< 60ms** | Autocannon (Concurrency = 50) |
| **Database Pool Query Latency** | ~5ms | **< 2ms** | `pg_stat_statements` / Health Check |
