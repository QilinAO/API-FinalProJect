// D:\ProJectFinal\Lasts\betta-fish-api\src\routes\users.js

const express = require('express');
const router = express.Router();

// --- Imports ---
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const multer = require('multer');

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('ไฟล์ต้องเป็นรูปภาพเท่านั้น (JPEG, PNG หรือ JPG)'));
  },
});

// =================================================================
//  Profile (ต้องล็อกอิน)
// =================================================================

// GET /api/users/me  → ดึงโปรไฟล์ของฉัน
router.get(
  '/me',
  authMiddleware,
  userController.getMyProfile
);

// PUT /api/users/profile  → อัปเดตโปรไฟล์ของฉัน
router.put(
  '/profile',
  authMiddleware,
  userController.updateProfile
);

// POST /api/users/profile/picture  → อัปโหลดรูปโปรไฟล์ (field: profilePicture)
router.post(
  '/profile/picture',
  authMiddleware,
  upload.single('profilePicture'),
  userController.uploadProfilePicture
);

// =================================================================
//  History (ต้องล็อกอิน)
//  หมายเหตุ: ให้ทั้งรูปแบบใหม่ (/me/*) และแบบเดิม (/history/*) เพื่อไม่ให้ FE เดิมพัง
// =================================================================

// NEW: GET /api/users/me/evaluations  → ประวัติการส่งประเมินคุณภาพของฉัน
router.get(
  '/me/evaluations',
  authMiddleware,
  userController.getEvaluationHistory
);

// NEW: GET /api/users/me/competitions  → ประวัติการเข้าร่วมประกวดของฉัน
router.get(
  '/me/competitions',
  authMiddleware,
  userController.getCompetitionHistory
);

// BACK-COMPAT: GET /api/users/history/evaluations
router.get(
  '/history/evaluations',
  authMiddleware,
  userController.getEvaluationHistory
);

// BACK-COMPAT: GET /api/users/history/competitions
router.get(
  '/history/competitions',
  authMiddleware,
  userController.getCompetitionHistory
);

// =================================================================
//  Admin (ตัวอย่าง) — ดึงรายชื่อผู้ใช้ทั้งหมด
//  ปกติ mount เป็น /api/users  → จึงเท่ากับ GET /api/users/
// =================================================================
router.get(
  '/',
  authMiddleware,
  checkRole(['admin']),
  userController.getAllUsers
);

module.exports = router;
