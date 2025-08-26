const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testHistoryEndpoints() {
  try {
    console.log('🧪 ทดสอบ History Endpoints...');
    
    // 1. เข้าสู่ระบบ
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: 'somchai.jaidee@gmail.com',
      password: 'zzpp1234'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ เข้าสู่ระบบสำเร็จ');
    
    // 2. ทดสอบ GET /api/users/history/evaluations
    console.log('\n📡 ทดสอบ GET /api/users/history/evaluations...');
    const evaluationsResponse = await axios.get(`${API_BASE_URL}/users/history/evaluations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GET /api/users/history/evaluations สำเร็จ');
    console.log('📊 Response:', evaluationsResponse.data);
    
    // 3. ทดสอบ GET /api/users/history/competitions
    console.log('\n📡 ทดสอบ GET /api/users/history/competitions...');
    const competitionsResponse = await axios.get(`${API_BASE_URL}/users/history/competitions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GET /api/users/history/competitions สำเร็จ');
    console.log('📊 Response:', competitionsResponse.data);
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testHistoryEndpoints(); 