const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000/api';
const MODEL_API_URL = 'http://localhost:8000';

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
  
  // รูปภาพทดสอบ (ต้องมีไฟล์จริง)
  testImagePath: './test_betta_fish.jpg'
};

async function testModelAPI() {
  console.log('🧪 ทดสอบ Model API...\n');
  
  try {
    // 1. ตรวจสอบสถานะ Model API
    console.log('📡 ตรวจสอบสถานะ Model API...');
    const healthResponse = await axios.get(`${MODEL_API_URL}/`);
    console.log('✅ Model API Status:', healthResponse.data);
    
    // 2. ดึงข้อมูล taxonomy
    console.log('\n📡 ดึงข้อมูล taxonomy...');
    const taxonomyResponse = await axios.get(`${MODEL_API_URL}/meta`);
    console.log('✅ Taxonomy:', JSON.stringify(taxonomyResponse.data.taxonomy, null, 2));
    
    // 3. ทดสอบการ predict รูปภาพ
    if (fs.existsSync(TEST_DATA.testImagePath)) {
      console.log('\n📡 ทดสอบการ predict รูปภาพ...');
      const imageBuffer = fs.readFileSync(TEST_DATA.testImagePath);
      const formData = new FormData();
      formData.append('file', imageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });
      
      const predictResponse = await axios.post(`${MODEL_API_URL}/predict`, formData, {
        params: { threshold: 0.90, topk: 3 },
        headers: { ...formData.getHeaders() }
      });
      
      console.log('✅ Prediction Result:', JSON.stringify(predictResponse.data, null, 2));
    } else {
      console.log('⚠️ ไม่พบไฟล์รูปภาพทดสอบ:', TEST_DATA.testImagePath);
    }
    
  } catch (error) {
    console.error('❌ Model API Error:', error.response?.data || error.message);
  }
}

async function testContestSubmission() {
  console.log('\n🧪 ทดสอบ Contest Submission with AI Validation...\n');
  
  if (!fs.existsSync(TEST_DATA.testImagePath)) {
    console.log('❌ ไม่พบไฟล์รูปภาพทดสอบ:', TEST_DATA.testImagePath);
    return;
  }
  
  try {
    const imageBuffer = fs.readFileSync(TEST_DATA.testImagePath);
    const formData = new FormData();
    
    // เพิ่มข้อมูลปลากัด
    formData.append('contest_id', TEST_DATA.contestId);
    formData.append('betta_name', TEST_DATA.bettaName);
    formData.append('betta_type', TEST_DATA.bettaType);
    formData.append('betta_age_months', TEST_DATA.bettaAgeMonths.toString());
    formData.append('images', imageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });
    
    console.log('📡 ส่งข้อมูลไปยัง Contest API...');
    console.log('   - Contest ID:', TEST_DATA.contestId);
    console.log('   - Betta Type:', TEST_DATA.bettaType);
    console.log('   - Expected Warning: ประเภท B ไม่ได้รับอนุญาตในการประกวดนี้');
    
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
      console.log('\n⚠️ ไม่มี AI validation result');
    }
    
  } catch (error) {
    console.error('❌ Contest Submission Error:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 เริ่มทดสอบ AI Validation System...\n');
  
  // ทดสอบ Model API
  await testModelAPI();
  
  // ทดสอบ Contest Submission
  await testContestSubmission();
  
  console.log('\n✅ การทดสอบเสร็จสิ้น');
}

main(); 