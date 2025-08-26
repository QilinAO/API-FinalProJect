const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testExpertEndpoints() {
  try {
    console.log('🧪 ทดสอบ Expert Endpoints...');
    
    // 1. เข้าสู่ระบบ
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: 'wichai.phuchiacharn@gmail.com',
      password: 'zzpp1234'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ เข้าสู่ระบบสำเร็จ');
    
    // 2. ทดสอบ GET /api/experts/judging
    console.log('\n📡 ทดสอบ GET /api/experts/judging...');
    const judgingResponse = await axios.get(`${API_BASE_URL}/experts/judging`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GET /api/experts/judging สำเร็จ');
    console.log('📊 Response:', judgingResponse.data);
    
    // 3. ทดสอบ GET /api/experts/history
    console.log('\n📡 ทดสอบ GET /api/experts/history...');
    const historyResponse = await axios.get(`${API_BASE_URL}/experts/history?type=quality`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GET /api/experts/history สำเร็จ');
    console.log('📊 Response:', historyResponse.data);
    
    // 4. ทดสอบ GET /api/experts/specialities
    console.log('\n📡 ทดสอบ GET /api/experts/specialities...');
    const specialitiesResponse = await axios.get(`${API_BASE_URL}/experts/specialities`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GET /api/experts/specialities สำเร็จ');
    console.log('📊 Response:', specialitiesResponse.data);
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testExpertEndpoints(); 