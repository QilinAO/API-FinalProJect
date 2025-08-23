// =======================================================================
// File: D:\ProJectFinal\Lasts\betta-fish-api\src\notifiers\devTelegramNotifier.js
// =======================================================================
const {
  supabaseAdmin
} = require('../config/supabase');
const telegram = require('../utils/devTelegram'); // ใช้ devTelegram bot

// ===== Helper Functions =====

const BETTA_TYPE_MAP = {
  wild_central_north: 'ปลากัดพื้นบ้านภาคกลางและเหนือ',
  wild_isan: 'ปลากัดพื้นบ้านภาคอีสาน',
  wild_south: 'ปลากัดพื้นภาคใต้',
  wild_mahachai: 'ปลากัดพื้นบ้านมหาชัย',
  wild_east: 'ปลากัดพื้นบ้านภาคตะวันออก',
  wild_isan_striped: 'ปลากัดพื้นบ้านอีสานหางลาย',
};

const labelType = (slug) => BETTA_TYPE_MAP[slug?.toLowerCase()] || slug || '-';

const shouldNotify = () => telegram.isEnabled();

const buildHeader = (title, deeplink) => {
  const when = new Date().toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok'
  });
  return `<b>${title}</b>\n${deeplink ? `ลิงก์: ${deeplink}\n` : ''}เวลา: ${when}`;
};

const fullName = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.username || u?.email || u?.id || '-';

const buildOwnerLine = (owner) => `ผู้ส่ง: ${fullName(owner)} (<code>${owner?.id || '-'}</code>)`;

const buildAssigneeLine = (assignees = []) => {
  if (!assignees.length) return 'มอบหมายให้: -';
  const first = assignees[0];
  const name = fullName(first?.evaluator);
  return `มอบหมายให้: ${name} (<code>${first?.evaluator?.id || '-'}</code>)`;
};

const buildSubmissionLines = (sub, owner, assignees = []) => [
  `Submission ID: <code>${sub?.id}</code>`,
  buildOwnerLine(owner),
  `ชื่อปลา: ${sub?.fish_name || '-'}`,
  `ประเภท: ${labelType(sub?.fish_type)} (<code>${sub?.fish_type || '-'}</code>)`,
  `อายุ(เดือน): ${sub?.fish_age_months ?? '-'}`,
  `สถานะ: ${sub?.status || '-'}`,
  buildAssigneeLine(assignees),
  `รูปภาพ: ${sub?.fish_image_urls?.length || 0} รูป`,
  `วิดีโอ: ${sub?.fish_video_url ? 'มี' : 'ไม่มี'}`,
].join('\n');

const buildMediaPayload = (sub) => {
  const media = [];
  (sub?.fish_image_urls || []).forEach(url => media.push({
    type: 'photo',
    media: url
  }));
  if (sub?.fish_video_url) {
    media.push({
      type: 'video',
      media: sub.fish_video_url
    });
  }
  return media.slice(0, 10);
};

const getSubmission = (id) => supabaseAdmin.from('submissions').select('*').eq('id', id).single().then(res => res.data);
const getOwner = (id) => supabaseAdmin.from('profiles').select('id, first_name, last_name, username, email').eq('id', id).single().then(res => res.data);
const getAssignees = (id) => supabaseAdmin.from('assignments').select('*, evaluator:profiles(*)').eq('submission_id', id).then(res => res.data || []);
const getContest = (id) => supabaseAdmin.from('contests').select('*, manager:profiles!contests_created_by_fkey(*), judges:contest_judges(*, judge:profiles(*))').eq('id', id).single().then(res => res.data);

// ===== Notification Functions =====

async function onSubmissionCreated(submissionId) {
  if (!shouldNotify()) return;
  const sub = await getSubmission(submissionId);
  if (!sub) return;

  const owner = await getOwner(sub.owner_id);
  const assignees = await getAssignees(submissionId);
  const header = buildHeader('🧪 [DEV] มีการส่งปลากัดเพื่อประเมิน');
  const body = buildSubmissionLines(sub, owner, assignees);

  await telegram.sendMessage([header, body].join('\n'));
  await telegram.sendMediaGroup(buildMediaPayload(sub));
}

async function onAssignmentAccepted(assignmentId) {
  if (!shouldNotify()) return;
  const {
    data: a
  } = await supabaseAdmin.from('assignments').select('*, evaluator:profiles(*), submission:submissions(*, owner:profiles(*))').eq('id', assignmentId).single();
  if (!a) return;

  const header = buildHeader('✅ [DEV] ผู้เชี่ยวชาญตอบรับงานประเมิน');
  const body = [
    buildOwnerLine(a.submission.owner),
    `ผู้เชี่ยวชาญ: ${fullName(a.evaluator)}`,
    `Submission ID: <code>${a.submission.id}</code>`,
    `ชื่อปลา: ${a.submission.fish_name || '-'}`,
  ].join('\n');

  await telegram.sendMessage([header, body].join('\n'));
}

async function onAssignmentEvaluated(assignmentId) {
  if (!shouldNotify()) return;
  const {
    data: a
  } = await supabaseAdmin.from('assignments').select('*, evaluator:profiles(*), submission:submissions(*, owner:profiles(*))').eq('id', assignmentId).single();
  if (!a) return;

  const header = buildHeader('🏁 [DEV] ผู้เชี่ยวชาญให้คะแนนเสร็จ');
  const body = [
    buildOwnerLine(a.submission.owner),
    `ผู้เชี่ยวชาญ: ${fullName(a.evaluator)}`,
    `Submission ID: <code>${a.submission.id}</code>`,
    `ชื่อปลา: ${a.submission.fish_name || '-'}`,
    `คะแนนรวม: <b>${a.total_score ?? '-'}</b>`,
  ].join('\n');

  await telegram.sendMessage([header, body].join('\n'));
}

async function onContestSubmissionCreated(submissionId) {
  if (!shouldNotify()) return;
  const sub = await getSubmission(submissionId);
  if (!sub || !sub.contest_id) return;

  const owner = await getOwner(sub.owner_id);
  const contest = await getContest(sub.contest_id);
  const header = buildHeader('🎯 [DEV] มีการส่งปลากัดเข้าร่วมประกวด');
  const body = [
    `Submission ID: <code>${sub.id}</code>`,
    buildOwnerLine(owner),
    `ชื่อปลา: ${sub.fish_name || '-'}`,
    `การแข่งขัน: ${contest?.name || sub.contest_id}`,
    `ผู้จัดการ: ${fullName(contest?.manager)}`,
  ].join('\n');

  await telegram.sendMessage([header, body].join('\n'));
  await telegram.sendMediaGroup(buildMediaPayload(sub));
}

async function onContestManagerApproved(submissionId, managerId) {
  if (!shouldNotify()) return;
  const sub = await getSubmission(submissionId);
  if (!sub || !sub.contest_id) return;

  const manager = await getOwner(managerId);
  const contest = await getContest(sub.contest_id);
  const header = buildHeader('👍 [DEV] ผู้จัดการอนุมัติการเข้าประกวด');
  const body = [
    `Submission ID: <code>${sub.id}</code>`,
    `การแข่งขัน: ${contest?.name || sub.contest_id}`,
    `อนุมัติโดย: ${fullName(manager)}`,
  ].join('\n');

  await telegram.sendMessage([header, body].join('\n'));
}

async function onContestManagerRejected(submissionId, managerId, reason) {
  if (!shouldNotify()) return;
  const sub = await getSubmission(submissionId);
  if (!sub || !sub.contest_id) return;

  const manager = await getOwner(managerId);
  const contest = await getContest(sub.contest_id);
  const header = buildHeader('👎 [DEV] ผู้จัดการปฏิเสธการเข้าประกวด');
  const body = [
    `Submission ID: <code>${sub.id}</code>`,
    `การแข่งขัน: ${contest?.name || sub.contest_id}`,
    `ปฏิเสธโดย: ${fullName(manager)}`,
    `เหตุผล: ${reason || '-'}`,
  ].join('\n');

  await telegram.sendMessage([header, body].join('\n'));
}

module.exports = {
  onSubmissionCreated,
  onAssignmentAccepted,
  onAssignmentEvaluated,
  onContestSubmissionCreated,
  onContestManagerApproved,
  onContestManagerRejected,
};