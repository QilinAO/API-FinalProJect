const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lgnhyqwtilthhqvlgvnd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnbmh5cXd0aWx0aGhxdmxndm5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMxNDQ4OCwiZXhwIjoyMDY1ODkwNDg4fQ.IccXmRcb_OaUA1tXvjmjF-V3pNdpbY7OzHmoPgbs_hE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAssignments() {
  try {
    console.log('🔍 ตรวจสอบข้อมูล Assignments และ Submissions...\n');

    // 1. ตรวจสอบ Submissions ทั้งหมด
    console.log('📋 1. รายการ Submissions ทั้งหมด:');
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        fish_name,
        fish_type,
        status,
        submitted_at,
        owner:profiles!submissions_owner_id_fkey(first_name, last_name, email)
      `)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError);
      return;
    }

    console.log(`📊 จำนวน Submissions: ${submissions.length}`);
    submissions.forEach(sub => {
      console.log(`   - ${sub.fish_name} (${sub.fish_type}) - ${sub.status} - ${sub.owner?.first_name} ${sub.owner?.last_name}`);
    });

    // 2. ตรวจสอบ Assignments ทั้งหมด
    console.log('\n📋 2. รายการ Assignments ทั้งหมด:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        status,
        assigned_at,
        evaluated_at,
        submission:submissions!assignments_submission_id_fkey(fish_name, fish_type),
        evaluator:profiles!assignments_evaluator_id_fkey(first_name, last_name, email)
      `)
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
      return;
    }

    console.log(`📊 จำนวน Assignments: ${assignments.length}`);
    assignments.forEach(assign => {
      console.log(`   - ${assign.submission?.fish_name} -> ${assign.evaluator?.first_name} ${assign.evaluator?.last_name} (${assign.status})`);
    });

    // 3. ตรวจสอบ Expert ทั้งหมด
    console.log('\n📋 3. รายการ Expert ทั้งหมด:');
    const { data: experts, error: expertsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, specialities')
      .eq('role', 'expert')
      .order('first_name');

    if (expertsError) {
      console.error('❌ Error fetching experts:', expertsError);
      return;
    }

    console.log(`📊 จำนวน Expert: ${experts.length}`);
    experts.forEach(expert => {
      console.log(`   - ${expert.first_name} ${expert.last_name} (${expert.specialities?.join(', ') || 'ไม่มีความเชี่ยวชาญ'})`);
    });

    // 4. ตรวจสอบ Submissions ที่ไม่มี Assignment
    console.log('\n📋 4. Submissions ที่ไม่มี Assignment:');
    const submissionsWithoutAssignment = submissions.filter(sub => 
      !assignments.some(assign => assign.submission?.id === sub.id)
    );

    console.log(`📊 จำนวน Submissions ที่ไม่มี Assignment: ${submissionsWithoutAssignment.length}`);
    submissionsWithoutAssignment.forEach(sub => {
      console.log(`   - ${sub.fish_name} (${sub.fish_type}) - ${sub.owner?.first_name} ${sub.owner?.last_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAssignments(); 