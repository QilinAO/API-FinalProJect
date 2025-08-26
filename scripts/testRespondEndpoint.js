const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testRespondEndpoint() {
  try {
    console.log('🧪 ทดสอบ Respond Endpoint...\n');
    
    // 1. เข้าสู่ระบบเป็น expert
    console.log('👤 เข้าสู่ระบบเป็น Expert...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: 'siriporn.phuchiacharn@gmail.com',
      password: 'zzpp1234'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ เข้าสู่ระบบสำเร็จ');
    
    // 2. ดึง queue เพื่อหา assignment ID
    console.log('📡 ดึง Queue...');
    const queueResponse = await axios.get(`${API_BASE_URL}/experts/queue`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const queueData = queueResponse.data.data;
    console.log(`📊 Pending: ${queueData.pending.length} รายการ`);
    
    if (queueData.pending.length === 0) {
      console.log('❌ ไม่มีงาน Pending ที่จะทดสอบ');
      return;
    }
    
    const assignmentId = queueData.pending[0].assignment_id;
    console.log(`📋 Assignment ID: ${assignmentId}`);
    
    // 3. ทดสอบ POST /api/experts/assignments/:assignmentId/respond
    console.log('📡 ทดสอบ POST /api/experts/assignments/:assignmentId/respond...');
    const respondResponse = await axios.post(`${API_BASE_URL}/experts/assignments/${assignmentId}/respond`, {
      status: 'accepted'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ POST /api/experts/assignments/:assignmentId/respond สำเร็จ');
    console.log('📊 Response:', respondResponse.data);
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testRespondEndpoint(); 