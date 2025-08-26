const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testSubmitScore() {
  try {
    console.log('🧪 ทดสอบ Submit Score Endpoint...\n');
    
    // 1. เข้าสู่ระบบเป็น expert
    console.log('👤 เข้าสู่ระบบเป็น Expert...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: 'siriporn.phuchiacharn@gmail.com',
      password: 'zzpp1234'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ เข้าสู่ระบบสำเร็จ');
    
    // 2. ดึง queue เพื่อหา assignment ID ที่ accepted แล้ว
    console.log('📡 ดึง Queue...');
    const queueResponse = await axios.get(`${API_BASE_URL}/experts/queue`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const queueData = queueResponse.data.data;
    console.log(`📊 Accepted: ${queueData.accepted.length} รายการ`);
    
    if (queueData.accepted.length === 0) {
      console.log('❌ ไม่มีงาน Accepted ที่จะทดสอบ');
      return;
    }
    
    const assignmentId = queueData.accepted[0].assignment_id;
    console.log(`📋 Assignment ID: ${assignmentId}`);
    
    // 3. ทดสอบ POST /api/experts/assignments/:assignmentId/score
    console.log('📡 ทดสอบ POST /api/experts/assignments/:assignmentId/score...');
    const scoreData = {
      scores: {
        head_body: 8,
        cheeks_scales: 12,
        dorsal_fin: 9,
        caudal_fin: 13,
        pelvic_fin: 8,
        anal_fin: 8,
        flaring_swimming: 9,
        overall: 16
      },
      totalScore: 83
    };
    
    const scoreResponse = await axios.post(`${API_BASE_URL}/experts/assignments/${assignmentId}/score`, scoreData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ POST /api/experts/assignments/:assignmentId/score สำเร็จ');
    console.log('📊 Response:', scoreResponse.data);
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testSubmitScore(); 