const axios = require('axios');
const fs = require('fs');

async function debugGradioResponse() {
  console.log('🔍 Debug Gradio Response Format...\n');
  
  try {
    const testImagePath = './test_betta_fish.jpg';
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ ไม่พบไฟล์รูปภาพทดสอบ');
      return;
    }

    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    const sessionHash = Math.random().toString(36).substring(2);
    
    const requestData = {
      data: [
        {
          path: null,
          url: base64Image,
          size: imageBuffer.length,
          orig_name: "betta_image.jpg",
          mime_type: "image/jpeg",
          is_stream: false,
          meta: { _type: "gradio.FileData" }
        }
      ],
      event_data: null,
      fn_index: 2,
      trigger_id: 12,
      session_hash: sessionHash
    };

    console.log('📡 ส่ง request ไปยัง Gradio API...');
    
    const response = await axios.post(
      'https://qilinao-betta-ts-space.hf.space/gradio_api/call/predict',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        timeout: 60000
      }
    );

    console.log('✅ ได้รับ response!');
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', response.headers);
    console.log('📊 Response Type:', typeof response.data);
    
    if (typeof response.data === 'string') {
      console.log('\n📄 Raw Response Data:');
      console.log('='.repeat(50));
      console.log(response.data);
      console.log('='.repeat(50));
      
      console.log('\n🔍 Parsing Event Stream...');
      const lines = response.data.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log(`Line ${i}: "${line}"`);
        
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6);
            const data = JSON.parse(jsonStr);
            console.log(`   ✅ Parsed JSON:`, JSON.stringify(data, null, 2));
            
            if (data.msg === 'process_completed') {
              console.log('   🎉 Found process_completed!');
              if (data.output?.data) {
                console.log('   📊 Output Data:', JSON.stringify(data.output.data, null, 2));
              }
            }
          } catch (e) {
            console.log(`   ❌ JSON Parse Error: ${e.message}`);
            console.log(`   📄 Raw JSON String: "${jsonStr}"`);
          }
        }
      }
    } else {
      console.log('\n📊 Response Data (not string):');
      console.log(JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.error('📄 Error Response Status:', error.response.status);
      console.error('📄 Error Response Data:', error.response.data);
    }
  }
}

debugGradioResponse().catch(console.error);
