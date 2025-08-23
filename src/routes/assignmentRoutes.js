// D:\ProJectFinal\Lasts\betta-fish-api\src\routes\assignmentRoutes.js
const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/assignmentController');

// ผู้เชี่ยวชาญตอบรับงาน
router.put('/:id/accept', auth, ctrl.acceptAssignment);

// ผู้เชี่ยวชาญให้คะแนน/ปิดงาน
router.put('/:id/score', auth, ctrl.scoreAssignment);

module.exports = router;
