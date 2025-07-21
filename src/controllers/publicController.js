const PublicService = require('../services/publicService');

class PublicController {

    /**
     * Controller method สำหรับ Route: GET /api/public/content/carousel
     * เรียกใช้ Service เพื่อดึงข้อมูลสำหรับ Carousel ในหน้าแรก
     */
    async getCarouselContent(req, res) {
        try {
            const data = await PublicService.getCarouselContent();
            res.status(200).json({ success: true, data: data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Controller method สำหรับ Route: GET /api/public/content/recommended-news
     * เรียกใช้ Service เพื่อดึงข้อมูลข่าวสารแนะนำในหน้าแรก
     */
    async getRecommendedNews(req, res) {
        try {
            const data = await PublicService.getRecommendedNews();
            res.status(200).json({ success: true, data: data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Controller method สำหรับ Route: GET /api/public/contests
     * (ฟังก์ชันนี้ยังคงอยู่ เพื่อรองรับฟอร์มส่งประกวดโดยเฉพาะ)
     */
    async getActiveContests(req, res) {
        try {
            // Logic การดึงข้อมูลไม่ซับซ้อน สามารถทำใน Controller ได้เลย
            const { data, error } = require('../config/supabase').supabase
                .from('contests')
                .select('id, name')
                .eq('category', 'การประกวด')
                .eq('status', 'กำลังดำเนินการ');

            if (error) {
                throw new Error('ไม่สามารถดึงข้อมูลการประกวดได้: ' + error.message);
            }
            res.status(200).json({ success: true, data: data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Controller method สำหรับ Route: GET /api/public/content/all
     * เรียกใช้ Service เพื่อดึงข้อมูลทั้งหมดตาม category ที่ระบุใน query string
     */
    async getAllContent(req, res) {
        try {
            const { category } = req.query;
            if (!category) {
                return res.status(400).json({ success: false, error: 'กรุณาระบุ category' });
            }
            const data = await PublicService.getAllContent(category);
            res.status(200).json({ success: true, data: data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Controller method สำหรับ Route: GET /api/public/content/:id
     * เรียกใช้ Service เพื่อดึงข้อมูลชิ้นเดียวตาม ID ที่ระบุใน parameter
     */
    async getContentById(req, res) {
        try {
            const { id } = req.params;
            const data = await PublicService.getContentById(id);
            if (!data) {
                return res.status(404).json({ success: false, error: 'ไม่พบข้อมูล' });
            }
            res.status(200).json({ success: true, data: data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new PublicController();