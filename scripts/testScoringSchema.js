const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testScoringSchema() {
  try {
    console.log('🧪 ทดสอบ Scoring Schema Endpoint...\n');
    
    // 1. เข้าสู่ระบบเป็น expert
    console.log('👤 เข้าสู่ระบบเป็น Expert...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: 'siriporn.phuchiacharn@gmail.com',
      password: 'zzpp1234'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ เข้าสู่ระบบสำเร็จ');
    
    // 2. ทดสอบ GET /api/experts/scoring-schema/C
    console.log('📡 ทดสอบ GET /api/experts/scoring-schema/C...');
    const schemaResponse = await axios.get(`${API_BASE_URL}/experts/scoring-schema/C`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GET /api/experts/scoring-schema/C สำเร็จ');
    console.log('📊 Response:', JSON.stringify(schemaResponse.data, null, 2));
    
    // 3. ทดสอบ GET /api/experts/scoring-schema/D
    console.log('\n📡 ทดสอบ GET /api/experts/scoring-schema/D...');
    const schemaResponse2 = await axios.get(`${API_BASE_URL}/experts/scoring-schema/D`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GET /api/experts/scoring-schema/D สำเร็จ');
    console.log('📊 Response:', JSON.stringify(schemaResponse2.data, null, 2));
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testScoringSchema(); 