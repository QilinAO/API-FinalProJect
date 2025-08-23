// ======================================================================
// File: src/routes/expertRoutes.js
// หน้าที่: กำหนด Routes สำหรับ Expert functions (เพิ่ม specialities management)
// ======================================================================

const express = require('express');
const router = express.Router();

// Controllers
const expertController = require('../controllers/expertController');

// Middlewares
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// ใช้ authentication middleware สำหรับทุก route
router.use(authMiddleware);

// ใช้ role middleware สำหรับ expert เท่านั้น
router.use(checkRole('expert'));

// ============= Expert Dashboard Routes =============
router.get('/dashboard', expertController.getDashboard);
router.get('/profile', expertController.getProfile);
router.put('/profile', expertController.updateProfile);

// ============= Assignment Routes =============
router.get('/assignments', expertController.getMyAssignments);
router.get('/assignments/pending', expertController.getPendingAssignments);
router.get('/assignments/:assignmentId', expertController.getAssignmentDetails);

// ============= Evaluation Routes =============
router.post('/assignments/:assignmentId/evaluate', expertController.submitEvaluation);
router.put('/assignments/:assignmentId/scores', expertController.updateScores);
router.post('/assignments/:assignmentId/reject', expertController.rejectAssignment);

// ============= Contest Judging Routes =============
router.get('/contests/judging', expertController.getJudgingContests);
router.post('/contests/:contestId/accept', expertController.acceptJudging);
router.post('/contests/:contestId/decline', expertController.declineJudging);

// ============= Queue Management Routes =============
router.get('/queue', expertController.getEvaluationQueue);
router.get('/queue/next', expertController.getNextEvaluation);
router.post('/queue/:submissionId/claim', expertController.claimEvaluation);

// ============= Specialities Management Routes =============
/**
 * GET /api/experts/specialities
 * ดึงรายการความเชี่ยวชาญของผู้เชี่ยวชาญ
 */
router.get('/specialities', async (req, res) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('specialities')
      .eq('id', req.userId)
      .single();
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'ไม่สามารถดึงข้อมูลความเชี่ยวชาญได้'
      });
    }

    res.json({
      success: true,
      data: {
        specialities: profile?.specialities || []
      }
    });
  } catch (error) {
    console.error('[Expert] Error getting specialities:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
});

/**
 * PUT /api/experts/specialities
 * อัปเดตความเชี่ยวชาญของผู้เชี่ยวชาญ
 */
router.put('/specialities', async (req, res) => {
  try {
    const { specialities } = req.body;
    
    // Validate input
    if (!Array.isArray(specialities)) {
      return res.status(400).json({
        success: false,
        error: 'ความเชี่ยวชาญต้องเป็น array'
      });
    }

    // Validate each specialty
    const validSpecialities = specialities.filter(s => 
      typeof s === 'string' && s.trim().length > 0
    ).map(s => s.trim());

    if (validSpecialities.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'สามารถระบุความเชี่ยวชาญได้สูงสุด 10 รายการ'
      });
    }

    const { supabaseAdmin } = require('../config/supabase');
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        specialities: validSpecialities,
        updated_at: new Date().toISOString() 
      })
      .eq('id', req.userId)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'ไม่สามารถอัปเดตความเชี่ยวชาญได้'
      });
    }

    res.json({
      success: true,
      message: 'อัปเดตความเชี่ยวชาญสำเร็จ',
      data: {
        specialities: data.specialities
      }
    });
  } catch (error) {
    console.error('[Expert] Error updating specialities:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปเดต'
    });
  }
});

/**
 * GET /api/experts/specialities/suggestions
 * ดึงรายการความเชี่ยวชาญที่แนะนำ
 */
router.get('/specialities/suggestions', (req, res) => {
  const suggestions = [
    // ประเภทหลัก
    'Halfmoon', 'Plakat', 'Crowntail', 'Veiltail', 'Doubletail',
    
    // สี
    'Red', 'Blue', 'Yellow', 'Green', 'White', 'Black', 'Multicolor',
    
    // ลวดลาย
    'Marble', 'Butterfly', 'Dragon', 'Galaxy', 'Solid',
    
    // ขนาด
    'Giant', 'Standard', 'Female',
    
    // การใช้งาน
    'Show Quality', 'Breeding', 'Fighting', 'Pet Quality',
    
    // ความเชี่ยวชาญพิเศษ
    'Genetics', 'Disease Treatment', 'Nutrition', 'Breeding Program',
    
    // ประเภทภาษาไทย
    'ปลากัดไทย', 'ปลากัดสวยงาม', 'ปลากัดแฟนซี', 'ปลากัดยักษ์'
  ];

  res.json({
    success: true,
    data: {
      suggestions: suggestions.sort()
    }
  });
});

// ============= History Routes =============
router.get('/history/evaluations', expertController.getEvaluationHistory);
router.get('/history/contests', expertController.getJudgingHistory);

// ============= Statistics Routes =============
router.get('/stats/performance', expertController.getPerformanceStats);
router.get('/stats/workload', expertController.getWorkloadStats);

module.exports = router;