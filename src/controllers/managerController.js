// ======================================================================
// File: src/controllers/managerController.js
// หน้าที่: จัดการ Logic การทำงานทั้งหมดที่เกี่ยวข้องกับผู้จัดการ (Manager)
// ======================================================================

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ManagerService = require('../services/managerService');
const { supabase, supabaseAdmin } = require('../config/supabase');
const checklistNotifier = require('../services/checklistNotifierService');

/**
 * Utility function สำหรับครอบ (wrap) async route handlers
 * เพื่อจัดการ Error และส่งต่อไปยัง Global Error Handler โดยอัตโนมัติ
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Helper function สำหรับอัปโหลดไฟล์โปสเตอร์ไปยัง Supabase Storage
 */
const uploadPoster = async (file) => {
  if (!file) {
    throw Object.assign(new Error('กรุณาอัปโหลดโปสเตอร์'), { status: 400 });
  }
  const filePath = `ContestPosters/${uuidv4()}${path.extname(file.originalname)}`;
  const { error } = await supabaseAdmin.storage
    .from('posters')
    .upload(filePath, file.buffer, { contentType: file.mimetype });

  if (error) {
    throw new Error(`อัปโหลดไฟล์ล้มเหลว: ${error.message}`);
  }
  return supabase.storage.from('posters').getPublicUrl(filePath).data.publicUrl;
};

class ManagerController {
  // ----- Dashboard & Profile -----
  getDashboardStats = asyncWrapper(async (req, res) => {
    const stats = await ManagerService.getDashboardStats(req.userId);
    res.status(200).json({ success: true, data: stats });
  });

  getManagerProfileDashboard = asyncWrapper(async (req, res) => {
    const data = await ManagerService.getManagerProfileDashboard(req.userId);
    res.status(200).json({ success: true, data });
  });

  // ----- Contest & News Management -----
  createContestOrNews = asyncWrapper(async (req, res) => {
    const posterUrl = await uploadPoster(req.file);
    
    const payload = { ...req.body, poster_url: posterUrl };
    if (payload.is_vote_open) payload.is_vote_open = String(payload.is_vote_open) === 'true';
    if (payload.allowed_subcategories) payload.allowed_subcategories = JSON.parse(payload.allowed_subcategories);
    
    const judgeIds = req.body.judge_ids ? JSON.parse(req.body.judge_ids) : [];
    const newContest = await ManagerService.createContestOrNews(req.userId, payload);

    // Fire-and-forget notifications
    checklistNotifier.onContestCreated(newContest.id, req.userId).catch(e => console.warn(e.message));
    if (newContest.category === 'การประกวด' && judgeIds.length > 0) {
      judgeIds.forEach(judgeId => {
        ManagerService.assignJudgeToContest(newContest.id, judgeId, req.userId)
          .then(() => checklistNotifier.onJudgeAssigned(newContest.id, judgeId))
          .catch(e => console.warn(`Failed to assign/notify judge ${judgeId}:`, e.message));
      });
    }

    res.status(201).json({ success: true, data: newContest });
  });

  getAllMyContests = asyncWrapper(async (req, res) => {
    const contests = await ManagerService.getMyContests(req.userId);
    res.status(200).json({ success: true, data: contests });
  });

  updateMyContest = asyncWrapper(async (req, res) => {
    const contest = await ManagerService.updateMyContest(req.params.id, req.userId, req.body);
    res.status(200).json({ success: true, data: contest });
  });

  deleteMyContest = asyncWrapper(async (req, res) => {
    await ManagerService.deleteMyContest(req.params.id, req.userId);
    res.status(204).send();
  });

  // ----- Judges Management -----
  getExpertList = asyncWrapper(async (req, res) => {
    const { contest_id } = req.query;
    const experts = await ManagerService.getExpertList(contest_id);
    res.status(200).json({ success: true, data: experts });
  });

  assignJudgeToContest = asyncWrapper(async (req, res) => {
    const { judgeId } = req.body;
    await ManagerService.assignJudgeToContest(req.params.id, judgeId, req.userId);
    checklistNotifier.onJudgeAssigned(req.params.id, judgeId).catch(e => console.warn(e.message));
    res.status(201).json({ success: true, message: 'มอบหมายกรรมการสำเร็จ' });
  });

  removeJudgeFromContest = asyncWrapper(async (req, res) => {
    const { contestId, judgeId } = req.params;
    await ManagerService.removeJudgeFromContest(contestId, judgeId, req.userId);
    res.status(200).json({ success: true, message: 'ปลดกรรมการสำเร็จ' });
  });

  // ----- Live Contest Room & Flow Control -----
  getSubmissionsForContest = asyncWrapper(async (req, res) => {
    const submissions = await ManagerService.getContestSubmissions(req.params.id, req.userId);
    res.status(200).json({ success: true, data: submissions });
  });

  updateSubmissionStatus = asyncWrapper(async (req, res) => {
    const { status, reason } = req.body;
    const submission = await ManagerService.updateSubmissionStatus(req.params.id, status, req.userId);
    
    const notifier = status === 'approved' ? checklistNotifier.onManagerApprove :
                     status === 'rejected' ? checklistNotifier.onManagerReject : null;
    if (notifier) {
      notifier(req.params.id, req.userId, reason || 'ไม่ระบุ').catch(e => console.warn(e.message));
    }
    
    res.status(200).json({ success: true, data: submission });
  });

  approveContestSubmission = asyncWrapper(async (req, res) => {
    await ManagerService.updateSubmissionStatus(req.params.submissionId, 'approved', req.userId);
    checklistNotifier.onManagerApprove(req.params.submissionId, req.userId).catch(e => console.warn(e.message));
    res.status(200).json({ success: true, message: 'อนุมัติรายการสำเร็จ' });
  });

  rejectContestSubmission = asyncWrapper(async (req, res) => {
    const { reason } = req.body;
    await ManagerService.updateSubmissionStatus(req.params.submissionId, 'rejected', req.userId);
    checklistNotifier.onManagerReject(req.params.submissionId, req.userId, reason || 'ไม่ระบุ').catch(e => console.warn(e.message));
    res.status(200).json({ success: true, message: 'ปฏิเสธรายการสำเร็จ' });
  });

  updateContestStatus = asyncWrapper(async (req, res) => {
    const updatedContest = await ManagerService.updateContestStatus(req.params.id, req.userId, req.body.status);
    res.status(200).json({ success: true, data: updatedContest });
  });

  finalizeContest = asyncWrapper(async (req, res) => {
    const result = await ManagerService.finalizeContest(req.params.id, req.userId);
    checklistNotifier.onContestFinalized(req.params.id).catch(e => console.warn(e.message));
    res.status(200).json({ success: true, message: 'การประกวดสิ้นสุดและประกาศผลสำเร็จ', data: result });
  });

  // ----- Scoring Progress & Detail -----
  getScoringProgress = asyncWrapper(async (req, res) => {
    const data = await ManagerService.getScoringProgress(req.params.id, req.userId);
    res.status(200).json({ success: true, data });
  });

  getScoresForSubmission = asyncWrapper(async (req, res) => {
    const data = await ManagerService.getScoresForSubmission(req.params.id, req.userId);
    res.status(200).json({ success: true, data });
  });

  // ----- History & Results -----
  getContestHistory = asyncWrapper(async (req, res) => {
    const history = await ManagerService.getContestHistory(req.userId);
    res.status(200).json({ success: true, data: history });
  });

  getAllResults = asyncWrapper(async (req, res) => {
    const results = await ManagerService.getAllResults(req.userId);
    res.status(200).json({ success: true, data: results });
  });
}

module.exports = new ManagerController();
