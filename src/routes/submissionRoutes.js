// betta-fish-api/src/routes/submissionRoutes.js (ไฟล์ใหม่)
const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const submissionController = require('../controllers/submissionController');

// POST /api/submissions/evaluate
// 1. authMiddleware: เช็คว่า Login หรือยัง
// 2. uploadSubmissionFiles: รับไฟล์จาก FormData
// 3. createEvaluationSubmission: เริ่ม Logic การทำงานหลัก
router.post(
    '/evaluate',
    authMiddleware,
    submissionController.uploadSubmissionFiles,
    submissionController.createEvaluationSubmission
);

module.exports = router;