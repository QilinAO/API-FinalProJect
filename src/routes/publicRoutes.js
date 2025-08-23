//D:\ProJectFinal\Lasts\betta-fish-api\src\routes\publicRoutes.js

const router = require('express').Router();
const publicController = require('../controllers/publicController');

// GET /api/public/contests
// เส้นทางสำหรับให้ฟอร์มส่งประกวดดึงรายการประกวดที่กำลังเปิดรับสมัคร
router.get('/contests', publicController.getActiveContests);

// GET /api/public/content/carousel
// เส้นทางสำหรับดึงข้อมูล Carousel ในหน้าแรก (เฉพาะการประกวดที่กำลังดำเนินการ)
router.get('/content/carousel', publicController.getCarouselContent);

// GET /api/public/content/recommended-news
// เส้นทางสำหรับดึงข้อมูล Grid ข่าวสารแนะนำในหน้าแรก
router.get('/content/recommended-news', publicController.getRecommendedNews);

// GET /api/public/content/all
// เส้นทางสำหรับดึงข้อมูลทั้งหมดในหน้า AllNewsPage และ ContestPage (ใช้ query string ?category=news หรือ ?category=contest)
router.get('/content/all', publicController.getAllContent);

// GET /api/public/content/:id
// เส้นทางสำหรับดึงข้อมูล Content ชิ้นเดียวตาม ID (ต้องอยู่ล่างสุดเสมอ)
router.get('/content/:id', publicController.getContentById);

module.exports = router;