require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query, pool } = require('../config/database');

const BUILTIN_TEMPLATES = [
  {
    title: 'จัดกระเป๋าไปเที่ยวทะเล 3 วัน 2 คืน',
    description: 'เช็กลิสต์เตรียมของจำเป็นสำหรับการเดินทางพักผ่อนริมทะเล',
    category_name: 'ท่องเที่ยว',
    icon: 'compass',
    color: '#0EA5E9',
    priority: 'medium',
    estimated_amount: 3500,
    tags: ['ท่องเที่ยว', 'พักผ่อน', 'จัดกระเป๋า'],
    items: [
      { title: 'ชุดว่ายน้ำ / กางเกงว่ายน้ำ', quantity: 2, amount: 0, is_completed: false },
      { title: 'เสื้อผ้าใส่เที่ยวและชุดนอน', quantity: 3, amount: 0, is_completed: false },
      { title: 'ครีมกันแดด SPF 50+', quantity: 1, amount: 350, is_completed: false },
      { title: 'แว่นตากันแดดและหมวกปีกกว้าง', quantity: 1, amount: 0, is_completed: false },
      { title: 'ยาประจำตัวและยาสามัญ (ยาแก้แพ้, ยาแก้เมารถ)', quantity: 1, amount: 150, is_completed: false },
      { title: 'พาวเวอร์แบงก์และสายชาร์จโทรศัพท์', quantity: 1, amount: 0, is_completed: false },
      { title: 'ซองกันน้ำใส่โทรศัพท์มือถือ', quantity: 1, amount: 100, is_completed: false },
      { title: 'รองเท้าแตะเดินชายหาด', quantity: 1, amount: 200, is_completed: false },
      { title: 'บัตรประชาชนและใบขับขี่', quantity: 1, amount: 0, is_completed: false },
    ],
  },
  {
    title: 'แผนงบประมาณและบิลรายจ่ายประจำเดือน',
    description: 'รวบรวมค่าใช้จ่ายประจำที่ต้องชำระทุกสิ้นเดือนเพื่อการบริหารเงินอย่างมีวินัย',
    category_name: 'การเงิน',
    icon: 'wallet',
    color: '#10B981',
    priority: 'high',
    estimated_amount: 19400,
    tags: ['การเงิน', 'รายจ่ายประจำ', 'บิล'],
    items: [
      { title: 'ค่าน้ำประปาประจำเดือน', quantity: 1, amount: 300, is_completed: false },
      { title: 'ค่าไฟฟ้าประจำเดือน', quantity: 1, amount: 1500, is_completed: false },
      { title: 'ค่าอินเทอร์เน็ตบ้าน / มือถือ', quantity: 1, amount: 600, is_completed: false },
      { title: 'ค่าเช่าห้อง / ค่างวดผ่อนคอนโด', quantity: 1, amount: 12000, is_completed: false },
      { title: 'ชำระยอดบัตรเครดิตเต็มจำนวน', quantity: 1, amount: 5000, is_completed: false },
    ],
  },
  {
    title: 'วางแผนย้ายบ้าน / ย้ายคอนโด',
    description: 'ขั้นตอนและเช็กลิสต์สำคัญสำหรับการย้ายที่อยู่ใหม่แบบราบรื่นไร้กังวล',
    category_name: 'งานบ้าน',
    icon: 'home',
    color: '#F59E0B',
    priority: 'high',
    estimated_amount: 4500,
    tags: ['ย้ายบ้าน', 'คอนโด', 'จัดระเบียบ'],
    items: [
      { title: 'นัดวันตรวจรับมอบห้อง / จดเลขมิเตอร์น้ำ-ไฟ', quantity: 1, amount: 0, is_completed: false },
      { title: 'แจ้งเปลี่ยนที่อยู่ในการจัดส่งเอกสารและธนาคาร', quantity: 1, amount: 0, is_completed: false },
      { title: 'ซื้อกล่องกระดาษ บับเบิ้ลกันกระแทก และเทปกาว', quantity: 1, amount: 500, is_completed: false },
      { title: 'คัดแยกสิ่งของที่ไม่ใช้เพื่อบริจาคหรือทิ้ง', quantity: 1, amount: 0, is_completed: false },
      { title: 'จองคิวรถกระบะขนของรับจ้าง', quantity: 1, amount: 2500, is_completed: false },
      { title: 'แจ้งย้ายจุดติดตั้งอินเทอร์เน็ตบ้านไปยังที่อยู่ใหม่', quantity: 1, amount: 0, is_completed: false },
      { title: 'จ้างแม่บ้านทำความสะอาดห้องเก่า (Big Cleaning)', quantity: 1, amount: 1500, is_completed: false },
    ],
  },
  {
    title: 'เช็กลิสต์เตรียมตัวตรวจสุขภาพประจำปี',
    description: 'ข้อควรปฏิบัติและรายการตรวจสุขภาพประจำปีเพื่อสุขภาพที่ดีอย่างยั่งยืน',
    category_name: 'สุขภาพ',
    icon: 'heart',
    color: '#EC4899',
    priority: 'medium',
    estimated_amount: 3200,
    tags: ['สุขภาพ', 'ตรวจร่างกาย', 'โรงพยาบาล'],
    items: [
      { title: 'งดน้ำและอาหารล่วงหน้าอย่างน้อย 8-10 ชั่วโมง', quantity: 1, amount: 0, is_completed: false },
      { title: 'พักผ่อนให้เพียงพออย่างน้อย 6-8 ชั่วโมงก่อนวันตรวจ', quantity: 1, amount: 0, is_completed: false },
      { title: 'ตรวจความสมบูรณ์ของเม็ดเลือด (CBC)', quantity: 1, amount: 400, is_completed: false },
      { title: 'ตรวจระดับน้ำตาลในเลือด (FBS / HbA1c)', quantity: 1, amount: 500, is_completed: false },
      { title: 'ตรวจระดับไขมันในเลือด (Cholesterol / Triglyceride)', quantity: 1, amount: 600, is_completed: false },
      { title: 'ตรวจการทำงานของตับและไต (Liver & Kidney Function)', quantity: 1, amount: 700, is_completed: false },
      { title: 'เอกซเรย์ทรวงอกและปอด (Chest X-Ray)', quantity: 1, amount: 1000, is_completed: false },
    ],
  },
  {
    title: 'ตรวจเช็กสภาพรถยนต์ก่อนออกทริปทางไกล',
    description: 'เช็กความพร้อม 7 จุดสำคัญของยานพาหนะ เพื่อความปลอดภัยสูงสุดตลอดการเดินทาง',
    category_name: 'ยานพาหนะ',
    icon: 'zap',
    color: '#8B5CF6',
    priority: 'urgent',
    estimated_amount: 800,
    tags: ['รถยนต์', 'ความปลอดภัย', 'เดินทางไกล'],
    items: [
      { title: 'ตรวจเช็กแรงดันลมยาง 4 ล้อ และยางอะไหล่', quantity: 1, amount: 0, is_completed: false },
      { title: 'เช็กระดับน้ำมันเครื่องและสีของน้ำมันเครื่อง', quantity: 1, amount: 0, is_completed: false },
      { title: 'เช็กระดับน้ำยาหล่อเย็นในหม้อน้ำและหม้อพัก', quantity: 1, amount: 150, is_completed: false },
      { title: 'ตรวจเช็กระดับน้ำมันเบรกและประสิทธิภาพผ้าเบรก', quantity: 1, amount: 0, is_completed: false },
      { title: 'ตรวจใบปัดน้ำฝนและเติมน้ำยาฉีดกระจก', quantity: 1, amount: 150, is_completed: false },
      { title: 'ตรวจเช็กแบตเตอรี่รถยนต์และขั้วต่อ', quantity: 1, amount: 0, is_completed: false },
      { title: 'ตรวจสอบไฟหน้า ไฟเลี้ยว และไฟเบรกทุกดวง', quantity: 1, amount: 500, is_completed: false },
    ],
  },
  {
    title: 'เริ่มต้นโปรเจกต์งานใหม่ (Project Kickoff Checklist)',
    description: 'กรอบการดำเนินงานมาตรฐานตั้งแต่เริ่มต้นจนถึงการส่งมอบงานอย่างเป็นมืออาชีพ',
    category_name: 'การงาน',
    icon: 'check-square',
    color: '#6366F1',
    priority: 'high',
    estimated_amount: 0,
    tags: ['โปรเจกต์', 'การทำงาน', 'Kickoff'],
    items: [
      { title: 'นัดประชุม Project Kickoff สรุปเป้าหมายและความคาดหวัง', quantity: 1, amount: 0, is_completed: false },
      { title: 'รวบรวม Requirements และจัดทำ Scope of Work (SOW)', quantity: 1, amount: 0, is_completed: false },
      { title: 'ออกแบบ Architecture & Wireframe เบื้องต้น', quantity: 1, amount: 0, is_completed: false },
      { title: 'แบ่งงานย่อยเป็น Milestones พร้อมกำหนดเดดไลน์', quantity: 1, amount: 0, is_completed: false },
      { title: 'พัฒนา Core Features ใน Sprint แรก', quantity: 1, amount: 0, is_completed: false },
      { title: 'ทดสอบระบบและแก้ไขข้อผิดพลาด (QA Testing)', quantity: 1, amount: 0, is_completed: false },
      { title: 'Deploy ขึ้น Production และส่งมอบงานให้ลูกค้า', quantity: 1, amount: 0, is_completed: false },
    ],
  },
  {
    title: 'ช้อปปิ้งของสดและวัตถุดิบเข้าครัวประจำสัปดาห์',
    description: 'รายการซื้อของสดและของใช้ในครัวเรือนเพื่อสุขภาพและประหยัดค่าอาหาร',
    category_name: 'ช้อปปิ้ง',
    icon: 'shopping-cart',
    color: '#10B981',
    priority: 'medium',
    estimated_amount: 1850,
    tags: ['ช้อปปิ้ง', 'ของสด', 'ทำอาหาร'],
    items: [
      { title: 'ไข่ไก่สด เบอร์ 2 (แพ็ก 30 ฟอง)', quantity: 1, amount: 140, is_completed: false },
      { title: 'อกไก่ลอกหนัง / สันในไก่ 1 กก.', quantity: 1, amount: 110, is_completed: false },
      { title: 'ผักสลัดไฮโดรโปนิกส์และมะเขือเทศราชินี', quantity: 2, amount: 120, is_completed: false },
      { title: 'นมสดพาสเจอร์ไรส์ 2 ลิตร', quantity: 1, amount: 95, is_completed: false },
      { title: 'ผลไม้ตามฤดูกาล (แอปเปิ้ล, ส้ม, กล้วยหอม)', quantity: 1, amount: 200, is_completed: false },
      { title: 'ข้าวกล้องหอมมะลิ 5 กก.', quantity: 1, amount: 220, is_completed: false },
      { title: 'เครื่องปรุงรส (น้ำมันมะกอก, ซีอิ๊วโซเดียมต่ำ)', quantity: 1, amount: 280, is_completed: false },
      { title: 'เนื้อปลาแซลมอนสด / ปลาดอลลี่', quantity: 1, amount: 350, is_completed: false },
      { title: 'กระดาษทิชชู่อเนกประสงค์สำหรับงานครัว', quantity: 1, amount: 85, is_completed: false },
      { title: 'น้ำยาทำความสะอาดและถุงขยะแยกประเภท', quantity: 1, amount: 250, is_completed: false },
    ],
  },
  {
    title: 'จัดระเบียบโต๊ะทำงานและทำความสะอาดคอมพิวเตอร์',
    description: 'เคลียร์สิ่งรบกวนสายตา ทำความสะอาดอุปกรณ์ไอที เพิ่มพลังและสมาธิในการทำงาน',
    category_name: 'จัดระเบียบ',
    icon: 'sparkles',
    color: '#6366F1',
    priority: 'low',
    estimated_amount: 300,
    tags: ['Productivity', 'จัดโต๊ะ', 'ทำความสะอาด'],
    items: [
      { title: 'เคลียร์กระดาษโน้ตและใบเสร็จเก่าที่ไม่ใช้แล้วทิ้ง', quantity: 1, amount: 0, is_completed: false },
      { title: 'จัดระเบียบสายไฟและสายชาร์จด้วยเคเบิลไทร์', quantity: 1, amount: 50, is_completed: false },
      { title: 'เช็ดทำความสะอาดหน้าจอคอมพิวเตอร์ด้วยน้ำยาเฉพาะ', quantity: 1, amount: 150, is_completed: false },
      { title: 'เป่าฝุ่นและเช็ดคราบแป้นพิมพ์คีย์บอร์ดและเมาส์', quantity: 1, amount: 100, is_completed: false },
      { title: 'จัดระเบียบไฟล์บนหน้าจอ Desktop และโฟลเดอร์ Downloads', quantity: 1, amount: 0, is_completed: false },
      { title: 'สำรองไฟล์สำคัญ (Backup) ขึ้น Cloud Drive', quantity: 1, amount: 0, is_completed: false },
    ],
  },
  {
    title: 'เตรียมตัวจัดงานเลี้ยงสังสรรค์ / วันเกิด',
    description: 'เช็กลิสต์การจัดงานเลี้ยงฉลองกับเพื่อนฝูงและครอบครัวอย่างอบอุ่นและราบรื่น',
    category_name: 'อีเวนต์',
    icon: 'gift',
    color: '#EC4899',
    priority: 'medium',
    estimated_amount: 5500,
    tags: ['ปาร์ตี้', 'วันเกิด', 'เลี้ยงสังสรรค์'],
    items: [
      { title: 'กำหนดธีมงาน วันที่ เวลา และสถานที่จัดงาน', quantity: 1, amount: 0, is_completed: false },
      { title: 'ส่งการ์ดเชิญและสรุปจำนวนผู้เข้าร่วมงาน (RSVP)', quantity: 1, amount: 0, is_completed: false },
      { title: 'สั่งเค้กวันเกิดและเทียนประดับล่วงหน้า 3 วัน', quantity: 1, amount: 800, is_completed: false },
      { title: 'สั่งอาหาร เครื่องดื่ม และของว่างสำหรับงานสังสรรค์', quantity: 1, amount: 3500, is_completed: false },
      { title: 'ซื้อพร็อพตกแต่งงาน ลูกโป่ง และไฟประดับ', quantity: 1, amount: 700, is_completed: false },
      { title: 'จัดเตรียมเพลย์ลิสต์เพลงสร้างบรรยากาศและเกมสนุกๆ', quantity: 1, amount: 0, is_completed: false },
      { title: 'เตรียมของขวัญขอบคุณผู้มาร่วมงาน (Favors)', quantity: 1, amount: 500, is_completed: false },
    ],
  },
  {
    title: 'วางแผนสอบวัดระดับภาษา / ศึกษาต่อต่างประเทศ',
    description: 'ตารางเตรียมความพร้อม 90 วันสู่การพิชิตคะแนนสอบภาษาเป้าหมาย',
    category_name: 'การศึกษา',
    icon: 'book-open',
    color: '#3B82F6',
    priority: 'high',
    estimated_amount: 7500,
    tags: ['เรียนต่อ', 'IELTS', 'TOEIC', 'ภาษา'],
    items: [
      { title: 'ทำแบบทดสอบจำลอง (Diagnostic Mock Test) วัดระดับปัจจุบัน', quantity: 1, amount: 0, is_completed: false },
      { title: 'จัดตารางอ่านหนังสือและฝึกทำข้อสอบวันละ 1.5 ชม.', quantity: 1, amount: 0, is_completed: false },
      { title: 'ซื้อหนังสือรวมข้อสอบจริงและข้อสอบเก่า 5 ปีย้อนหลัง', quantity: 1, amount: 650, is_completed: false },
      { title: 'ฝึกท่องศัพท์สำคัญวันละ 20 คำ (Anki Flashcards)', quantity: 1, amount: 0, is_completed: false },
      { title: 'ฝึกเขียน Task 1 & Task 2 สัปดาห์ละ 2 บทความ', quantity: 1, amount: 0, is_completed: false },
      { title: 'จองรอบสอบจริงและชำระค่าธรรมเนียมการสอบ', quantity: 1, amount: 6850, is_completed: false },
      { title: 'เตรียมบัตรประชาชน พาสปอร์ต และอุปกรณ์สอบในวันจริง', quantity: 1, amount: 0, is_completed: false },
    ],
  },
];

async function migrate() {
  console.log('🔄 Running templates migration...');
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        category_name VARCHAR(100) NULL,
        icon VARCHAR(50) NOT NULL DEFAULT 'sparkles',
        color VARCHAR(20) NOT NULL DEFAULT '#6366F1',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        estimated_amount NUMERIC(12, 2) NULL,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_templates_is_builtin ON templates(is_builtin);
    `);

    console.log('🌱 Checking / Seeding built-in life templates...');
    let insertedCount = 0;
    for (const t of BUILTIN_TEMPLATES) {
      const exists = await query(`SELECT id FROM templates WHERE title = $1 AND is_builtin = true LIMIT 1`, [t.title]);
      if (exists.rows.length === 0) {
        await query(
          `INSERT INTO templates (title, description, category_name, icon, color, priority, estimated_amount, tags, items, is_builtin)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
          [
            t.title,
            t.description,
            t.category_name,
            t.icon,
            t.color,
            t.priority,
            t.estimated_amount,
            JSON.stringify(t.tags),
            JSON.stringify(t.items),
          ]
        );
        insertedCount++;
      }
    }
    const totalBuiltin = await query(`SELECT COUNT(*)::int AS count FROM templates WHERE is_builtin = true`);
    console.log(`✅ Seeded ${insertedCount} new templates. Total built-in templates: ${totalBuiltin.rows[0].count}.`);

    console.log('✅ Templates migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
