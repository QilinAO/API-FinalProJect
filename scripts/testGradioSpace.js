const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// HuggingFace Space URL
const SPACE_URL = 'https://qilinao-betta-ts-space.hf.space';
const GRADIO_API_URL = `${SPACE_URL}/api/predict`;

async function testGradioSpace() {
  console.log('🧪 ทดสอบ HuggingFace Space ผ่าน Gradio API...\n');
  
  try {
    // 1. ตรวจสอบว่า Space พร้อมใช้งานหรือไม่
    console.log('📡 1. ตรวจสอบสถานะ Space...');
    
    try {
      const spaceStatus = await axios.get(SPACE_URL, { timeout: 10000 });
      console.log('✅ Space พร้อมใช้งาน');
    } catch (error) {
      console.log('⚠️ Space อาจกำลัง loading หรือไม่พร้อมใช้งาน');
    }
    
    // 2. ทดสอบการส่งรูปภาพ
    const testImagePath = './test_betta_fish.jpg';
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ ไม่พบไฟล์รูปภาพทดสอบ:', testImagePath);
      return;
    }

    console.log('\n📡 2. ส่งรูปภาพไปยัง Gradio API...');
    
    // สำหรับ Gradio, เราต้องส่งเป็น base64 หรือ file path
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    // Gradio API format
    const requestData = {
      data: [base64Image], // input สำหรับ Gradio interface
      fn_index: 0 // function index (อาจต้องปรับตาม interface)
    };
    
    console.log('📤 กำลังส่งข้อมูลไปยัง Gradio...');
    
    const response = await axios.post(GRADIO_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000 // Gradio อาจใช้เวลานานกว่า
    });

    console.log('✅ ได้รับผลลัพธ์จาก Space!');
    console.log('\n📊 ผลลัพธ์:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // วิเคราะห์ผลลัพธ์
    if (response.data && response.data.data) {
      console.log('\n🔍 วิเคราะห์ผลลัพธ์:');
      const result = response.data.data[0]; // ผลลัพธ์แรก
      
      if (typeof result === 'object') {
        console.log('📈 Prediction scores:');
        Object.entries(result).forEach(([label, score]) => {
          console.log(`   ${label}: ${(score * 100).toFixed(2)}%`);
        });
        
        // หา prediction ที่สูงสุด
        const topPrediction = Object.entries(result).reduce((a, b) => 
          a[1] > b[1] ? a : b
        );
        console.log(`\n🏆 Top prediction: ${topPrediction[0]} (${(topPrediction[1] * 100).toFixed(2)}%)`);
      }
    }
    
    console.log('\n🎯 ขั้นตอนถัดไป:');
    console.log('   1. ปรับ modelApiService.js ให้เรียก Gradio API');
    console.log('   2. แปลงรูปแบบ response ให้เข้ากับโค้ดเดิม');
    console.log('   3. อัปเดต environment variables');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    
    if (error.response) {
      console.error('📄 Response Status:', error.response.status);
      console.error('📄 Response Data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 แนะนำ:');
      console.log('   1. ตรวจสอบว่า Space URL ถูกต้อง');
      console.log('   2. Space อาจกำลัง sleeping - ลองเข้าเว็บก่อน');
      console.log('   3. ตรวจสอบ Gradio API endpoint');
    }
  }
}

// ฟังก์ชันตรวจสอบ Gradio API endpoints
async function checkGradioEndpoints() {
  console.log('\n🔍 ตรวจสอบ Gradio API endpoints...');
  
  const endpoints = [
    '/api/predict',
    '/api',
    '/gradio_api/predict',
    '/predict'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = `${SPACE_URL}${endpoint}`;
      console.log(`   ทดสอบ: ${url}`);
      
      const response = await axios.get(url, { timeout: 5000 });
      console.log(`   ✅ ${endpoint} - Status: ${response.status}`);
      
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.response?.status || error.code}`);
    }
  }
}

// รันการทดสอบ
async function main() {
  await testGradioSpace();
  await checkGradioEndpoints();
}

main().catch(console.error);
