const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAllExpertHistory() {
  try {
    console.log('🧪 ทดสอบประวัติ Expert ทั้งหมด...\n');
    
    // ทดสอบกับ expert หลายคน
    const experts = [
      'wichai.phuchiacharn@gmail.com',
      'siriporn.phuchiacharn@gmail.com',
      'apichart.phuchiacharn@gmail.com'
    ];
    
    for (const expertEmail of experts) {
      console.log(`\n👤 ทดสอบ Expert: ${expertEmail}`);
      
      // 1. เข้าสู่ระบบ
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
        email: expertEmail,
        password: 'zzpp1234'
      });
      
      const token = loginResponse.data.token;
      console.log('✅ เข้าสู่ระบบสำเร็จ');
      
      // 2. ทดสอบ GET /api/experts/history/evaluations
      console.log('📡 ทดสอบ GET /api/experts/history/evaluations...');
      const historyResponse = await axios.get(`${API_BASE_URL}/experts/history/evaluations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ GET /api/experts/history/evaluations สำเร็จ');
      const historyData = historyResponse.data.data;
      console.log(`📊 จำนวนประวัติ: ${historyData.length} รายการ`);
      
      if (historyData.length > 0) {
        console.log('📋 รายละเอียดประวัติ:');
        historyData.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.fish_name} (${item.fish_type})`);
          console.log(`      เจ้าของ: ${item.owner_name}`);
          console.log(`      คะแนนรวม: ${item.total_score}`);
          console.log(`      ประเมินเมื่อ: ${item.evaluated_at}`);
          console.log(`      รายละเอียดคะแนน:`, item.scores);
        });
      } else {
        console.log('   ℹ️  ไม่มีประวัติการประเมิน');
      }
    }
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testAllExpertHistory(); 