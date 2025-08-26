const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testContestAPI() {
  try {
    console.log('🧪 ทดสอบ Contest API...\n');
    
    // 1. ทดสอบ GET /api/public/content/all?category=contest
    console.log('📡 ทดสอบ GET /api/public/content/all?category=contest...');
    const contestResponse = await axios.get(`${API_BASE_URL}/public/content/all?category=contest`);
    
    console.log('✅ GET /api/public/content/all?category=contest สำเร็จ');
    console.log('📊 Response:', JSON.stringify(contestResponse.data, null, 2));
    
    // 2. ทดสอบ GET /api/public/contests
    console.log('\n📡 ทดสอบ GET /api/public/contests...');
    const contestsResponse = await axios.get(`${API_BASE_URL}/public/contests`);
    
    console.log('✅ GET /api/public/contests สำเร็จ');
    console.log('📊 Response:', JSON.stringify(contestsResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testContestAPI(); 