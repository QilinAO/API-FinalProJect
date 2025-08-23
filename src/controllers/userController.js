// ======================================================================
// File: src/controllers/userController.js
// หน้าที่: จัดการ Logic การทำงานที่เกี่ยวข้องกับข้อมูลผู้ใช้ (Profile, History)
// ======================================================================

const multer = require('multer');
const userService = require('../services/userService');

/**
 * Utility function สำหรับครอบ (wrap) async route handlers
 * เพื่อจัดการ Error และส่งต่อไปยัง Global Error Handler โดยอัตโนมัติ
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// --- Multer Configuration ---
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

class UserController {
  /**
   * ดึงโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่
   * Route: GET /api/users/profile (หรือ /api/auth/profile)
   */
  getMyProfile = asyncWrapper(async (req, res) => {
    const profile = await userService.getProfile(req.userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลโปรไฟล์' });
    }
    res.json({ success: true, profile });
  });

  /**
   * อัปเดตข้อมูลโปรไฟล์
   * Route: PUT /api/users/profile
   */
  updateProfile = asyncWrapper(async (req, res) => {
    const updatedProfile = await userService.updateProfile(req.userId, req.body);
    res.json({ success: true, message: 'อัปเดตโปรไฟล์สำเร็จ', data: updatedProfile });
  });

  /**
   * อัปโหลดรูปโปรไฟล์
   * Route: POST /api/users/profile/picture
   */
  uploadProfilePicture = asyncWrapper(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'ไม่พบไฟล์รูปภาพ' });
    }
    const updatedProfile = await userService.uploadProfilePicture(req.userId, req.file);
    res.json({ success: true, message: 'อัปโหลดรูปโปรไฟล์สำเร็จ', data: updatedProfile });
  });

  /**
   * ดึงประวัติการส่งประเมินคุณภาพ
   * Route: GET /api/users/history/evaluations
   */
  getEvaluationHistory = asyncWrapper(async (req, res) => {
    const history = await userService.getEvaluationHistory(req.userId);
    res.json({ success: true, data: history });
  });

  /**
   * ดึงประวัติการเข้าร่วมการแข่งขัน
   * Route: GET /api/users/history/competitions
   */
  getCompetitionHistory = asyncWrapper(async (req, res) => {
    const history = await userService.getCompetitionHistory(req.userId);
    res.json({ success: true, data: history });
  });

  /**
   * [Admin Only] ดึงรายชื่อผู้ใช้ทั้งหมด
   * Route: GET /api/users
   */
  getAllUsers = asyncWrapper(async (req, res) => {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  });
}

// --- Export ---
const userController = new UserController();

module.exports = {
  userController,
  uploadMiddleware: upload.single('profilePicture'),
};