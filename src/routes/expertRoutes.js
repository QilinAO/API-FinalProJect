// D:\ProJectFinal\Lasts\betta-fish-api\src\routes\expertRoutes.js (ฉบับสมบูรณ์)

// --- ส่วนที่ 1: การนำเข้า (Imports) ---

const router = require('express').Router();
const expertController = require('../controllers/expertController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');


// --- ส่วนที่ 2: การใช้ Middleware แบบครอบคลุม ---

// กำหนดให้ทุก Route ในไฟล์นี้ต้องผ่านการตรวจสอบ Token และ Role 'expert' ก่อนเสมอ
router.use(authMiddleware, checkRole('expert'));


// --- ส่วนที่ 3: การกำหนดเส้นทาง (Route Definitions) ---

// ========================================================
// Dashboard
// ========================================================
// URL: GET /api/experts/dashboard
router.get('/dashboard', expertController.getDashboardStats);


// ========================================================
// Quality Evaluation Queue (คิวงานประเมินคุณภาพ)
// ========================================================
// URL: GET /api/experts/queue
router.get('/queue', expertController.getEvaluationQueue);

// URL: POST /api/experts/assignments/:assignmentId/respond
router.post('/assignments/:assignmentId/respond', expertController.respondToEvaluation);

// URL: POST /api/experts/assignments/:assignmentId/score
router.post('/assignments/:assignmentId/score', expertController.submitQualityScores);


// ========================================================
// Competition Judging (การตัดสินการแข่งขัน)
// ========================================================
// URL: GET /api/experts/judging
router.get('/judging', expertController.getJudgingContests);

// URL: POST /api/experts/judging/:contestId/respond
router.post('/judging/:contestId/respond', expertController.respondToJudgeInvitation);

// URL: GET /api/experts/judging/:contestId/submissions
router.get('/judging/:contestId/submissions', expertController.getFishInContest);

// URL: POST /api/experts/judging/submissions/:submissionId/score
router.post('/judging/submissions/:submissionId/score', expertController.submitCompetitionScore);


// ===================================================================
// ▼▼▼ [ส่วนที่เพิ่มใหม่] สำหรับ Dynamic Scoring Form ▼▼▼
// ===================================================================
// URL: GET /api/experts/scoring-schema/:bettaType
// (เช่น /api/experts/scoring-schema/ปลากัดพื้นบ้านภาคใต้)
router.get('/scoring-schema/:bettaType', expertController.getScoringSchema);


// ========================================================
// History & Profile
// ========================================================
// URL: GET /api/experts/history
router.get('/history', expertController.getExpertHistory);
// (หมายเหตุ: Profile ใช้ Route กลางที่ /api/users/profile ซึ่งถูกต้องอยู่แล้ว)


// --- ส่วนที่ 4: การส่งออก (Export) ---

module.exports = router;