#!/usr/bin/env node

/**
 * ทดสอบการทำงานแบบครบวงจรของระบบ HuggingFace AI Integration
 * รวมทั้ง Frontend และ Backend scenarios
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:19003';
const TEST_IMAGE_PATH = path.join(__dirname, 'test_betta_fish.jpg');

console.log('🧪 ทดสอบการ Integration แบบครบวงจร');
console.log('🎯 เลียนแบบการใช้งานจริงของ Frontend');
console.log('='.repeat(60));

// ข้อมูลทดสอบ
const testScenarios = [
  {
    name: 'BettaEvaluationForm Auto-Analysis',
    description: 'เลียนแบบการวิเคราะห์อัตโนมัติใน BettaEvaluationForm',
    formData: {
      betta_type: 'AUTO',
      analysis_type: 'quality'
    }
  },
  {
    name: 'SubmissionFormModal Competition Check',
    description: 'เลียนแบบการตรวจสอบใน SubmissionFormModal สำหรับการประกวด',
    formData: {
      betta_type: 'D',
      analysis_type: 'competition',
      betta_age_months: '8'
    }
  }
];

async function testModelHealth() {
  console.log('\n📡 1. ทดสอบ Model Health Check');
  console.log('-'.repeat(40));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/model/health`, {
      timeout: 10000
    });
    
    console.log('✅ Health Check สำเร็จ:');
    console.log(`   Service: ${response.data.data?.service}`);
    console.log(`   Available: ${response.data.data?.available}`);
    console.log(`   Status: ${response.data.data?.status}`);
    
    return response.data.data?.available === true;
  } catch (error) {
    console.log('❌ Health Check ล้มเหลว:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testScenario(scenario) {
  console.log(`\n🎬 ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log('-'.repeat(40));
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('⚠️ ไม่พบไฟล์รูปภาพทดสอบ - ข้าม scenario นี้');
    return false;
  }
  
  try {
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    console.log(`📏 ขนาดรูปภาพ: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test_betta.jpg',
      contentType: 'image/jpeg'
    });
    
    // เพิ่มข้อมูลฟอร์มตาม scenario
    Object.entries(scenario.formData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    console.log('📤 ส่งข้อมูลไปยัง Backend...');
    const startTime = Date.now();
    
    const response = await axios.post(`${API_BASE_URL}/model/analyze-single`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000 // 60 วินาที
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️  Response Time: ${responseTime}ms`);
    
    if (response.data.success) {
      console.log('✅ การวิเคราะห์สำเร็จ:');
      
      const analysisData = response.data.data;
      const finalLabel = analysisData.final_label;
      const top1 = analysisData.top1;
      
      // ตรวจสอบข้อมูลที่ Frontend ต้องการ
      console.log(`   🏆 ประเภทปลากัด: ${finalLabel.code} (${finalLabel.name})`);
      console.log(`   📈 ความมั่นใจ: ${(top1.prob * 100).toFixed(2)}%`);
      console.log(`   🤖 AI มั่นใจ: ${analysisData.is_confident ? 'ใช่' : 'ไม่'}`);
      console.log(`   💭 เหตุผล: ${finalLabel.reason}`);
      
      // ตรวจสอบโครงสร้างข้อมูลที่ Frontend คาดหวัง
      const requiredFields = ['final_label', 'top1', 'is_confident', 'topk'];
      const missingFields = requiredFields.filter(field => !analysisData[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ โครงสร้างข้อมูลครบถ้วนตามที่ Frontend ต้องการ');
        
        // ตรวจสอบ topk array
        if (Array.isArray(analysisData.topk) && analysisData.topk.length > 0) {
          console.log('✅ TopK Results มีข้อมูลครบถ้วน:');
          analysisData.topk.slice(0, 3).forEach((item, index) => {
            console.log(`      ${index + 1}. ${item.name} (${item.code}): ${(item.score * 100).toFixed(2)}%`);
          });
        }
        
        return true;
      } else {
        console.log(`❌ ข้อมูลไม่ครบถ้วน - ขาดฟิลด์: ${missingFields.join(', ')}`);
        return false;
      }
    } else {
      console.log('❌ การวิเคราะห์ล้มเหลว:', response.data.error);
      return false;
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || 'ไม่มี error message'}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ ไม่สามารถเชื่อมต่อกับ Backend - โปรดเริ่ม server ก่อน');
    } else {
      console.log('❌ Network Error:', error.message);
    }
    return false;
  }
}

async function testFrontendCompatibility() {
  console.log('\n🎨 3. ทดสอบความเข้ากันได้กับ Frontend Components');
  console.log('-'.repeat(40));
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('⚠️ ไม่พบไฟล์รูปภาพทดสอบ');
    return false;
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
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      
      // Test BettaEvaluationForm compatibility
      console.log('📱 BettaEvaluationForm Compatibility:');
      const bettaFormFields = {
        'data.final_label.code': data.final_label?.code,
        'data.final_label.name': data.final_label?.name,
        'data.top1.prob': data.top1?.prob,
        'data.is_confident': data.is_confident
      };
      
      Object.entries(bettaFormFields).forEach(([path, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`   ✅ ${path}: ${typeof value === 'string' ? `"${value}"` : value}`);
        } else {
          console.log(`   ❌ ${path}: missing`);
        }
      });
      
      // Test SubmissionFormModal compatibility
      console.log('\n📝 SubmissionFormModal Compatibility:');
      const submissionFields = {
        'data.final_label.code': data.final_label?.code,
        'data.final_label.name': data.final_label?.name,
        'data.topk': Array.isArray(data.topk)
      };
      
      Object.entries(submissionFields).forEach(([path, value]) => {
        if (value !== undefined && value !== null && value !== false) {
          console.log(`   ✅ ${path}: ${typeof value === 'boolean' ? value : typeof value === 'string' ? `"${value}"` : value}`);
        } else {
          console.log(`   ❌ ${path}: missing or invalid`);
        }
      });
      
      return true;
    } else {
      console.log('❌ ไม่ได้รับข้อมูลที่ถูกต้อง');
      return false;
    }
    
  } catch (error) {
    console.log('❌ ทดสอบความเข้ากันได้ล้มเหลว:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 เริ่มทดสอบการ Integration แบบครบวงจร\n');
  
  const results = [];
  
  // 1. Test Model Health
  const healthOk = await testModelHealth();
  results.push({ test: 'Model Health', success: healthOk });
  
  if (!healthOk) {
    console.log('\n⚠️ Model Health Check ล้มเหลว - ระบบอาจไม่พร้อมใช้งาน');
    console.log('💡 แนะนำ: ตรวจสอบ environment variables และ HuggingFace Space');
  }
  
  // 2. Test Scenarios
  for (const scenario of testScenarios) {
    const success = await testScenario(scenario);
    results.push({ test: scenario.name, success });
  }
  
  // 3. Test Frontend Compatibility
  const compatibilityOk = await testFrontendCompatibility();
  results.push({ test: 'Frontend Compatibility', success: compatibilityOk });
  
  // Summary
  console.log('\n📊 สรุปผลการทดสอบ');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
  });
  
  console.log('-'.repeat(60));
  console.log(`📈 ผลลัพธ์: ${successful}/${total} ทดสอบผ่าน (${((successful/total)*100).toFixed(1)}%)`);
  
  if (successful === total) {
    console.log('\n🎉 ระบบพร้อมสำหรับการ Deploy แล้ว!');
    console.log('🚀 สามารถนำขึ้น Alibaba Cloud ได้เลย');
  } else {
    console.log('\n⚠️ ยังมีปัญหาที่ต้องแก้ไข:');
    const failed = results.filter(r => !r.success);
    failed.forEach(result => {
      console.log(`   • ${result.test}`);
    });
    console.log('\n💡 แนะนำ: แก้ไขปัญหาเหล่านี้ก่อน Deploy');
  }
  
  console.log('\n🏁 การทดสอบเสร็จสิ้น');
}

main().catch(console.error);
