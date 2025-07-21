const router = require('express').Router();
const managerController = require('../controllers/managerController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware: ทุก Route ในนี้ต้อง Login และมี Role เป็น 'manager'
router.use(authMiddleware, checkRole('manager'));


// === Dashboard & Profile Routes ===
router.get('/dashboard/stats', managerController.getDashboardStats);

// [เพิ่มใหม่] Route สำหรับดึงข้อมูลทั้งหมดในหน้าโปรไฟล์
router.get('/profile-dashboard', managerController.getManagerProfileDashboard);


// === Contest & News Management (CRUD) ===
router.get('/contests', managerController.getAllMyContests);
router.post('/contests', upload.single('poster'), managerController.createContestOrNews);
router.put('/contests/:id', managerController.updateMyContest);
router.delete('/contests/:id', managerController.deleteMyContest);


// === Live Contest Room & Flow Control ===
router.get('/contests/:id/submissions', managerController.getSubmissionsForContest);
router.put('/submissions/:id/status', managerController.updateSubmissionStatus);
router.put('/contests/:id/status', managerController.updateContestStatus);
router.post('/contests/:id/finalize', managerController.finalizeContest);


// === Judge Management ===
router.get('/experts', managerController.getExpertList);
router.post('/contests/:id/judges', managerController.assignJudgeToContest);
router.delete('/contests/:contestId/judges/:judgeId', managerController.removeJudgeFromContest);


// === History & Results ===
router.get('/history', managerController.getContestHistory);
router.get('/results/all', managerController.getAllResults);


module.exports = router;