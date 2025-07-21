const express = require('express');
const router = express.Router();

// --- Imports ---
const { userController, uploadMiddleware } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// =================================================================
//  Routes สำหรับจัดการข้อมูลส่วนตัว (ต้อง Login)
// =================================================================

// PUT /api/users/profile
// อัปเดตข้อมูลโปรไฟล์ (ชื่อ, นามสกุล, username)
router.put(
    '/profile',
    authMiddleware, // ตรวจสอบ Token
    userController.updateProfile
);

// POST /api/users/profile/picture
// อัปโหลดรูปโปรไฟล์ใหม่
router.post(
  '/profile/picture',
  authMiddleware, // ตรวจสอบ Token
  uploadMiddleware, // จัดการไฟล์ที่ส่งมากับ field 'profilePicture'
  userController.uploadProfilePicture
);


// =================================================================
//  Routes สำหรับดึงประวัติการใช้งาน (ต้อง Login)
// =================================================================

// GET /api/users/history/evaluations
// ดึงประวัติการส่งประเมินคุณภาพทั้งหมด
router.get(
  '/history/evaluations',
  authMiddleware, // ตรวจสอบ Token
  userController.getEvaluationHistory
);

// GET /api/users/history/competitions
// [เพิ่มใหม่] ดึงประวัติการแข่งขันทั้งหมด
router.get(
  '/history/competitions',
  authMiddleware, // ตรวจสอบ Token
  userController.getCompetitionHistory
);


module.exports = router;