const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lgnhyqwtilthhqvlgvnd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnbmh5cXd0aWx0aGhxdmxndm5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMxNDQ4OCwiZXhwIjoyMDY1ODkwNDg4fQ.IccXmRcb_OaUA1tXvjmjF-V3pNdpbY7OzHmoPgbs_hE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkScores() {
  try {
    console.log('🔍 ตรวจสอบคะแนนในฐานข้อมูล...\n');

    // 1. ตรวจสอบ Assignments ที่มีคะแนน
    console.log('📋 1. รายการ Assignments ที่มีคะแนน:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        status,
        total_score,
        scores,
        assigned_at,
        evaluated_at,
        submission:submissions!inner(fish_name, fish_type, owner:profiles(first_name, last_name)),
        evaluator:profiles!assignments_evaluator_id_fkey(first_name, last_name)
      `)
      .not('total_score', 'is', null)
      .order('evaluated_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
      return;
    }

    console.log(`📊 จำนวน Assignments ที่มีคะแนน: ${assignments.length}`);
    assignments.forEach(assign => {
      console.log(`   - ${assign.submission.fish_name} (${assign.submission.fish_type})`);
      console.log(`     ผู้ประเมิน: ${assign.evaluator.first_name} ${assign.evaluator.last_name}`);
      console.log(`     คะแนนรวม: ${assign.total_score}`);
      console.log(`     รายละเอียดคะแนน:`, assign.scores);
      console.log(`     ประเมินเมื่อ: ${assign.evaluated_at}`);
      console.log('');
    });

    // 2. ตรวจสอบ Submissions ที่มีคะแนน
    console.log('📋 2. รายการ Submissions ที่มีคะแนน:');
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        fish_name,
        fish_type,
        final_score,
        status,
        submitted_at,
        owner:profiles(first_name, last_name)
      `)
      .not('final_score', 'is', null)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError);
      return;
    }

    console.log(`📊 จำนวน Submissions ที่มีคะแนน: ${submissions.length}`);
    submissions.forEach(sub => {
      console.log(`   - ${sub.fish_name} (${sub.fish_type})`);
      console.log(`     เจ้าของ: ${sub.owner.first_name} ${sub.owner.last_name}`);
      console.log(`     คะแนนรวม: ${sub.final_score}`);
      console.log(`     สถานะ: ${sub.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkScores(); 