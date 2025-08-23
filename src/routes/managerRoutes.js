// D:\ProJectFinal\Lasts\betta-fish-api\src\routes\managerRoutes.js
const router = require('express').Router();
const multer = require('multer');

const managerController = require('../controllers/managerController');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware, checkRole(['manager', 'admin']));

// Dashboard & Profile
router.get('/dashboard/stats', managerController.getDashboardStats);
router.get('/profile-dashboard', managerController.getManagerProfileDashboard);

// Contest & News Management
router.get('/contests', managerController.getAllMyContests);
router.post('/contests', upload.single('poster'), managerController.createContestOrNews);
router.put('/contests/:id', managerController.updateMyContest);
router.delete('/contests/:id', managerController.deleteMyContest);

// Live Contest Room & Flow Control
router.get('/contests/:id/submissions', managerController.getSubmissionsForContest);
router.put('/submissions/:id/status', managerController.updateSubmissionStatus);
router.put('/contests/:id/status', managerController.updateContestStatus);
router.post('/contests/:id/finalize', managerController.finalizeContest);

// Approve / Reject contest submissions
router.post('/contests/:contestId/submissions/:submissionId/approve', managerController.approveContestSubmission);
router.post('/contests/:contestId/submissions/:submissionId/reject', managerController.rejectContestSubmission);

// Judges
router.get('/experts', managerController.getExpertList);
router.post('/contests/:id/judges', managerController.assignJudgeToContest);
router.delete('/contests/:contestId/judges/:judgeId', managerController.removeJudgeFromContest);

// History & Results
router.get('/history', managerController.getContestHistory);
router.get('/results/all', managerController.getAllResults);

// Notifications Center
router.get('/notifications', notificationController.list);
router.patch('/notifications/:id/read', notificationController.markRead);
router.patch('/notifications/read-all', notificationController.markAllRead);

module.exports = router;
