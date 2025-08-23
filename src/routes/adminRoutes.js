// ======================================================================
// File: src/routes/adminRoutes.js 
// หน้าที่: กำหนด Routes สำหรับ Admin functions (เพิ่ม auto-assignment endpoint)
// ======================================================================

const express = require('express');
const router = express.Router();

// Controllers
const adminController = require('../controllers/adminController');

// Middlewares  
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const autoAssignmentService = require('../services/autoAssignmentService');

// ใช้ authentication middleware สำหรับทุก route
router.use(authMiddleware);

// ใช้ role middleware สำหรับ admin เท่านั้น
router.use(checkRole('admin'));

// ============= Admin Dashboard Routes =============
router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Admin dashboard - coming soon' });
});
router.get('/stats', (req, res) => {
  res.json({ success: true, message: 'System stats - coming soon' });
});

// ============= User Management Routes =============
router.get('/users', (req, res) => {
  res.json({ success: true, message: 'User management - coming soon' });
});
router.get('/users/:userId', (req, res) => {
  res.json({ success: true, message: 'Get user - coming soon' });
});
router.put('/users/:userId/role', (req, res) => {
  res.json({ success: true, message: 'Update user role - coming soon' });
});
router.delete('/users/:userId', (req, res) => {
  res.json({ success: true, message: 'Delete user - coming soon' });
});
router.post('/users/:userId/ban', (req, res) => {
  res.json({ success: true, message: 'Ban user - coming soon' });
});
router.post('/users/:userId/unban', (req, res) => {
  res.json({ success: true, message: 'Unban user - coming soon' });
});

// ============= Contest Management Routes =============
router.get('/contests', (req, res) => {
  res.json({ success: true, message: 'Contest management - coming soon' });
});
router.put('/contests/:contestId/status', (req, res) => {
  res.json({ success: true, message: 'Contest status update - coming soon' });
});
router.delete('/contests/:contestId', (req, res) => {
  res.json({ success: true, message: 'Delete contest - coming soon' });
});

// ============= System Management Routes =============
router.get('/submissions', (req, res) => {
  res.json({ success: true, message: 'Submissions management - coming soon' });
});
router.put('/submissions/:submissionId/status', (req, res) => {
  res.json({ success: true, message: 'Submission status update - coming soon' });
});
router.get('/assignments', (req, res) => {
  res.json({ success: true, message: 'Assignments management - coming soon' });
});

// ============= Database Management Routes =============
router.post('/database/backup', (req, res) => {
  res.json({ success: true, message: 'Database backup - coming soon' });
});
router.get('/database/health', (req, res) => {
  res.json({ success: true, message: 'Database health check - coming soon' });
});
router.post('/database/cleanup', (req, res) => {
  res.json({ success: true, message: 'Database cleanup - coming soon' });
});

// ============= Auto Assignment Management Routes =============
/**
 * POST /api/admin/auto-assignment/process
 * ประมวลผล unassigned submissions และสร้าง assignments อัตโนมัติ
 */
router.post('/auto-assignment/process', async (req, res) => {
  try {
    console.log(`[Admin] Processing auto-assignments requested by admin: ${req.userId}`);
    
    const createdCount = await autoAssignmentService.processUnassignedSubmissions();
    
    res.json({
      success: true,
      message: `ประมวลผลเสร็จสิ้น สร้าง assignment ใหม่ ${createdCount} รายการ`,
      data: { 
        createdAssignments: createdCount 
      }
    });
  } catch (error) {
    console.error('[Admin] Auto-assignment processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการประมวลผล auto-assignment'
    });
  }
});

/**
 * GET /api/admin/auto-assignment/stats
 * ดูสถิติ assignments และ unassigned submissions
 */
router.get('/auto-assignment/stats', async (req, res) => {
  try {
    // Count unassigned submissions
    const { count: unassignedCount } = await require('../config/supabase').supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .is('contest_id', null);

    // Count pending assignments  
    const { count: pendingCount } = await require('../config/supabase').supabaseAdmin
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Count total experts
    const { count: expertCount } = await require('../config/supabase').supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'expert');

    res.json({
      success: true,
      data: {
        unassignedSubmissions: unassignedCount || 0,
        pendingAssignments: pendingCount || 0,
        totalExperts: expertCount || 0
      }
    });
  } catch (error) {
    console.error('[Admin] Error getting auto-assignment stats:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงสถิติ'
    });
  }
});

// ============= Reporting Routes =============
router.get('/reports/users', (req, res) => {
  res.json({ success: true, message: 'User reports - coming soon' });
});
router.get('/reports/submissions', (req, res) => {
  res.json({ success: true, message: 'Submission reports - coming soon' });
});
router.get('/reports/contests', (req, res) => {
  res.json({ success: true, message: 'Contest reports - coming soon' });
});
router.get('/reports/system', (req, res) => {
  res.json({ success: true, message: 'System reports - coming soon' });
});

// ============= Settings Routes =============
router.get('/settings', (req, res) => {
  res.json({ success: true, message: 'System settings - coming soon' });
});
router.put('/settings', (req, res) => {
  res.json({ success: true, message: 'Update settings - coming soon' });
});

// ============= Logs Routes =============
router.get('/logs/errors', (req, res) => {
  res.json({ success: true, message: 'Error logs - coming soon' });
});
router.get('/logs/client', (req, res) => {
  res.json({ success: true, message: 'Client logs - coming soon' });
});
router.delete('/logs/cleanup', (req, res) => {
  res.json({ success: true, message: 'Log cleanup - coming soon' });
});

module.exports = router;