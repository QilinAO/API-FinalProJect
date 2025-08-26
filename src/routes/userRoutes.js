const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Dashboard
router.get('/dashboard', auth, userController.getUserDashboard);

// Contests
router.get('/contests', auth, userController.getUserContests);

// ประวัติการประเมินของฉัน
router.get('/me/evaluations', auth, userController.getMyEvaluationHistory);

// History routes (aliases for frontend compatibility)
router.get('/history/evaluations', auth, userController.getMyEvaluationHistory);
router.get('/history/competitions', auth, userController.getCompetitionHistory);

module.exports = router;
