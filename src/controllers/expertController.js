// /home/anming/Desktop/FinalProJects/API-FinalProJect/src/controllers/expertController.js
// ======================================================================
// File: src/controllers/expertController.js
// หน้าที่: จัดการ Logic การทำงานทั้งหมดที่เกี่ยวข้องกับผู้เชี่ยวชาญ (Expert)
// ======================================================================

const ExpertService = require('../services/expertService');
const checklistNotifier = require('../services/checklistNotifierService');

/**
 * Utility function สำหรับครอบ (wrap) async route handlers
 * เพื่อจัดการ Error และส่งต่อไปยัง Global Error Handler โดยอัตโนมัติ
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class ExpertController {
  /**
   * ดึงข้อมูลสรุปสำหรับ Dashboard
   * Route: GET /api/experts/dashboard
   */
  getDashboard = asyncWrapper(async (req, res) => {
    const stats = await ExpertService.getDashboardStats(req.userId);
    res.json({ success: true, data: stats });
  });

  /**
   * ดึงข้อมูลโปรไฟล์ของผู้เชี่ยวชาญ
   * Route: GET /api/experts/profile
   */
  getProfile = asyncWrapper(async (req, res) => {
    const { supabaseAdmin } = require('../config/supabase');
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.userId)
      .single();
    
    if (error) {
      return res.status(400).json({ success: false, error: 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้' });
    }

    res.json({ success: true, data: profile });
  });

  /**
   * อัปเดตโปรไฟล์ของผู้เชี่ยวชาญ
   * Route: PUT /api/experts/profile
   */
  updateProfile = asyncWrapper(async (req, res) => {
    const UserService = require('../services/userService');
    const updatedProfile = await UserService.updateProfile(req.userId, req.body);
    res.json({ success: true, data: updatedProfile });
  });

  /**
   * ดึงรายการมอบหมายงานทั้งหมด
   * Route: GET /api/experts/assignments
   */
  getMyAssignments = asyncWrapper(async (req, res) => {
    const assignments = await ExpertService.getMyAssignments(req.userId);
    res.json({ success: true, data: assignments });
  });

  /**
   * ดึงงานที่รอการประเมิน
   * Route: GET /api/experts/assignments/pending
   */
  getPendingAssignments = asyncWrapper(async (req, res) => {
    const assignments = await ExpertService.getPendingAssignments(req.userId);
    res.json({ success: true, data: assignments });
  });

  /**
   * ดึงรายละเอียดงานประเมิน
   * Route: GET /api/experts/assignments/:assignmentId
   */
  getAssignmentDetails = asyncWrapper(async (req, res) => {
    const { assignmentId } = req.params;
    const assignment = await ExpertService.getAssignmentDetails(assignmentId, req.userId);
    res.json({ success: true, data: assignment });
  });

  /**
   * ส่งผลการประเมิน
   * Route: POST /api/experts/assignments/:assignmentId/evaluate
   */
  submitEvaluation = asyncWrapper(async (req, res) => {
    const { assignmentId } = req.params;
    const result = await ExpertService.submitEvaluation(assignmentId, req.userId, req.body);
    res.json({ success: true, data: result });
  });

  /**
   * อัปเดตคะแนน
   * Route: PUT /api/experts/assignments/:assignmentId/scores
   */
  updateScores = asyncWrapper(async (req, res) => {
    const { assignmentId } = req.params;
    const result = await ExpertService.updateScores(assignmentId, req.userId, req.body);
    res.json({ success: true, data: result });
  });

  /**
   * ปฏิเสธงาน
   * Route: POST /api/experts/assignments/:assignmentId/reject
   */
  rejectAssignment = asyncWrapper(async (req, res) => {
    const { assignmentId } = req.params;
    const { reason } = req.body;
    const result = await ExpertService.rejectAssignment(assignmentId, req.userId, reason);
    res.json({ success: true, data: result });
  });

  /**
   * ตอบรับหรือปฏิเสธงานประเมินคุณภาพ
   * Route: POST /api/experts/assignments/:assignmentId/respond
   */
  respondToEvaluation = asyncWrapper(async (req, res) => {
    const { assignmentId } = req.params;
    const { status, reason } = req.body;
    const result = await ExpertService.respondToEvaluation(assignmentId, req.userId, status, reason);
    res.json({ success: true, data: result });
  });

  /**
   * ส่งคะแนนการประเมินคุณภาพ
   * Route: POST /api/experts/assignments/:assignmentId/score
   */
  submitQualityScores = asyncWrapper(async (req, res) => {
    const { assignmentId } = req.params;
    const result = await ExpertService.submitQualityScores(assignmentId, req.userId, req.body);
    res.json({ success: true, data: result });
  });

  /**
   * ดึงคิวงานประเมินคุณภาพ
   * Route: GET /api/experts/queue
   */
  getEvaluationQueue = asyncWrapper(async (req, res) => {
    const queue = await ExpertService.getEvaluationQueue(req.userId);
    res.json({ success: true, data: queue });
  });

  /**
   * ดึงงานประเมินถัดไป
   * Route: GET /api/experts/queue/next
   */
  getNextEvaluation = asyncWrapper(async (req, res) => {
    const next = await ExpertService.getNextEvaluation(req.userId);
    res.json({ success: true, data: next });
  });

  /**
   * รับงานประเมิน
   * Route: POST /api/experts/queue/:submissionId/claim
   */
  claimEvaluation = asyncWrapper(async (req, res) => {
    const { submissionId } = req.params;
    const result = await ExpertService.claimEvaluation(submissionId, req.userId);
    res.json({ success: true, data: result });
  });

  /**
   * ดึงการประกวดที่เป็นกรรมการ
   * Route: GET /api/experts/contests/judging
   */
  getJudgingContests = asyncWrapper(async (req, res) => {
    const contests = await ExpertService.getJudgingContests(req.userId);
    res.json({ success: true, data: contests });
  });
  
  // =================================================================
  // ================ ฟังก์ชันใหม่ที่เพิ่มเข้ามาเพื่อแก้ Error ==============
  // =================================================================
  /**
   * GET /api/experts/judging/:contestId/submissions
   * ดึงข้อมูลปลาทั้งหมดที่ต้องตัดสินในการแข่งขันนั้นๆ
   */
  getSubmissionsForJudging = asyncWrapper(async (req, res) => {
    const { contestId } = req.params;
    const expertId = req.userId;

    // ส่วนนี้จะเรียก Service เพื่อดึงข้อมูลปลาจริงๆ ต่อไป (ซึ่งอาจต้องสร้างในอนาคต)
    // const submissions = await ExpertService.getSubmissionsForJudging(contestId, expertId);
    console.log(`Fetching submissions for contest ${contestId} by expert ${expertId}`);
    
    // ส่งข้อมูลจำลอง (mock data) กลับไปก่อน เพื่อให้เซิร์ฟเวอร์สตาร์ทได้
    const mockSubmissions = [
      { id: 'sub_mock_1', betta_name: 'ปลาตัวอย่าง 1' },
      { id: 'sub_mock_2', betta_name: 'ปลาตัวอย่าง 2' },
    ];
    
    res.status(200).json({
      success: true,
      message: `Successfully fetched submissions for contest ${contestId}`,
      data: mockSubmissions
    });
  });

  /**
   * ตอบรับการเป็นกรรมการ
   * Route: POST /api/experts/contests/:contestId/accept
   */
  acceptJudging = asyncWrapper(async (req, res) => {
    const { contestId } = req.params;
    const result = await ExpertService.acceptJudging(contestId, req.userId);

    checklistNotifier.onJudgeAccept(contestId, req.userId).catch(err =>
      console.warn('[ChecklistNotifier] JudgeAccept notification failed:', err.message)
    );

    res.json({ success: true, data: result });
  });

  /**
   * ปฏิเสธการเป็นกรรมการ
   * Route: POST /api/experts/contests/:contestId/decline
   */
  declineJudging = asyncWrapper(async (req, res) => {
    const { contestId } = req.params;
    const { reason } = req.body;
    const result = await ExpertService.declineJudging(contestId, req.userId, reason);
    res.json({ success: true, data: result });
  });

  /**
   * ดึงประวัติการประเมิน
   * Route: GET /api/experts/history/evaluations
   */
  getEvaluationHistory = asyncWrapper(async (req, res) => {
    const history = await ExpertService.getEvaluationHistory(req.userId);
    res.json({ success: true, data: history });
  });

  /**
   * ดึงประวัติการเป็นกรรมการ
   * Route: GET /api/experts/history/contests
   */
  getJudgingHistory = asyncWrapper(async (req, res) => {
    const history = await ExpertService.getJudgingHistory(req.userId);
    res.json({ success: true, data: history });
  });

  /**
   * ดึงเกณฑ์การให้คะแนนตามประเภทปลา
   * Route: GET /api/experts/scoring-schema/:bettaType
   */
  getScoringSchema = asyncWrapper(async (req, res) => {
    const { bettaType } = req.params;
    const schema = await ExpertService.getScoringSchema(bettaType);
    res.json({ success: true, data: schema });
  });

  /**
   * ดึงสถิติประสิทธิภาพ
   * Route: GET /api/experts/stats/performance
   */
  getPerformanceStats = asyncWrapper(async (req, res) => {
    const stats = await ExpertService.getPerformanceStats(req.userId);
    res.json({ success: true, data: stats });
  });

  /**
   * ดึงสถิติภาระงาน
   * Route: GET /api/experts/stats/workload
   */
  getWorkloadStats = asyncWrapper(async (req, res) => {
    const stats = await ExpertService.getWorkloadStats(req.userId);
    res.json({ success: true, data: stats });
  });

  /**
   * ดึงข้อมูล Analytics Dashboard
   * Route: GET /api/experts/analytics
   */
  getAnalytics = asyncWrapper(async (req, res) => {
    const { timeRange = 30 } = req.query;
    const analytics = await ExpertService.getAnalyticsData(req.userId, parseInt(timeRange));
    res.json({ success: true, data: analytics });
  });
}

module.exports = new ExpertController();