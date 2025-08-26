// ======================================================================
// File: src/controllers/modelController.js
// หน้าที่: Controller สำหรับจัดการ API endpoints ของ Model API
// ======================================================================

const modelApiService = require('../services/modelApiService');
const { success, error } = require('../utils/responseFormatter');
const multer = require('multer');
const path = require('path');

// กำหนดการอัปโหลดไฟล์ชั่วคราวสำหรับการวิเคราะห์
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // สูงสุด 5 ไฟล์
  },
  fileFilter: (req, file, cb) => {
    // อนุญาตเฉพาะไฟล์รูปภาพ
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

class ModelController {
  
  /**
   * วิเคราะห์รูปภาพปลากัดเดี่ยว
   * POST /api/model/analyze-single
   */
  async analyzeSingleImage(req, res) {
    try {
      const { betta_type, betta_age_months, analysis_type } = req.body;
      
      if (!req.file) {
        return res.status(400).json(error('กรุณาส่งรูปภาพมาด้วย'));
      }

      const metadata = {
        betta_type,
        betta_age_months: betta_age_months ? parseInt(betta_age_months) : null,
        analysis_type: analysis_type || 'quality', // 'quality' หรือ 'competition'
        user_id: req.user?.id
      };

      const result = await modelApiService.predictBettaType(
        req.file.buffer,
        0.90
      );

      if (!result.success) {
        return res.status(502).json(error('โมเดลไม่ตอบสนอง: ' + (result.error || 'unknown')));
      }

      res.json(success(result.data, 'วิเคราะห์รูปภาพสำเร็จ'));

    } catch (err) {
      console.error('Error in analyzeSingleImage:', err);
      res.status(500).json(error('เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ: ' + (err.message || String(err))));
    }
  }

  /**
   * วิเคราะห์หลายรูปภาพพร้อมกัน
   * POST /api/model/analyze-batch
   */
  async analyzeBatchImages(req, res) {
    try {
      const { betta_type, betta_age_months, analysis_type } = req.body;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json(error('กรุณาส่งรูปภาพมาด้วย'));
      }

      const metadata = {
        betta_type,
        betta_age_months: betta_age_months ? parseInt(betta_age_months) : null,
        analysis_type: analysis_type || 'quality',
        user_id: req.user?.id
      };

      // แปลงไฟล์เป็นรูปแบบที่ service ต้องการ
      const images = req.files.map(file => ({
        data: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype
      }));

      const buffers = images.map(f => f.data);
      const result = await modelApiService.predictBettaTypeBatch(buffers, 0.90);

      if (!result.success) {
        return res.status(502).json(error('โมเดลไม่ตอบสนอง: ' + (result.error || 'unknown')));
      }

      // ส่งข้อมูลกลับในรูปแบบที่ถูกต้อง
      res.json(success(result.data, 'วิเคราะห์รูปภาพทั้งหมดสำเร็จ'));

    } catch (err) {
      console.error('Error in analyzeBatchImages:', err);
      res.status(500).json(error('เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ: ' + (err.message || String(err))));
    }
  }

  /**
   * ตรวจสอบสถานะ Model API
   * GET /api/model/health
   */
  async checkModelHealth(req, res) {
    try {
      const health = await modelApiService.checkHealth();
      
      // ส่งข้อมูลกลับในรูปแบบที่ถูกต้อง
      res.json(success({
        available: health.available,
        status: health.status,
        checked_at: new Date().toISOString()
      }, health.message));

    } catch (err) {
      console.error('Error in checkModelHealth:', err);
      res.status(500).json(error('ไม่สามารถตรวจสอบสถานะ Model API ได้'));
    }
  }

  /**
   * ดึงข้อมูลการวิเคราะห์ที่เก็บไว้ (สำหรับอนาคต)
   * GET /api/model/analysis/:submissionId
   */
  async getAnalysisHistory(req, res) {
    try {
      const { submissionId } = req.params;
      
      // TODO: ดึงข้อมูลจากฐานข้อมูล
      // const analysis = await getStoredAnalysis(submissionId);
      
      // ส่งข้อมูลกลับในรูปแบบที่ถูกต้อง
      res.json(success({
        message: 'Feature not implemented yet'
      }, 'ยังไม่รองรับฟีเจอร์นี้'));

    } catch (err) {
      console.error('Error in getAnalysisHistory:', err);
      res.status(500).json(error('เกิดข้อผิดพลาดในการดึงข้อมูล'));
    }
  }
}

// Export อินสแตนซ์และ middleware
const modelController = new ModelController();

module.exports = {
  modelController,
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 5),
  // สำหรับ form ที่มีชื่อฟิลด์ต่างกัน
  uploadImages: upload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'video', maxCount: 1 }
  ])
};
