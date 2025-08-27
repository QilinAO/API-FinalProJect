#!/usr/bin/env node

/**
 * ทดสอบ API ที่ Frontend BettaEvaluationForm จะเรียกใช้
 * เฉพาะส่วน /model/analyze-single ที่ไม่ต้องใช้ auth
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_IMAGE_PATH = path.join(__dirname, 'test_betta_fish.jpg');

console.log('🧪 ทดสอบ Frontend API Integration');
console.log(`📡 Backend URL: ${API_BASE_URL}`);
console.log(`🖼️  Test Image: ${TEST_IMAGE_PATH}`);
console.log('');

async function testModelAnalysis() {
  console.log('🔍 ทดสอบ /model/analyze-single (ที่ Frontend จะเรียกใช้)');
  
  try {
    // ตรวจสอบไฟล์รูปภาพ
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('❌ ไม่พบไฟล์รูปภาพทดสอบ:', TEST_IMAGE_PATH);
      return;
    }

    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    console.log(`📏 ขนาดรูปภาพ: ${imageBuffer.length} bytes`);

    // สร้าง FormData เหมือนที่ Frontend ทำ
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test_betta.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('betta_type', 'AUTO');
    formData.append('analysis_type', 'quality');

    console.log('📡 กำลังส่งคำขอไปยัง /model/analyze-single...');
    
    const response = await axios.post(`${API_BASE_URL}/api/model/analyze-single`, formData, {
      headers: {
        ...formData.getHeaders(),
        // ไม่ใส่ Authorization เพราะ endpoint นี้ไม่ต้องใช้ auth
      },
      timeout: 60000 // 60 วินาที
    });

    console.log('✅ ได้รับผลลัพธ์จาก Backend:');
    console.log('==================================================');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('==================================================');

    // วิเคราะห์ผลลัพธ์
    const result = response.data;
    if (result.success && result.data) {
      const analysisData = result.data;
      const finalLabel = analysisData.final_label;
      const top1 = analysisData.top1;

      console.log('\n🎯 สรุปผลลัพธ์:');
      console.log(`🏆 ประเภทปลากัด: ${finalLabel.code} (${finalLabel.name})`);
      console.log(`📈 ความมั่นใจ: ${(top1.prob * 100).toFixed(2)}%`);
      console.log(`🤖 มั่นใจหรือไม่: ${analysisData.is_confident ? 'ใช่' : 'ไม่'}`);
      console.log(`💬 เหตุผล: ${finalLabel.reason}`);

      if (analysisData.topk && analysisData.topk.length > 0) {
        console.log('\n📊 คะแนนทั้งหมด:');
        analysisData.topk.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.name} (${item.code}): ${(item.score * 100).toFixed(2)}%`);
        });
      }

      console.log('\n✅ Frontend จะได้รับข้อมูลที่ถูกต้องและสมบูรณ์!');
    } else {
      console.log('❌ ผลลัพธ์ไม่ถูกต้อง:', result);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 แนะนำ: ตรวจสอบว่า Backend server ทำงานอยู่หรือไม่');
      console.log('   - เริ่ม Backend: cd API-FinalProJect && npm start');
    }
  }
}

async function testModelHealth() {
  console.log('🔍 ทดสอบ /model/health');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/model/health`);
    console.log('✅ Model Health Status:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Health Check Error:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 เริ่มทดสอบ Frontend API Integration\n');

  // 1. ทดสอบ health check
  await testModelHealth();
  console.log('');

  // 2. ทดสอบ model analysis (หลักของ Frontend)
  await testModelAnalysis();

  console.log('\n🏁 การทดสอบเสร็จสิ้น');
  console.log('📚 หากทุกอย่างทำงานได้ดี Frontend ก็จะใช้งานได้แล้ว!');
}

main().catch(console.error);
