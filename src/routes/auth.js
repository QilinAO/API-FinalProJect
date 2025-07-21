// D:\ProJectFinal\Lasts\betta-fish-api\src\routes\authRoutes.js (ฉบับสมบูรณ์)

const express = require('express');
const router = express.Router();

// 1. Controller: นำเข้า Controller ที่จัดการตรรกะการยืนยันตัวตน
const authController = require('../controllers/authController');

// 2. Validation Middleware: นำเข้า Middleware สำหรับตรวจสอบความถูกต้องของข้อมูล
const { validateSignUp, validateSignIn } = require('../middleware/validation');

// 3. Authentication Middleware: นำเข้า Middleware หลักสำหรับตรวจสอบ Token (ตัวที่ถูกต้อง)
const authMiddleware = require('../middleware/authMiddleware');

/* --- Routes ที่ไม่ต้องมีการยืนยันตัวตน (Public Routes) --- */

// POST /api/auth/signup: เส้นทางสำหรับสมัครสมาชิก
// -> validateSignUp: ตรวจสอบข้อมูลที่ส่งมา (อีเมล, รหัสผ่าน, ...) ก่อน
// -> authController.signUp: ถ้าข้อมูลถูกต้อง ให้เริ่มกระบวนการสมัคร
router.post('/signup', validateSignUp, authController.signUp);

// POST /api/auth/signin: เส้นทางสำหรับเข้าสู่ระบบ
// -> validateSignIn: ตรวจสอบว่ามีอีเมลและรหัสผ่านส่งมา
// -> authController.signIn: ถ้าข้อมูลถูกต้อง ให้เริ่มกระบวนการเข้าสู่ระบบ
router.post('/signin', validateSignIn, authController.signIn);

// POST /api/auth/signout: เส้นทางสำหรับออกจากระบบ
// ไม่ต้องใช้ Middleware เพราะเป็นการแจ้งให้ Client ลบ Token ทิ้งเท่านั้น
router.post('/signout', authController.signOut);


/* --- Routes ที่ต้องมีการยืนยันตัวตน (Protected Routes) --- */

// GET /api/auth/profile: ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ Login อยู่
// -> authMiddleware: ตรวจสอบ Bearer Token ที่ส่งมาใน Header ก่อน
//    ถ้า Token ถูกต้อง จะแนบ userId ไปกับ request (req.userId)
// -> authController.getProfile: ดึงข้อมูลโปรไฟล์โดยใช้ req.userId
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;