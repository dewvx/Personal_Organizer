const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Enforce safe extension matching validated MIME type strictly
    const safeExt = MIME_TO_EXT[file.mimetype] || '.bin';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `attachment-${uniqueSuffix}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = Object.keys(MIME_TO_EXT);
  const originalExt = path.extname(file.originalname).toLowerCase();
  const dangerousExts = ['.html', '.htm', '.svg', '.js', '.mjs', '.php', '.exe', '.sh', '.bat', '.cmd'];

  if (dangerousExts.includes(originalExt)) {
    return cb(new Error('ประเภทไฟล์ไม่ปลอดภัย ไม่อนุญาตให้อัปโหลดไฟล์ประเภทนี้'), false);
  }

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF) หรือ PDF เท่านั้น'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

module.exports = {
  upload,
  uploadDir,
};
