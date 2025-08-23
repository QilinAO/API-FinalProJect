// src/services/checklistNotifierService.js
const {
  supabaseAdmin
} = require('../config/supabase');
const telegram = require('../utils/checklistTelegram');

// ===== Helper Functions =====

const getUserInfo = async (userId) => {
  if (!userId) return '<i>(ไม่ระบุตัวตน)</i>';
  const {
    data
  } = await supabaseAdmin.from('profiles').select('first_name, last_name, email').eq('id', userId).single();
  return data ? `<b>${data.first_name || ''} ${data.last_name || ''}</b> (<code>${data.email}</code>)` : `<code>${userId}</code>`;
};

const getSubmissionAndContestInfo = async (submissionId) => {
  if (!submissionId) return {
    fishName: 'N/A',
    contestName: null
  };
  const {
    data
  } = await supabaseAdmin
    .from('submissions')
    .select('fish_name, contest:contests(name)')
    .eq('id', submissionId)
    .single();
  return {
    fishName: data?.fish_name || 'N/A',
    contestName: data?.contest?.name || null,
  };
};

// ===== Service Class =====

class ChecklistNotifierService {

  async onUserSignUp(user) {
    const message = `✅ <b>สมัครสมาชิกใหม่</b>\n<b>User:</b> ${user.email}\n<b>ID:</b> <code>${user.id}</code>`;
    await telegram.sendMessage(message);
  }

  async onUserSignIn(userId) {
    const userInfo = await getUserInfo(userId);
    const message = `➡️ <b>เข้าสู่ระบบสำเร็จ</b>\n<b>User:</b> ${userInfo}`;
    await telegram.sendMessage(message);
  }

  async onContestCreated(contestId, managerId) {
    const managerInfo = await getUserInfo(managerId);
    const {
      data
    } = await supabaseAdmin.from('contests').select('name, category').eq('id', contestId).single();
    const message = `🆕 <b>สร้างกิจกรรมใหม่</b>\n<b>ประเภท:</b> ${data.category}\n<b>ชื่อ:</b> "${data.name}"\n<b>โดย:</b> ${managerInfo}`;
    await telegram.sendMessage(message);
  }

  async onUserSubmitForEvaluation(submissionId, userId) {
    const userInfo = await getUserInfo(userId);
    const {
      fishName
    } = await getSubmissionAndContestInfo(submissionId);
    const message = `🧪 <b>ส่งปลากัดเพื่อประเมินคุณภาพ</b>\n<b>ปลากัด:</b> "${fishName}"\n<b>โดย:</b> ${userInfo}`;
    await telegram.sendMessage(message);
  }

  async onUserSubmitForCompetition(submissionId, userId) {
    const userInfo = await getUserInfo(userId);
    const {
      fishName,
      contestName
    } = await getSubmissionAndContestInfo(submissionId);
    const message = `🎯 <b>ส่งปลากัดเข้าร่วมประกวด</b>\n<b>ปลากัด:</b> "${fishName}"\n<b>การประกวด:</b> "${contestName}"\n<b>โดย:</b> ${userInfo}`;
    await telegram.sendMessage(message);
  }

  async onManagerApprove(submissionId, managerId) {
    const managerInfo = await getUserInfo(managerId);
    const {
      fishName,
      contestName
    } = await getSubmissionAndContestInfo(submissionId);
    const message = `👍 <b>ผู้จัดการอนุมัติ</b>\n<b>ปลากัด:</b> "${fishName}"\n<b>การประกวด:</b> "${contestName}"\n<b>อนุมัติโดย:</b> ${managerInfo}`;
    await telegram.sendMessage(message);
  }

  async onManagerReject(submissionId, managerId, reason) {
    const managerInfo = await getUserInfo(managerId);
    const {
      fishName,
      contestName
    } = await getSubmissionAndContestInfo(submissionId);
    const reasonText = reason ? `\n<b>เหตุผล:</b> ${reason}` : '';
    const message = `👎 <b>ผู้จัดการปฏิเสธ</b>\n<b>ปลากัด:</b> "${fishName}"\n<b>การประกวด:</b> "${contestName}"\n<b>ปฏิเสธโดย:</b> ${managerInfo}${reasonText}`;
    await telegram.sendMessage(message);
  }

  async onJudgeAssigned(contestId, judgeId) {
    const judgeInfo = await getUserInfo(judgeId);
    const {
      data
    } = await supabaseAdmin.from('contests').select('name').eq('id', contestId).single();
    const message = `👨‍⚖️ <b>มอบหมายกรรมการ</b>\n<b>การประกวด:</b> "${data.name}"\n<b>กรรมการ:</b> ${judgeInfo}`;
    await telegram.sendMessage(message);
  }

  async onJudgeAccept(contestId, judgeId) {
    const judgeInfo = await getUserInfo(judgeId);
    const {
      data
    } = await supabaseAdmin.from('contests').select('name').eq('id', contestId).single();
    const message = `✅ <b>กรรมการตอบรับคำเชิญ</b>\n<b>การประกวด:</b> "${data.name}"\n<b>กรรมการ:</b> ${judgeInfo}`;
    await telegram.sendMessage(message);
  }

  async onJudgeScore(submissionId, judgeId) {
    const judgeInfo = await getUserInfo(judgeId);
    const {
      fishName,
      contestName
    } = await getSubmissionAndContestInfo(submissionId);
    const message = `📝 <b>กรรมการให้คะแนน</b>\n<b>ปลากัด:</b> "${fishName}"\n<b>การประกวด:</b> "${contestName}"\n<b>ให้คะแนนโดย:</b> ${judgeInfo}`;
    await telegram.sendMessage(message);
  }

  async onContestFinalized(contestId) {
    const {
      data
    } = await supabaseAdmin.from('contests').select('name').eq('id', contestId).single();
    const message = `🏆 <b>ประกาศผลการประกวด</b>\n<b>การประกวด:</b> "${data.name}" ได้สิ้นสุดและประกาศผลแล้ว`;
    await telegram.sendMessage(message);
  }
}

module.exports = new ChecklistNotifierService();