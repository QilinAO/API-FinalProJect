// D:\ProJectFinal\Lasts\betta-fish-api\src\controllers\assignmentController.js
const { supabase } = require('../config/supabase');
const devNotify = require('../notifiers/devTelegramNotifier');

/** helper: ตรวจสิทธิ์ (evaluator เอง หรือ admin) */
async function canModifyAssignment(userId, assignmentId) {
  const { data: me } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle();

  if (!me) return { ok: false, reason: 'no-profile' };
  const isAdmin = me.role === 'admin';

  const q = supabase.from('assignments').select('evaluator_id').eq('id', assignmentId).maybeSingle();
  const { data: a } = await q;
  if (!a) return { ok: false, reason: 'no-assignment' };

  if (isAdmin || a.evaluator_id === userId) {
    return { ok: true };
  }
  return { ok: false, reason: 'forbidden' };
}

exports.acceptAssignment = async (req, res) => {
  const userId = req.userId;
  const assignmentId = req.params.id;

  try {
    const perm = await canModifyAssignment(userId, assignmentId);
    if (!perm.ok) {
      const code = perm.reason === 'forbidden' ? 403 : 404;
      return res.status(code).json({ error: 'ไม่มีสิทธิ์หรือไม่พบงาน' });
    }

    const { data, error } = await supabase
      .from('assignments')
      .update({ status: 'accepted' })
      .eq('id', assignmentId)
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    try { await devNotify.onAssignmentAccepted(assignmentId); } catch {}
    return res.json({ success: true, assignmentId: data.id, status: 'accepted' });
  } catch (e) {
    console.error('acceptAssignment error:', e.message);
    return res.status(500).json({ error: 'ไม่สามารถอัปเดตสถานะงานได้' });
  }
};

exports.scoreAssignment = async (req, res) => {
  const userId = req.userId;
  const assignmentId = req.params.id;
  const { scores, total_score } = req.body || {};

  try {
    const perm = await canModifyAssignment(userId, assignmentId);
    if (!perm.ok) {
      const code = perm.reason === 'forbidden' ? 403 : 404;
      return res.status(code).json({ error: 'ไม่มีสิทธิ์หรือไม่พบงาน' });
    }

    const patch = {
      scores: scores ?? null,
      total_score: total_score ?? null,
      status: 'evaluated',
      evaluated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('assignments')
      .update(patch)
      .eq('id', assignmentId)
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    try { await devNotify.onAssignmentEvaluated(assignmentId); } catch {}
    return res.json({ success: true, assignmentId: data.id, status: 'evaluated' });
  } catch (e) {
    console.error('scoreAssignment error:', e.message);
    return res.status(500).json({ error: 'ไม่สามารถบันทึกคะแนนได้' });
  }
};
