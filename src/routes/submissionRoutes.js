// D:\ProJectFinal\Lasts\betta-fish-api\src\routes\submissionRoutes.js (ไฟล์ใหม่)
const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const submissionController = require('../controllers/submissionController');

/**
 * Route สำหรับดึงข้อมูล submissions ของผู้ใช้
 * GET /api/submissions
 */
router.get('/', authMiddleware, submissionController.getUserSubmissions);

/**
 * Route สำหรับการส่งปลากัดเพื่อประเมินคุณภาพ (default)
 * POST /api/submissions
 */
router.post(
  '/',
  authMiddleware,
  submissionController.uploadSubmissionFiles,
  submissionController.createEvaluationSubmission
);

router.post(
  '/evaluate',
  authMiddleware,
  submissionController.uploadSubmissionFiles,
  submissionController.createEvaluationSubmission
);

/**
 * Route สำหรับการส่งปลากัดเพื่อ "เข้าร่วมการประกวด"
 * POST /api/submissions/compete
 */
router.post(
  '/compete',
  authMiddleware,
  submissionController.uploadSubmissionFiles,
  submissionController.createCompetitionSubmission
);

module.exports = router;