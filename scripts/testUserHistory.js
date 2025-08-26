const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testUserHistory() {
  try {
    console.log('🧪 ทดสอบประวัติผู้ใช้...\n');
    
    // 1. เข้าสู่ระบบเป็น user ที่มีคะแนนแล้ว
    console.log('👤 เข้าสู่ระบบเป็น User (Ans Pns)...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: 'ligen98102@evoxury.com',
      password: 'zzpp1234'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ เข้าสู่ระบบสำเร็จ');
    
    // 2. ทดสอบ GET /api/users/history/evaluations
    console.log('📡 ทดสอบ GET /api/users/history/evaluations...');
    const historyResponse = await axios.get(`${API_BASE_URL}/users/history/evaluations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GET /api/users/history/evaluations สำเร็จ');
    console.log('📊 Response:', JSON.stringify(historyResponse.data, null, 2));
    
    // 3. ทดสอบ GET /api/submissions
    console.log('\n📡 ทดสอบ GET /api/submissions...');
    const submissionsResponse = await axios.get(`${API_BASE_URL}/submissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GET /api/submissions สำเร็จ');
    console.log('📊 Response:', JSON.stringify(submissionsResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testUserHistory(); 