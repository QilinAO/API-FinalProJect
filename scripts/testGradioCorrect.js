const axios = require('axios');
const fs = require('fs');

// HuggingFace Space URL และ API endpoint
const SPACE_URL = 'https://qilinao-betta-ts-space.hf.space';
const GRADIO_API_URL = `${SPACE_URL}/gradio_api/call/predict`;

async function testGradioCorrect() {
  console.log('🧪 ทดสอบ HuggingFace Space ด้วย Gradio API ที่ถูกต้อง...\n');
  
  try {
    const testImagePath = './test_betta_fish.jpg';
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ ไม่พบไฟล์รูปภาพทดสอบ:', testImagePath);
      return;
    }

    console.log('📡 ส่งรูปภาพไปยัง Gradio API...');
    
    // อ่านรูปภาพและแปลงเป็น base64
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    // สร้าง session hash
    const sessionHash = Math.random().toString(36).substring(2);
    
    // Gradio API call format (จาก config ที่ได้)
    const requestData = {
      data: [
        {
          path: null,
          url: base64Image,
          size: imageBuffer.length,
          orig_name: "test_betta_fish.jpg",
          mime_type: "image/jpeg",
          is_stream: false,
          meta: { _type: "gradio.FileData" }
        }
      ],
      event_data: null,
      fn_index: 2, // จาก dependencies ที่มี api_name: "predict"
      trigger_id: 12, // component ID ของปุ่ม Submit
      session_hash: sessionHash
    };
    
    console.log('📤 กำลังส่งข้อมูลไปยัง Gradio...');
    console.log('   Session Hash:', sessionHash);
    console.log('   Image Size:', imageBuffer.length, 'bytes');
    
    const response = await axios.post(GRADIO_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      timeout: 60000
    });

    console.log('✅ ได้รับ response จาก Gradio!');
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', response.data);
    
    // ถ้า response เป็น event stream, อาจต้องรอผลลัพธ์
    if (typeof response.data === 'string') {
      console.log('\n📡 กำลังรอผลลัพธ์จาก model...');
      
      // ลองดึงผลลัพธ์จาก event stream
      const lines = response.data.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.msg === 'process_completed') {
              console.log('🎉 Model ประมวลผลเสร็จแล้ว!');
              console.log('📊 ผลลัพธ์:', JSON.stringify(data.output?.data, null, 2));
              
              if (data.output?.data) {
                analyzeResult(data.output.data);
              }
              break;
            }
          } catch (e) {
            // ไม่ใช่ JSON ข้ามไป
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    
    if (error.response) {
      console.error('📄 Response Status:', error.response.status);
      console.error('📄 Response Headers:', error.response.headers);
      console.error('📄 Response Data:', error.response.data);
    }
  }
}

// วิเคราะห์ผลลัพธ์
function analyzeResult(resultData) {
  console.log('\n🔍 วิเคราะห์ผลลัพธ์:');
  
  if (Array.isArray(resultData) && resultData.length >= 2) {
    const prediction = resultData[0]; // ผลทำนาย
    const probabilities = resultData[1]; // ความน่าจะเป็น
    
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
      console.log(`\n🎯 Top Prediction: ${topEntry[0]} (${(topEntry[1] * 100).toFixed(2)}%)`);
      
      // แปลงเป็นรูปแบบที่ใช้ในระบบ
      const bettaType = extractBettaTypeFromLabel(topEntry[0]);
      console.log(`🐠 Betta Type: ${bettaType}`);
    }
  }
}

// ฟังก์ชันแยกประเภทปลากัด
function extractBettaTypeFromLabel(label) {
  // สำหรับโมเดลนี้ที่จำแนก isaan / mahachai / south
  const mapping = {
    'isaan': 'A',
    'mahachai': 'B', 
    'south': 'C'
  };
  
  const lowerLabel = label.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (lowerLabel.includes(key)) {
      return value;
    }
  }
  
  return 'UNKNOWN';
}

// รันการทดสอบ
testGradioCorrect().catch(console.error);
