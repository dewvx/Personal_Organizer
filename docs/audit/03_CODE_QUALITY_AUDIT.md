# 03. Code Quality Audit — Personal Organizer

**Project:** Personal Organizer ("One App, All Your Lists")  
**Audit Date:** October 2026  
**Auditor:** Senior Full Stack Engineer & Code Quality Specialist  
**Classification:** Source Code Quality & Static Analysis Assessment  

---

## 1. Executive Summary

จากการตรวจสอบ Source Code ทั้งในส่วน Frontend (React 19 + TypeScript + Vite) และ Backend (Node.js + Express + pg) อย่างละเอียด พร้อมกับการรันเครื่องมือ Static Analysis ([oxlint](https://oxc.rs/docs/guide/usage/linter.html) v1.89.0 และ TypeScript Compiler `tsc --noEmit`) พบว่า:

1. **ภาพรวม (Overall Quality):** โค้ดถูกเขียนขึ้นอย่างประณีต มีการตั้งชื่อตัวแปรและฟังก์ชันที่สื่อความหมายชัดเจน (Naming Conventions ดีเยี่ยม) มีการจัดโครงสร้างโค้ดและ Type Definition ค่อนข้างครบถ้วน และรันผ่าน TypeScript Compiler โดยไม่มี Type Error
2. **ปัญหาคุณภาพโค้ดที่ตรวจพบ (Identified Deficiencies):**
   - **Static Analysis Warnings:** ตรวจพบการแจ้งเตือนจาก Oxlint ทั้งสิ้น **42 จุด** (เช่น `react(set-state-in-effect)`, `react(purity)`, `eslint(no-unused-vars)`)
   - **Anti-Patterns ในการจัดการ State:** มีการใช้ `window.location.reload()` เพื่อแก้ปัญหา State ไม่ซิงค์กันหลังการลบข้อมูล และการใช้ `key={`dashboard_${refreshKey}`}` เพื่อบังคับ Remount หน้าจอ
   - **Violations of SOLID & DRY Principles:** มีโค้ดซ้ำซ้อน (Code Duplication) ในการจัดการ Action Handlers ทั่วทั้ง 4 หน้าหลัก และ Violation of Single Responsibility Principle (SRP) ในคอมโพเนนต์ฟอร์มขนาดใหญ่

---

## 2. Evaluation by Code Quality Dimensions

### 2.1 Code Readability & Naming Conventions
- **คะแนนการประเมิน:** **4.5 / 5.0 (ดีมาก)**
- **การวิเคราะห์:**
  - การตั้งชื่อไฟล์ สอดคล้องกับมาตรฐานอุตสาหกรรม (PascalCase สำหรับ React Components เช่น `EntryCard.tsx`, camelCase สำหรับ Utilities และ Services เช่น `entryService.ts`, `formatters.ts`)
  - ตัวแปรและฟังก์ชันสื่อความหมายตรงตัว เช่น `handleToggleShoppingItem`, `archiveAllCompleted`, `calculateTotalAmount`
  - มีการเขียน JSDoc / Comment อธิบายการทำงานของฟังก์ชันหลักในภาษาไทยและภาษาอังกฤษอย่างสม่ำเสมอ

### 2.2 Type Safety
- **คะแนนการประเมิน:** **4.0 / 5.0 (ดี)**
- **การวิเคราะห์:**
  - มีไฟล์ [types/index.ts](file:///d:/Personal_Organizer/frontend/src/types/index.ts) ที่กำหนด Interface ไว้อย่างชัดเจน (`Entry`, `Category`, `EntryItem`, `EntryStatus`, `EntryPriority`, `ApiResponse<T>`)
  - **จุดที่พบข้อบกพร่อง:**
    - ยังมีการใช้ `any` ในหลายจุดที่สำคัญ เช่น:
      - [useSpeechRecognition.ts#L12](file:///d:/Personal_Organizer/frontend/src/hooks/useSpeechRecognition.ts#L12): `const recognitionRef = useRef<any>(null);`
      - [ShoppingModeModal.tsx#L29](file:///d:/Personal_Organizer/frontend/src/components/entries/ShoppingModeModal.tsx#L29): `const wakeLockRef = useRef<any>(null);`
      - [AllListsPage.tsx#L69](file:///d:/Personal_Organizer/frontend/src/pages/AllListsPage.tsx#L69): `catch (err: any)`
    - มีการใช้ Type Assertion แบบข้ามข้อจำกัด เช่น `data as any` ใน [CategoriesPage.tsx#L35](file:///d:/Personal_Organizer/frontend/src/pages/CategoriesPage.tsx#L35)

### 2.3 Error Handling
- **คะแนนการประเมิน:** **3.0 / 5.0 (ปานกลาง)**
- **การวิเคราะห์:**
  - **Backend:** มี Global Error Handler ([errorHandler.js](file:///d:/Personal_Organizer/backend/src/middlewares/errorHandler.js)) ที่ดักจับ Error Code สำคัญของ PostgreSQL ได้ดี (`23505` Duplicate, `23503` Foreign Key, `22P02` Invalid Format)
  - **Frontend:** มีการครอบ `try / catch` ในทุก Service Call และแสดงผลผ่าน `useToast()`
  - **ข้อบกพร่องที่พบ:**
    - มี Catch Block ที่ดักจับ Error แล้วกลืน Error ทิ้ง (Swallowed Errors) โดยไม่แจ้งเตือนผู้ใช้ เช่น ใน [haptics.ts#L24-L26](file:///d:/Personal_Organizer/frontend/src/utils/haptics.ts#L24-L26) และ [Header.tsx#L40](file:///d:/Personal_Organizer/frontend/src/components/layout/Header.tsx#L40)
    - ขาด **React Error Boundary** ที่ครอบ Component Tree หากเกิด JavaScript Runtime Crash ใน Component ย่อย หน้าจอทั้งหมดจะกลายเป็นสีขาว (White Screen of Death)

### 2.4 Separation of Concerns & SOLID Principles
- **คะแนนการประเมิน:** **2.5 / 5.0 (ต้องปรับปรุง)**
- **การวิเคราะห์:**
  - **Single Responsibility Principle (SRP) Violation:**
    - [EntryFormModal.tsx](file:///d:/Personal_Organizer/frontend/src/components/entries/EntryFormModal.tsx) (600 บรรทัด) รับผิดชอบทั้งการ Render Form UI, การจัดการ State 14 ตัว, การเชื่อมต่อ Web Speech Recognition 2 ตัว, การจัดการ Dynamic Checklist Item, การคำนวณราคารวม, และการแปลง Tag String
  - **Open/Closed Principle (OCP) Violation:**
    - การเพิ่ม Status หรือ Priority ใหม่ ต้องเข้าไปแก้โค้ดแบบ Hardcoded ในหลายไฟล์พร้อมกัน: Database Enum, Type Definition, [formatters.ts](file:///d:/Personal_Organizer/frontend/src/utils/formatters.ts), และ `validStatuses` ใน [entryService.js](file:///d:/Personal_Organizer/backend/src/services/entryService.js#L62)

### 2.5 DRY (Don't Repeat Yourself) Principle
- **คะแนนการประเมิน:** **2.0 / 5.0 (ต้องปรับปรุงอย่างเร่งด่วน)**
- **การวิเคราะห์:**
  - **Code Duplication ใน UI Handlers:** โค้ดชุดเดียวกันสำหรับการ Toggle Status, Favorite, Archive ถูกเขียนซ้ำใน 4 หน้าหลัก:
    - [DashboardPage.tsx](file:///d:/Personal_Organizer/frontend/src/pages/DashboardPage.tsx#L65-L94)
    - [AllListsPage.tsx](file:///d:/Personal_Organizer/frontend/src/pages/AllListsPage.tsx#L80-L117)
    - [CalendarViewPage.tsx](file:///d:/Personal_Organizer/frontend/src/pages/CalendarViewPage.tsx#L58-L93)
    - [FavoritesPage.tsx](file:///d:/Personal_Organizer/frontend/src/pages/FavoritesPage.tsx#L46-L78)
  - **SQL Query Duplication:** Subquery `json_agg` สำหรับดึง Sub-items ถูก Copy & Paste ซ้ำกันถึง 5 จุดใน [entryModel.js](file:///d:/Personal_Organizer/backend/src/models/entryModel.js)

### 2.6 Accessibility (a11y)
- **คะแนนการประเมิน:** **2.5 / 5.0 (ต้องปรับปรุง)**
- **การวิเคราะห์:**
  - ปุ่มส่วนใหญ่ขาด `aria-label` ชัดเจน (มีเพียงบางปุ่มเช่น Checkbox ใน EntryCard ที่ใส่)
  - การกดปุ่มบน Mobile Keypad ใน [PinLockModal.tsx](file:///d:/Personal_Organizer/frontend/src/components/common/PinLockModal.tsx) ไม่มี Keyboard Event Listener (ผู้ใช้ไม่สามารถกดปุ่ม Numpad บนคีย์บอร์ดคอมพิวเตอร์เพื่อปลดล็อกได้ ต้องใช้เมาส์คลิกเท่านั้น)
  - สีข้อความใน Dark Mode มี Contrast ต่ำในบางจุด เช่น `text-slate-500` บนพื้นหลัง `bg-slate-900`

---

## 3. Static Analysis Findings (Oxlint Report)

จากการสั่งรันคำสั่ง `oxlint` บนโค้ด Frontend พบคำเตือนรวม **42 จุด** โดยแบ่งออกเป็นประเภทหลักได้ดังนี้:

| กฎ Lint (Rule) | จำนวน | ตัวอย่างตำแหน่งที่พบ | ผลกระทบ |
| :--- | :---: | :--- | :--- |
| `react(set-state-in-effect)` | **12** | `PinLockModal.tsx:24`, `EntryFormModal.tsx:77`, `DashboardPage.tsx:62` | เรียก `setState` ทันทีใน `useEffect` ทำให้เกิด Cascading Render (Render 2 รอบซ้อน) และบล็อก React Compiler Optimization |
| `react(purity)` | **3** | `Header.tsx:29`, `CalendarViewPage.tsx:33` | เรียกใช้ `new Date()` โดยตรงระหว่าง Render ทำให้ฟังก์ชันไม่เป็น Pure Function |
| `react(only-export-components)` | **2** | `ThemeContext.tsx:38`, `ToastContext.tsx:69` | Export Hook ร่วมกับ Component ในไฟล์เดียวกัน ทำให้ Vite Fast Refresh / HMR ทำงานผิดพลาด |
| `eslint(no-unused-vars)` | **25** | `sw.js:2` (CACHE_NAME), `Header.tsx:40` (err), `haptics.ts:24` (e) | มีตัวแปรหรือพารามิเตอร์ที่ประกาศไว้แต่ไม่ได้ใช้งาน รกโค้ด |

---

## 4. Deep-Dive Issues & Anti-Patterns

### 1. Hard Page Reload Anti-Pattern
- **ไฟล์ที่พบ:**
  - [frontend/src/App.tsx#L99](file:///d:/Personal_Organizer/frontend/src/App.tsx#L99)
  - [frontend/src/pages/ArchivePage.tsx#L58](file:///d:/Personal_Organizer/frontend/src/pages/ArchivePage.tsx#L58)
  - [frontend/src/pages/CategoriesPage.tsx#L51](file:///d:/Personal_Organizer/frontend/src/pages/CategoriesPage.tsx#L51)
- **โค้ดที่เป็นปัญหา:**
  ```typescript
  await EntryService.delete(deletingEntryId);
  setDeletingEntryId(null);
  window.location.reload(); // ❌ ทำลาย SPA Lifecycle
  ```
- **ผลกระทบ:** หน้าเว็บกระพริบขาว (FOUC), สูญเสีย State ของแอปพลิเคชันทั้งหมด, ทำลายประสบการณ์ใช้งานบน Mobile PWA อย่างรุนแรง

---

### 2. Force Remount via `key` Prop Hack
- **ไฟล์ที่พบ:** [frontend/src/App.tsx#L166-L223](file:///d:/Personal_Organizer/frontend/src/App.tsx#L166-L223)
- **โค้ดที่เป็นปัญหา:**
  ```tsx
  <DashboardPage key={`dashboard_${refreshKey}`} ... />
  <AllListsPage key={`all_${refreshKey}`} ... />
  ```
- **ผลกระทบ:** React จะทำลาย DOM Tree เดิมและสร้าง Component ขึ้นมาใหม่ทั้งหมด แทนที่จะอัปเดตเฉพาะจุดที่มีการเปลี่ยนแปลงข้อมูล ส่งผลให้กิน CPU/Memory สูงโดยไม่จำเป็น

---

### 3. Missing Transaction in Delete & Re-insert Cycle
- **ไฟล์ที่พบ:** [backend/src/models/entryModel.js#L365-L383](file:///d:/Personal_Organizer/backend/src/models/entryModel.js#L365-L383)
- **โค้ดที่เป็นปัญหา:**
  ```javascript
  await query(`DELETE FROM entry_items WHERE entry_id = $1`, [id]);
  for (let i = 0; i < data.items.length; i++) {
    await query(`INSERT INTO entry_items ...`, [...]);
  }
  ```
- **ผลกระทบ:** Data Loss หากการ Insert รายการใดรายการหนึ่งล้มเหลว รายการเดิมที่ถูกลบไปแล้วจะไม่ย้อนกลับคืนมา

---

## 5. Specific Code Quality Findings Table

| # | ไฟล์ที่พบ | ปัญหาที่ตรวจพบ | ผลกระทบ | ระดับความรุนแรง | แนวทางแก้ไขที่แนะนำ |
| :-: | :--- | :--- | :--- | :-: | :--- |
| **1** | `backend/src/models/entryModel.js` (L365) | ขาด Transaction ครอบ DELETE และ INSERT ของ Sub-items | เสี่ยงเกิด Data Loss ถาวรเมื่อเซิร์ฟเวอร์ขัดข้อง | **Critical** | ใช้ `client = await pool.connect()` พร้อม `BEGIN`, `COMMIT`, `ROLLBACK` |
| **2** | `frontend/src/App.tsx` (L99) | ใช้ `window.location.reload()` หลังการลบข้อมูล | หน้าจอกระพริบ รีเซ็ต State ทั้งหมด ขัดต่อหลักการ SPA | **High** | อัปเดต Client State ใน React โดยตรง หรือใช้ TanStack Query Invalidation |
| **3** | `frontend/src/App.tsx` (L166) | ใช้ `refreshKey` บังคับ Remount ทุก Component ทั้งหน้า | Performance ตก เกิดการ Re-mount และ Render ซ้ำซ้อน | **Medium** | ใช้ State Management ที่เหมาะสมเพื่อ Re-fetch เฉพาะข้อมูลที่เปลี่ยน |
| **4** | `frontend/src/pages/DashboardPage.tsx` และอีก 3 หน้า | Code Duplication ของ Handler ฟังก์ชัน Toggle 4 ชุด | แก้ไขโค้ดไม่พร้อมเพรียง เสี่ยงเกิด Regression สูง | **Medium** | สร้าง Custom Hook `useEntryActions.ts` รวมศูนย์การจัดการ Action |
| **5** | `frontend/src/components/entries/EntryFormModal.tsx` | Violation of SRP (คอมโพเนนต์ยาว 600 บรรทัด รวมทุกหน้าที่) | ดูแลรักษายาก ทดสอบ Unit Test ไม่ได้ | **Medium** | แยกเป็นคอมโพเนนต์ย่อย เช่น `SubItemsEditor.tsx`, `SpeechInputButton.tsx` |
| **6** | `backend/src/models/entryItemModel.js` (L133) | `syncParentAmount` ไม่เคลียร์ยอดเมื่อ Sub-items ถูกลบจนหมด | ยอดเงินรวมของรายการหลักผิดพลาด (Inconsistent Data) | **Medium** | อัปเดต Query ให้ตั้งค่า `amount = 0` หรือ `NULL` เมื่อ `items_count === 0` |
| **7** | `frontend/src/components/common/PinLockModal.tsx` (L24) | Cascading Renders (`setState` ใน `useEffect`) | ประสิทธิภาพลดลง และ React Compiler ไม่สามารถ Optimize ได้ | **Low** | กำหนดค่าเริ่มต้นใน `useState` โดยตรง หรือ Derive State ระหว่าง Render |
| **8** | `frontend/src/context/ThemeContext.tsx` (L38) | Export Hook ร่วมกับ Provider ในไฟล์เดียว | ขัดขวางการทำงานของ Vite Fast Refresh / HMR | **Low** | ย้าย Custom Hook `useTheme` ไปไว้ที่ `src/hooks/useTheme.ts` |
