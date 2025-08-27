#!/usr/bin/env node

/**
 * ทดสอบ Multipart Form Data Debug
 * เพื่อหาสาเหตุของ "Boundary not found" error
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_IMAGE_PATH = path.join(__dirname, 'test_betta_fish.jpg');

console.log('🐛 Debug Multipart Form Data Issue');
console.log('='.repeat(50));

async function testWithRawFetch() {
  console.log('\n1. 🧪 ทดสอบด้วย Raw Fetch (เหมือน Frontend)');
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('❌ ไม่พบไฟล์รูปภาพทดสอบ');
    return;
  }

  try {
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    
    // สร้าง FormData เหมือน Frontend
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test_betta.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('betta_type', 'AUTO');
    formData.append('analysis_type', 'quality');

    console.log('📤 ส่งด้วย Axios + FormData (Node.js style)...');
    
    const response = await axios.post(`${API_BASE_URL}/api/model/analyze-single`, formData, {
      headers: {
        ...formData.getHeaders() // สำคัญ! ต้องใส่ headers จาก FormData
      },
      timeout: 30000
    });

    console.log('✅ สำเร็จ!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ล้มเหลว:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || error.response.data}`);
      console.log(`   Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
    } else {
      console.log(`   Network Error: ${error.message}`);
    }
  }
}

async function testHealthCheck() {
  console.log('\n2. 🏥 ทดสอบ Health Check');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/model/health`);
    console.log('✅ Backend ทำงานปกติ');
    console.log('Health:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Backend ไม่ทำงาน:', error.message);
    return false;
  }
}

async function testWithBrowserLikeFetch() {
  console.log('\n3. 🌐 ทดสอบด้วย Native FormData (เลียนแบบ Browser)');
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('❌ ไม่พบไฟล์รูปภาพทดสอบ');
    return;
  }

  try {
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    
    // ใช้ node-fetch หรือ axios แบบไม่ตั้ง Content-Type
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test_betta.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('betta_type', 'AUTO');
    formData.append('analysis_type', 'quality');

    console.log('📤 ส่งโดยไม่ตั้ง Content-Type headers...');
    
    const response = await axios.post(`${API_BASE_URL}/api/model/analyze-single`, formData, {
      // ไม่ตั้ง headers เลย ให้ axios ทำเอง
      timeout: 30000
    });

    console.log('✅ สำเร็จ!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ล้มเหลว:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || error.response.data}`);
    } else {
      console.log(`   Network Error: ${error.message}`);
    }
  }
}

async function testBackendDirectly() {
  console.log('\n4. 🎯 ทดสอบ Backend Endpoint โดยตรง');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✅ Backend API ทำงาน');
    
    // ทดสอบ model health
    const modelHealth = await axios.get(`${API_BASE_URL}/api/model/health`);
    console.log('✅ Model endpoint ทำงาน');
    console.log('Model Health:', JSON.stringify(modelHealth.data, null, 2));
    
  } catch (error) {
    console.log('❌ Backend หรือ Model endpoint ไม่ทำงาน:', error.message);
  }
}

async function inspectFormData() {
  console.log('\n5. 🔍 ตรวจสอบ FormData Structure');
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('❌ ไม่พบไฟล์รูปภาพทดสอบ');
    return;
  }

  const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
  const formData = new FormData();
  formData.append('image', imageBuffer, {
    filename: 'test_betta.jpg',
    contentType: 'image/jpeg'
  });
  formData.append('betta_type', 'AUTO');
  formData.append('analysis_type', 'quality');

  console.log('📋 FormData Headers:');
  const headers = formData.getHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  console.log('\n📊 FormData Properties:');
  console.log(`   Boundary: ${formData.getBoundary()}`);
  console.log(`   Length: ${formData.getLengthSync?.()} bytes`);
}

async function main() {
  console.log('🚀 เริ่มการ Debug Multipart Form Data\n');

  // ตรวจสอบ Backend ก่อน
  const backendOk = await testHealthCheck();
  if (!backendOk) {
    console.log('\n💡 Backend ไม่ทำงาน - เริ่ม Backend ก่อน:');
    console.log('   cd API-FinalProJect && npm start');
    return;
  }

  await testBackendDirectly();
  await inspectFormData();
  await testWithRawFetch();
  await testWithBrowserLikeFetch();

  console.log('\n🏁 Debug เสร็จสิ้น');
  console.log('='.repeat(50));
  console.log('💡 หาก test ด้วย axios สำเร็จแต่ Frontend ล้มเหลว');
  console.log('   ปัญหาอยู่ที่การตั้ง headers ใน Frontend');
}

main().catch(console.error);
