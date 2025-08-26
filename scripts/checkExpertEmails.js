const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lgnhyqwtilthhqvlgvnd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnbmh5cXd0aWx0aGhxdmxndm5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMxNDQ4OCwiZXhwIjoyMDY1ODkwNDg4fQ.IccXmRcb_OaUA1tXvjmjF-V3pNdpbY7OzHmoPgbs_hE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkExpertEmails() {
  try {
    console.log('🔍 ตรวจสอบ Email ของ Experts...\n');

    const { data: experts, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, username')
      .eq('role', 'expert')
      .order('first_name');

    if (error) {
      console.error('❌ Error fetching experts:', error);
      return;
    }

    console.log(`📊 จำนวน Expert: ${experts.length}\n`);
    
    experts.forEach((expert, index) => {
      console.log(`${index + 1}. ${expert.first_name} ${expert.last_name}`);
      console.log(`   Email: ${expert.email}`);
      console.log(`   Username: ${expert.username}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkExpertEmails(); 