// D:\ProJectFinal\Lasts\betta-fish-api\src\routes\adminRoutes.js (ฉบับสมบูรณ์)

// --- ส่วนที่ 1: การนำเข้า (Imports) ---

// นำเข้า Express Router เพื่อใช้ในการจัดการเส้นทาง
const router = require('express').Router();

// นำเข้า Controller ที่เราจะเรียกใช้งาน
const adminController = require('../controllers/adminController');

// นำเข้า Middleware สำหรับการตรวจสอบสิทธิ์
const authMiddleware = require('../middleware/authMiddleware'); // Middleware ตรวจสอบว่า Login หรือยัง
const checkRole = require('../middleware/roleMiddleware');     // Middleware ตรวจสอบว่าเป็น Role 'admin' หรือไม่


// --- ส่วนที่ 2: การใช้ Middleware แบบครอบคลุม (Global Middleware for this Router) ---

// router.use(...) คือการบอกว่าให้ Middleware ที่ระบุ ทำงาน "ก่อน" ทุกๆ Route ที่จะถูกกำหนดหลังจากนี้
// ในที่นี้หมายความว่า ทุกๆ request ที่เข้ามายังเส้นทางของ Admin จะต้องผ่านด่าน 2 ด่านนี้ก่อนเสมอ:
// 1. authMiddleware: ตรวจสอบ Token เพื่อให้แน่ใจว่าผู้ใช้ Login แล้ว
// 2. checkRole('admin'): ตรวจสอบ Role ของผู้ใช้เพื่อให้แน่ใจว่าเป็น 'admin' เท่านั้น
router.use(authMiddleware, checkRole('admin'));


// --- ส่วนที่ 3: การกำหนดเส้นทางย่อย (Route Definitions) ---

// GET /api/admin/dashboard/stats
// เส้นทางสำหรับดึงข้อมูลสรุปสำหรับหน้า Dashboard ของ Admin
// เมื่อมี request เข้ามาที่ URL นี้ จะไปเรียกใช้ฟังก์ชัน getDashboardStats ใน adminController
router.get('/dashboard/stats', adminController.getDashboardStats);

// GET /api/admin/users
// เส้นทางสำหรับดึงข้อมูลผู้ใช้ทั้งหมด
// เมื่อมี request เข้ามาที่ URL นี้ จะไปเรียกใช้ฟังก์ชัน getAllUsers ใน adminController
router.get('/users', adminController.getAllUsers);

// POST /api/admin/users
// เส้นทางสำหรับสร้างผู้ใช้ใหม่
// เมื่อมี request เข้ามาที่ URL นี้ จะไปเรียกใช้ฟังก์ชัน createUser ใน adminController
router.post('/users', adminController.createUser);

// DELETE /api/admin/users/:id
// เส้นทางสำหรับลบผู้ใช้ตาม ID (เช่น /api/admin/users/abc-123)
// เมื่อมี request เข้ามาที่ URL นี้ จะไปเรียกใช้ฟังก์ชัน deleteUser ใน adminController
router.delete('/users/:id', adminController.deleteUser);


// --- ส่วนที่ 4: การส่งออก (Export) ---

// ส่งออก router ที่เราตั้งค่าทั้งหมดแล้ว เพื่อให้ app.js สามารถนำไปใช้งานต่อได้
module.exports = router;