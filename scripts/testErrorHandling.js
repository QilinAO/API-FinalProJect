#!/usr/bin/env node

/**
 * ทดสอบ Error Handling ของระบบ AI Model Integration
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:19003';
const TEST_IMAGE_PATH = path.join(__dirname, 'test_betta_fish.jpg');

console.log('🧪 ทดสอบ Error Handling ของระบบ AI Model');
console.log('='.repeat(60));

async function testInvalidImage() {
  console.log('\n1. 🔍 ทดสอบส่งไฟล์ที่ไม่ใช่รูปภาพ');
  
  try {
    const formData = new FormData();
    formData.append('image', Buffer.from('invalid image data'), {
      filename: 'test.txt',
      contentType: 'text/plain'
    });
    formData.append('betta_type', 'AUTO');
    formData.append('analysis_type', 'quality');

    const response = await axios.post(`${API_BASE_URL}/model/analyze-single`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 10000
    });

    console.log('❌ ควรต้องได้รับ Error แต่กลับสำเร็จ:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Error Response ถูกต้อง:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || 'ไม่มี error message'}`);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

async function testMissingImage() {
  console.log('\n2. 🔍 ทดสอบไม่ส่งรูปภาพ');
  
  try {
    const formData = new FormData();
    formData.append('betta_type', 'AUTO');
    formData.append('analysis_type', 'quality');

    const response = await axios.post(`${API_BASE_URL}/model/analyze-single`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 10000
    });

    console.log('❌ ควรต้องได้รับ Error แต่กลับสำเร็จ:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Error Response ถูกต้อง:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || 'ไม่มี error message'}`);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

async function testModelHealthWhenOffline() {
  console.log('\n3. 🔍 ทดสอบ Model Health Check');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/model/health`, {
      timeout: 10000
    });
    
    console.log('✅ Health Check Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // ตรวจสอบโครงสร้างของ response
    const data = response.data;
    if (data.success !== undefined && data.data && data.timestamp) {
      console.log('✅ Health Check Response มีโครงสร้างถูกต้อง');
    } else {
      console.log('❌ Health Check Response โครงสร้างไม่ถูกต้อง');
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Health Check Error:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || 'ไม่มี error message'}`);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

async function testLargeImage() {
  console.log('\n4. 🔍 ทดสอบรูปภาพขนาดใหญ่ (ถ้ามี)');
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('⚠️ ไม่พบไฟล์รูปภาพทดสอบ - ข้าม test นี้');
    return;
  }
  
  try {
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    console.log(`📏 ขนาดรูปภาพ: ${imageBuffer.length} bytes`);
    
    // สร้างรูปปลอมขนาดใหญ่ (> 10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0); // 11MB
    
    const formData = new FormData();
    formData.append('image', largeBuffer, {
      filename: 'large_image.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('betta_type', 'AUTO');
    formData.append('analysis_type', 'quality');

    const response = await axios.post(`${API_BASE_URL}/model/analyze-single`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });

    console.log('❌ ควรต้องได้รับ Error (file too large) แต่กลับสำเร็จ:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Large File Error Response ถูกต้อง:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || 'ไม่มี error message'}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ เซิร์ฟเวอร์ไม่ทำงาน');
    } else {
      console.log('✅ Network/Timeout Error (คาดหวัง):', error.message);
    }
  }
}

async function testValidImageWithGoodErrorHandling() {
  console.log('\n5. 🔍 ทดสอบรูปภาพปกติ (ดู Error Handling เมื่อ Model ล้มเหลว)');
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('⚠️ ไม่พบไฟล์รูปภาพทดสอบ - ข้าม test นี้');
    return;
  }
  
  try {
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test_betta.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('betta_type', 'AUTO');
    formData.append('analysis_type', 'quality');

    const response = await axios.post(`${API_BASE_URL}/model/analyze-single`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000
    });

    console.log('✅ API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // ตรวจสอบโครงสร้างของ response
    const data = response.data;
    if (data.success && data.data) {
      console.log('✅ Model API ทำงานสำเร็จ');
    } else if (!data.success && data.error) {
      console.log('✅ Model API Error Handling ทำงานถูกต้อง');
      console.log(`   Error: ${data.error}`);
    } else {
      console.log('❌ Response format ไม่ถูกต้อง');
    }
    
  } catch (error) {
    if (error.response) {
      console.log('✅ Model Error Response:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || 'ไม่มี error message'}`);
      console.log('   ✅ Error handling ทำงานถูกต้อง');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ เซิร์ฟเวอร์ไม่ทำงาน - เริ่ม Backend ก่อน');
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 เริ่มทดสอบ Error Handling\n');

  await testInvalidImage();
  await testMissingImage();
  await testModelHealthWhenOffline();
  await testLargeImage();
  await testValidImageWithGoodErrorHandling();

  console.log('\n🏁 การทดสอบ Error Handling เสร็จสิ้น');
  console.log('='.repeat(60));
  console.log('📚 สรุป: Error Handling ควรจับ errors ได้ทุกกรณีและส่ง response ที่เหมาะสม');
}

main().catch(console.error);
