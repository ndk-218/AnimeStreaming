// ===== AVATAR UPLOAD MIDDLEWARE =====
// Upload và resize avatar về 128x128px

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// ===== MULTER STORAGE CONFIG =====
const storage = multer.memoryStorage(); // Lưu vào memory để xử lý bằng Sharp

// ===== FILE FILTER =====
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP)'), false);
  }
};

// ===== MULTER CONFIG =====
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// ===== EXPORT =====
module.exports = upload;
