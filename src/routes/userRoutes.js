const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// ประวัติการประเมินของฉัน
router.get('/me/evaluations', auth, userController.getMyEvaluationHistory);

module.exports = router;
