const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testExpertQueue() {
  try {
    console.log('🧪 ทดสอบ Expert Queue...\n');
    
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
      
      // 2. ทดสอบ GET /api/experts/queue
      console.log('📡 ทดสอบ GET /api/experts/queue...');
      const queueResponse = await axios.get(`${API_BASE_URL}/experts/queue`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ GET /api/experts/queue สำเร็จ');
      const queueData = queueResponse.data.data;
      console.log(`📊 Pending: ${queueData.pending.length} รายการ`);
      console.log(`📊 Accepted: ${queueData.accepted.length} รายการ`);
      
      if (queueData.pending.length > 0) {
        console.log('📋 รายการ Pending:');
        queueData.pending.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.fish_name} (${item.fish_type}) - ${item.owner_name}`);
        });
      }
      
      if (queueData.accepted.length > 0) {
        console.log('📋 รายการ Accepted:');
        queueData.accepted.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.fish_name} (${item.fish_type}) - ${item.owner_name}`);
        });
      }
      
      // 3. ทดสอบ GET /api/experts/assignments
      console.log('📡 ทดสอบ GET /api/experts/assignments...');
      const assignmentsResponse = await axios.get(`${API_BASE_URL}/experts/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ GET /api/experts/assignments สำเร็จ');
      console.log(`📊 Assignments: ${assignmentsResponse.data.data.length} รายการ`);
    }
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testExpertQueue(); 