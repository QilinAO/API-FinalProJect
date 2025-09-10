// ======================================================================
// File: src/controllers/publicController.js
// หน้าที่: จัดการ Logic สำหรับเส้นทาง (Routes) ที่เป็นสาธารณะ
// ======================================================================

const PublicService = require('../services/publicService');

/**
 * Utility function สำหรับครอบ (wrap) async route handlers
 * เพื่อจัดการ Error และส่งต่อไปยัง Global Error Handler โดยอัตโนมัติ
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class PublicController {
  /**
   * ดึงข้อมูลสำหรับ Carousel ในหน้าแรก
   * Route: GET /api/public/content/carousel
   */
  getCarouselContent = asyncWrapper(async (req, res) => {
    const data = await PublicService.getCarouselContent();
    res.status(200).json({ success: true, data });
  });

  /**
   * ดึงข้อมูลข่าวสารและกิจกรรมแนะนำในหน้าแรก
   * Route: GET /api/public/content/recommended-news
   */
  getRecommendedNews = asyncWrapper(async (req, res) => {
    const data = await PublicService.getRecommendedNews();
    res.status(200).json({ success: true, data });
  });

  /**
   * ดึงรายการประกวดที่กำลังเปิดรับสมัคร (สำหรับฟอร์มส่งประกวด)
   * Route: GET /api/public/contests
   */
  getActiveContests = asyncWrapper(async (req, res) => {
    const data = await PublicService.getActiveContests();
    res.status(200).json({ success: true, data });
  });

  /**
   * ดึงข้อมูลทั้งหมดตาม category ที่ระบุ
   * Route: GET /api/public/content/all?category=...
   */
  getAllContent = asyncWrapper(async (req, res) => {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุ category ใน query string' });
    }
    const data = await PublicService.getAllContent(category);
    res.status(200).json({ success: true, data });
  });

  /**
   * ดึงข้อมูลชิ้นเดียวตาม ID
   * Route: GET /api/public/content/:id
   */
  getContentById = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const data = await PublicService.getContentById(id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลที่ตรงกับ ID ที่ระบุ' });
    }
    res.status(200).json({ success: true, data });
  });

  /**
   * ผลการแข่งขันแบบสาธารณะ
   * Route: GET /api/public/contests/:id/results
   */
  getContestResults = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const data = await PublicService.getContestResults(id);
    res.status(200).json({ success: true, data });
  });
}

module.exports = new PublicController();
