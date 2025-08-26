// ======================================================================
// File: src/routes/modelRoutes.js
// หน้าที่: Routes สำหรับ Model API endpoints
// ======================================================================

const express = require('express');
const { 
  modelController, 
  uploadSingle, 
  uploadMultiple 
} = require('../controllers/modelController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateImageAnalysis } = require('../middleware/validation');

const router = express.Router();

// ตรวจสอบสถานะ Model API (ไม่ต้อง auth)
router.get('/health', modelController.checkModelHealth.bind(modelController));

// Routes ที่ต้อง authentication
router.use(requireAuth);

// วิเคราะห์รูปภาพเดี่ยว
router.post('/analyze-single', 
  uploadSingle,
  validateImageAnalysis,
  modelController.analyzeSingleImage.bind(modelController)
);

// วิเคราะห์หลายรูปภาพพร้อมกัน
router.post('/analyze-batch',
  uploadMultiple,
  validateImageAnalysis,
  modelController.analyzeBatchImages.bind(modelController)
);

// ดึงประวัติการวิเคราะห์
router.get('/analysis/:submissionId',
  modelController.getAnalysisHistory.bind(modelController)
);

module.exports = router;
