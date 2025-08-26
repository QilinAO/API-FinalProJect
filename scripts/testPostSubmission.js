const axios = require('axios');
const FormData = require('form-data');

const API_BASE_URL = 'http://localhost:5000/api';

async function testPostSubmission() {
  try {
    console.log('🧪 ทดสอบ POST /api/submissions...');
    
    // 1. เข้าสู่ระบบ
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: 'somchai.jaidee@gmail.com',
      password: 'zzpp1234'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ เข้าสู่ระบบสำเร็จ');
    
    // 2. ทดสอบ POST /api/submissions
    const formData = new FormData();
    formData.append('betta_name', 'ปลากัดทดสอบ');
    formData.append('betta_type', 'ปลากัดพื้นบ้าน');
    formData.append('betta_age_months', '6');
    
    // สร้างไฟล์รูปภาพจำลอง
    formData.append('images', Buffer.from('fake image data'), {
      filename: 'test.jpg',
      contentType: 'image/jpeg'
    });
    
    const postResponse = await axios.post(`${API_BASE_URL}/submissions`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ POST /api/submissions สำเร็จ');
    console.log('📊 Response:', postResponse.data);
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.response?.data || error.message);
    console.log('📊 Status:', error.response?.status);
  }
}

testPostSubmission(); 