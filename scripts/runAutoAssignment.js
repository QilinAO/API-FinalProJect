// Set environment variables
process.env.SUPABASE_URL = 'https://lgnhyqwtilthhqvlgvnd.supabase.co';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnbmh5cXd0aWx0aGhxdmxndm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMTQ0ODgsImV4cCI6MjA2NTg5MDQ4OH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnbmh5cXd0aWx0aGhxdmxndm5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMxNDQ4OCwiZXhwIjoyMDY1ODkwNDg4fQ.IccXmRcb_OaUA1tXvjmjF-V3pNdpbY7OzHmoPgbs_hE';

const autoAssignmentService = require('../src/services/autoAssignmentService');

async function runAutoAssignment() {
  try {
    console.log('🚀 เริ่มรัน Auto Assignment...\n');
    
    const createdCount = await autoAssignmentService.processUnassignedSubmissions();
    
    console.log(`✅ สร้าง Assignments จำนวน: ${createdCount} รายการ`);
    
    if (createdCount > 0) {
      console.log('📋 รายละเอียด:');
      console.log('   - ระบบจะมอบหมายงานให้ผู้เชี่ยวชาญตามความเชี่ยวชาญ');
      console.log('   - ผู้เชี่ยวชาญจะได้รับแจ้งเตือนในระบบ');
      console.log('   - สามารถดูงานที่ได้รับมอบหมายได้ในหน้า Queue');
    } else {
      console.log('ℹ️  ไม่มี submissions ที่ต้องมอบหมายงาน');
    }
    
  } catch (error) {
    console.error('❌ Error running auto assignment:', error);
  }
}

runAutoAssignment(); 