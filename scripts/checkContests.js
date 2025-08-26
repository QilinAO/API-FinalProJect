const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lgnhyqwtilthhqvlgvnd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnbmh5cXd0aWx0aGhxdmxndm5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMxNDQ4OCwiZXhwIjoyMDY1ODkwNDg4fQ.IccXmRcb_OaUA1tXvjmjF-V3pNdpbY7OzHmoPgbs_hE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkContests() {
  try {
    console.log('🔍 ตรวจสอบข้อมูลการประกวด...\n');

    // 1. ตรวจสอบการประกวดทั้งหมด
    console.log('📋 1. รายการการประกวดทั้งหมด:');
    const { data: allContests, error: allContestsError } = await supabase
      .from('contests')
      .select('*')
      .order('created_at', { ascending: false });

    if (allContestsError) {
      console.error('❌ Error fetching all contests:', allContestsError);
      return;
    }

    console.log(`📊 จำนวนการประกวดทั้งหมด: ${allContests.length}`);
    allContests.forEach(contest => {
      console.log(`   - ${contest.name}`);
      console.log(`     Category: ${contest.category}`);
      console.log(`     Status: ${contest.status}`);
      console.log(`     Allowed Subcategories: ${contest.allowed_subcategories?.join(', ') || 'ไม่ระบุ'}`);
      console.log('');
    });

    // 2. ตรวจสอบการประกวดที่กำลังดำเนินการ
    console.log('📋 2. การประกวดที่กำลังดำเนินการ:');
    const { data: activeContests, error: activeContestsError } = await supabase
      .from('contests')
      .select('*')
      .eq('category', 'การประกวด')
      .eq('status', 'กำลังดำเนินการ')
      .order('created_at', { ascending: false });

    if (activeContestsError) {
      console.error('❌ Error fetching active contests:', activeContestsError);
      return;
    }

    console.log(`📊 จำนวนการประกวดที่กำลังดำเนินการ: ${activeContests.length}`);
    activeContests.forEach(contest => {
      console.log(`   - ${contest.name}`);
      console.log(`     Allowed Subcategories: ${contest.allowed_subcategories?.join(', ') || 'ไม่ระบุ'}`);
      console.log(`     Created: ${contest.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkContests(); 