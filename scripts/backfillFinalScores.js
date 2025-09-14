#!/usr/bin/env node
/**
 * Backfill final_score for submissions from assignments.total_score
 * Usage:
 *  node scripts/backfillFinalScores.js [--contest-id <UUID>] [--contest-name <TEXT>] [--dry-run]
 */

const { supabaseAdmin, supabase } = require('../src/config/supabase');

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--contest-id') args.contestId = argv[++i];
    else if (a === '--contest-name') args.contestName = argv[++i];
  }
  return args;
}

async function getContestIdByName(name) {
  const { data, error } = await supabase
    .from('contests')
    .select('id, name')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`ค้นหาการประกวดโดยชื่อผิดพลาด: ${error.message}`);
  return data?.id || null;
}

async function getAcceptedJudgesMap(contestId) {
  if (!contestId) return {};
  const { data, error } = await supabaseAdmin
    .from('contest_judges')
    .select('judge_id')
    .match({ contest_id: contestId, status: 'accepted' });
  if (error) throw new Error(`ดึงกรรมการล้มเหลว: ${error.message}`);
  return { [contestId]: (data || []).map(r => r.judge_id) };
}

async function listTargetSubmissions(contestId) {
  const q = supabaseAdmin
    .from('submissions')
    .select('id, contest_id, final_score, status');
  if (contestId) q.eq('contest_id', contestId);
  const { data, error } = await q;
  if (error) throw new Error(`ดึง submissions ล้มเหลว: ${error.message}`);
  return data || [];
}

async function getEvaluatedScores(submissionId) {
  const { data, error } = await supabaseAdmin
    .from('assignments')
    .select('total_score')
    .eq('submission_id', submissionId)
    .eq('status', 'evaluated');
  if (error) throw new Error(`ดึงคะแนน assignments ล้มเหลว: ${error.message}`);
  return (data || []).map(r => Number(r.total_score)).filter(Number.isFinite);
}

async function run() {
  const { dryRun, contestId: argContestId, contestName } = parseArgs(process.argv);
  let contestId = argContestId || null;

  if (!contestId && contestName) {
    contestId = await getContestIdByName(contestName);
    if (!contestId) {
      console.log(`ไม่พบการแข่งขันที่ชื่อ: ${contestName}`);
      process.exit(1);
    }
  }

  console.log('เริ่ม Backfill final_score');
  if (contestId) console.log('• เฉพาะ contest_id:', contestId);
  if (dryRun) console.log('• โหมด Dry-Run (ไม่เขียนลงฐานข้อมูล)');

  const subs = await listTargetSubmissions(contestId);
  console.log(`พบ submissions ทั้งหมด: ${subs.length}`);

  // Build accepted judges map if single contest
  let acceptedMap = {};
  if (contestId) acceptedMap = await getAcceptedJudgesMap(contestId);

  let updatedCount = 0;
  for (const s of subs) {
    const scores = await getEvaluatedScores(s.id);
    if (scores.length === 0) continue;
    const avg = Math.round((scores.reduce((sum, v) => sum + v, 0) / scores.length) * 100) / 100;

    const needUpdate = s.final_score == null || Number(s.final_score) !== avg;
    const acceptedTotal = acceptedMap[s.contest_id]?.length || null;
    const shouldEvaluated = acceptedTotal && scores.length >= acceptedTotal;

    if (needUpdate || shouldEvaluated) {
      console.log(`- ${s.id} avg=${avg} ${needUpdate ? '(update final_score)' : ''} ${shouldEvaluated ? "(mark 'evaluated')" : ''}`);
      if (!dryRun) {
        const patch = { final_score: avg };
        if (shouldEvaluated && s.status !== 'evaluated') patch.status = 'evaluated';
        const { error: updErr } = await supabaseAdmin
          .from('submissions')
          .update(patch)
          .eq('id', s.id);
        if (updErr) throw new Error(`อัปเดต submission ล้มเหลว: ${updErr.message}`);
        updatedCount++;
      }
    }
  }

  console.log(`เสร็จสิ้น Backfill. ${dryRun ? '(dry-run) ' : ''}อัปเดต ${updatedCount} รายการ`);
}

run().catch(err => {
  console.error('Backfill ผิดพลาด:', err?.message || err);
  process.exit(1);
});

