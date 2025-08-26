const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testEvaluationHistory() {
  try {
    console.log('🧪 ทดสอบ Evaluation History...\n');
    
    // 1. เข้าสู่ระบบเป็น expert
    console.log('👤 เข้าสู่ระบบเป็น Expert...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: 'siriporn.phuchiacharn@gmail.com',
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
    console.log('📊 Response:', JSON.stringify(historyResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testEvaluationHistory(); 