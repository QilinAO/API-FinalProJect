const axios = require('axios');
const fs = require('fs');

async function testSimpleGradioAPI() {
  console.log('🧪 ทดสอบ Gradio API แบบง่าย...\n');
  
  try {
    const testImagePath = './test_betta_fish.jpg';
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ ไม่พบไฟล์รูปภาพทดสอบ');
      return;
    }

    console.log('📡 กำลังส่งรูปภาพ...');
    
    // ลองใช้ FormData แทน
    const FormData = require('form-data');
    const formData = new FormData();
    
    // อ่านไฟล์และเพิ่มลง FormData
    const imageStream = fs.createReadStream(testImagePath);
    formData.append('data', JSON.stringify([null])); // input สำหรับ Gradio
    formData.append('files', imageStream, 'betta.jpg');
    
    // ลอง endpoint อื่น
    const endpoints = [
      '/gradio_api/run/predict',
      '/api/predict', 
      '/run/predict',
      '/predict'
    ];
    
    const baseUrl = 'https://qilinao-betta-ts-space.hf.space';
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 ทดสอบ endpoint: ${endpoint}`);
        
        const response = await axios.post(`${baseUrl}${endpoint}`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000
        });
        
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));
        
        // ถ้าได้ผลลัพธ์ให้หยุด
        if (response.data && response.status === 200) {
          console.log('\n🎉 พบ endpoint ที่ใช้งานได้!');
          
          // ลองแปลงผลลัพธ์
          if (Array.isArray(response.data) && response.data.length >= 2) {
            const prediction = response.data[0];
            const probabilities = response.data[1];
            
            console.log('\n🔍 วิเคราะห์ผลลัพธ์:');
            console.log('🏆 Prediction:', prediction);
            
            if (probabilities && typeof probabilities === 'object') {
              console.log('📈 Probabilities:');
              Object.entries(probabilities).forEach(([label, prob]) => {
                console.log(`   ${label}: ${(prob * 100).toFixed(2)}%`);
              });
              
              // หา top prediction
              const topEntry = Object.entries(probabilities).reduce((a, b) => 
                a[1] > b[1] ? a : b
              );
              
              console.log(`\n🎯 Top: ${topEntry[0]} (${(topEntry[1] * 100).toFixed(2)}%)`);
              
              // แปลงเป็น betta type
              const bettaType = extractBettaType(topEntry[0]);
              console.log(`🐠 Betta Type: ${bettaType}`);
            }
          }
          
          return; // สำเร็จแล้ว ออกจาก loop
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.response?.status || error.message}`);
      }
    }
    
    console.log('\n⚠️ ไม่พบ endpoint ที่ใช้งานได้');
    
    // ลองดู Space ว่ามี API อะไรบ้าง
    console.log('\n🔍 ตรวจสอบ Space info...');
    try {
      const infoResponse = await axios.get(`${baseUrl}/info`, { timeout: 10000 });
      console.log('📊 Space Info:', JSON.stringify(infoResponse.data, null, 2));
    } catch (e) {
      console.log('❌ ไม่สามารถดึง Space info ได้');
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

function extractBettaType(label) {
  const regionMapping = {
    'isaan': 'A',
    'mahachai': 'B', 
    'south': 'C'
  };
  
  const lowerLabel = label.toLowerCase();
  for (const [region, type] of Object.entries(regionMapping)) {
    if (lowerLabel.includes(region)) {
      return type;
    }
  }
  
  return 'UNKNOWN';
}

testSimpleGradioAPI().catch(console.error);
