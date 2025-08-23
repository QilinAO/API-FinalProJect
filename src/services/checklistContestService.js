// src/services/checklistContestService.js
const { supabaseAdmin } = require('../config/supabase');
const { sendMessage } = require('../utils/telegram');

const T = (v) => (v ? '✅' : '❌');
const S = (title) => `\n<b>${title}</b>`;
const esc = (s) => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/**
 * สร้างข้อความสรุปเช็คลิสต์ผู้ใช้ (ตาม view v_user_checklist_live)
 */
function buildUserChecklistMessage(row) {
  const base  = row.checklist_base || {};
  const part  = row.checklist_participant || {};
  const judge = row.checklist_judge || {};

  const lines = [
    '🧾 <b>User Checklist (Contest)</b>',
    `• user: <code>${esc(row.user_id)}</code>`,
    `• role: <code>${esc(row.role || '-')}</code>`,
    S('Base'),
    `${T(base.profile)} โปรไฟล์มีอยู่`,
    `${T(base.email_verified)} ยืนยันอีเมล`,
    `${T(base.telegram)} ผูก Telegram`,
    `${T(base.notifications_received)} เคยได้รับการแจ้งเตือน`,
    `${T(base.notifications_read)} เคยเปิดอ่านแจ้งเตือน`,
    S('Participant'),
    `${T(part.has_submission)} ส่งผลงานแล้ว`,
    `${T(part.has_media)} มีสื่อ (ภาพ/วิดีโอ)`,
    `${T(part.in_contest)} อยู่ในรายการประกวด`,
    `${T(part.status_moved)} สถานะขยับจาก pending`,
    `${T(part.scored)} มีคะแนนรวมแล้ว`,
    S('Judge'),
    `${T(judge.is_judge)} เป็นกรรมการ (accepted)`,
    `${T(judge.has_assignment)} ได้รับมอบหมายประเมิน`,
    `${T(judge.evaluated_any)} เคยประเมินแล้ว`,
    '',
    row.is_all_passed ? '🎉 ครบตามบทบาท' : '⚠️ ยังไม่ครบตามบทบาท',
  ];

  return lines.join('\n');
}

/**
 * แยกรายการที่ยังไม่ผ่านเป็นสตริงอ่านง่าย
 */
function listMissingFields(row) {
  const missing = [];
  const add = (obj, prefix) => {
    Object.entries(obj || {}).forEach(([k, v]) => { if (!v) missing.push(prefix ? `${prefix}.${k}` : k); });
  };
  add(row.checklist_base, 'base');
  add(row.checklist_participant, 'participant');
  add(row.checklist_judge, 'judge');
  return missing.join(', ') || '-';
}

/**
 * ส่งข้อความทีละก้อน ป้องกันยาวเกินลิมิต Telegram (≈4096 ตัวอักษร)
 */
async function sendChunked(text, maxLen = 3900) {
  if (text.length <= maxLen) return sendMessage(text);
  const parts = [];
  let buf = [];
  let len = 0;
  for (const line of text.split('\n')) {
    const add = line + '\n';
    if (len + add.length > maxLen) {
      parts.push(buf.join('\n'));
      buf = [line];
      len = line.length;
    } else {
      buf.push(line);
      len += add.length;
    }
  }
  if (buf.length) parts.push(buf.join('\n'));
  for (const p of parts) await sendMessage(p);
}

/**
 * แจ้งเช็คลิสต์ของผู้ใช้คนเดียวไป Telegram
 */
async function notifyUserChecklistContest(userId) {
  const { data, error } = await supabaseAdmin
    .from('v_user_checklist_live')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('user not found in view');

  const msg = buildUserChecklistMessage(data);
  await sendChunked(msg);
}

/**
 * สแกนผู้ใช้ทั้งหมด/ตามบทบาท แล้วส่งเฉพาะคนที่ “ยังไม่ครบ”
 * options:
 *   - limit  : จำนวนสูงสุด (default 1000)
 *   - offset : เริ่มที่แถวไหน (default 0)
 *   - role   : กรองบทบาท ('user' | 'admin' | 'judge' | ฯลฯ)
 *   - dryRun : ถ้า true จะไม่ส่ง Telegram แค่คืนผลลัพธ์
 */
async function notifyAllUsersIncompleteContest(options = {}) {
  const {
    limit = 1000,
    offset = 0,
    role,
    dryRun = false,
  } = options;

  let query = supabaseAdmin
    .from('v_user_checklist_live')
    .select('user_id, role, is_all_passed, checklist_base, checklist_participant, checklist_judge');

  if (role) query = query.eq('role', role);
  if (Number.isFinite(limit) && Number.isFinite(offset)) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;

  const results = [];

  for (const row of data || []) {
    if (row.is_all_passed) continue;
    const msg = [
      '⚠️ <b>User Incomplete (Contest)</b>',
      `• user: <code>${esc(row.user_id)}</code>`,
      `• role: <code>${esc(row.role || '-')}</code>`,
      `• missing: ${esc(listMissingFields(row))}`,
    ].join('\n');

    results.push({ user_id: row.user_id, role: row.role || null, message: msg });

    if (!dryRun) {
      await sendChunked(msg);
    }
  }

  return results;
}

module.exports = {
  notifyUserChecklistContest,
  notifyAllUsersIncompleteContest,
  // เผื่อใช้ภายในโปรเจ็กต์
  _buildUserChecklistMessage: buildUserChecklistMessage,
  _listMissingFields: listMissingFields,
};
