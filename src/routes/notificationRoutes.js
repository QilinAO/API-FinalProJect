// D:\ProJectFinal\Lasts\betta-fish-api\src\routes\notificationRoutes.js (ฉบับสมบูรณ์)

// --- ส่วนที่ 1: การนำเข้า (Imports) ---

// นำเข้า Express Router เพื่อใช้ในการจัดการเส้นทาง
const router = require('express').Router();

// นำเข้า Middleware สำหรับการตรวจสอบสิทธิ์ (เช็คว่า Login หรือยัง)
const authMiddleware = require('../middleware/authMiddleware');

// นำเข้า Controller ที่เราจะเรียกใช้งาน
const notificationController = require('../controllers/notificationController');


// --- ส่วนที่ 2: การใช้ Middleware แบบครอบคลุม ---

// router.use(authMiddleware) คือการกำหนดว่า ทุกๆ Route ที่จะถูกสร้างขึ้นในไฟล์นี้
// จะต้องผ่านการตรวจสอบจาก `authMiddleware` ก่อนเสมอ
// ซึ่งหมายความว่า ผู้ใช้จะต้อง Login เพื่อส่ง Token มาด้วย ถึงจะสามารถเรียกใช้ API การแจ้งเตือนได้
router.use(authMiddleware);


// --- ส่วนที่ 3: การกำหนดเส้นทางย่อย (Route Definitions) ---

// GET /api/notifications/
// เส้นทางสำหรับ "ดึง" การแจ้งเตือนทั้งหมดของผู้ใช้ที่ Login อยู่
// เมื่อมี request เข้ามาที่ URL นี้ จะไปเรียกใช้ฟังก์ชัน getNotifications ใน notificationController
router.get('/', notificationController.getNotifications);

// POST /api/notifications/:id/read
// เส้นทางสำหรับ "อัปเดต" สถานะการแจ้งเตือนว่าอ่านแล้ว (เช่น /api/notifications/123/read)
// เมื่อมี request เข้ามาที่ URL นี้ จะไปเรียกใช้ฟังก์ชัน markAsRead ใน notificationController
router.post('/:id/read', notificationController.markAsRead);


// --- ส่วนที่ 4: การส่งออก (Export) ---

// ส่งออก router ที่เราตั้งค่าทั้งหมดแล้ว เพื่อให้ app.js สามารถนำไปใช้งานต่อได้
module.exports = router;