const axios = require('axios');
const FormData = require('form-data');

const API_BASE_URL = 'http://localhost:5000/api';

// ข้อมูลการทดสอบ
const TEST_DATA = {
  // User token (ต้อง login ก่อน)
  token: 'your-user-token-here',
  
  // Contest ID ที่ต้องการทดสอบ
  contestId: '4c26a5fb-f58b-4b02-96fe-c5370c81db79', // มหัศจรรย์ปลากัดไทย (A, E, D)
  
  // ข้อมูลปลากัด
  bettaName: 'ปลากัดทดสอบ AI',
  bettaType: 'B', // เลือกประเภท B (ไม่ได้รับอนุญาตในการประกวดนี้)
  bettaAgeMonths: 6,
};

async function testContestSubmission() {
  console.log('🧪 ทดสอบ Contest Submission with AI Validation (Mock)...\n');
  
  try {
    // สร้าง mock image buffer
    const mockImageBuffer = Buffer.from('fake image data for testing');
    const formData = new FormData();
    
    // เพิ่มข้อมูลปลากัด
    formData.append('contest_id', TEST_DATA.contestId);
    formData.append('betta_name', TEST_DATA.bettaName);
    formData.append('betta_type', TEST_DATA.bettaType);
    formData.append('betta_age_months', TEST_DATA.bettaAgeMonths.toString());
    formData.append('images', mockImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });
    
    console.log('📡 ส่งข้อมูลไปยัง Contest API...');
    console.log('   - Contest ID:', TEST_DATA.contestId);
    console.log('   - Betta Type:', TEST_DATA.bettaType);
    console.log('   - Expected Warning: ประเภท B ไม่ได้รับอนุญาตในการประกวดนี้');
    console.log('   - Note: Model API จะไม่ทำงาน แต่ระบบควรยังคงส่งข้อมูลได้');
    
    const response = await axios.post(`${API_BASE_URL}/submissions/compete`, formData, {
      headers: {
        'Authorization': `Bearer ${TEST_DATA.token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('\n✅ Response:', JSON.stringify(response.data, null, 2));
    
    // ตรวจสอบ AI validation
    if (response.data.aiValidation) {
      console.log('\n🤖 AI Validation Result:');
      console.log('   - Warning:', response.data.aiValidation.warning.message);
      console.log('   - Severity:', response.data.aiValidation.warning.severity);
      console.log('   - AI Predicted Type:', response.data.aiValidation.aiPredictedType);
      console.log('   - User Selected Type:', response.data.aiValidation.userSelectedType);
      console.log('   - Confidence:', response.data.aiValidation.confidence);
    } else {
      console.log('\n⚠️ ไม่มี AI validation result (อาจเป็นเพราะ Model API ไม่พร้อมใช้งาน)');
    }
    
  } catch (error) {
    console.error('❌ Contest Submission Error:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 เริ่มทดสอบ AI Validation System (Mock)...\n');
  
  // ทดสอบ Contest Submission
  await testContestSubmission();
  
  console.log('\n✅ การทดสอบเสร็จสิ้น');
}

main(); 