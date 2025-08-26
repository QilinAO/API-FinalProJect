const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:5000/api';
const MODEL_API_URL = 'http://localhost:8000';

// ข้อมูลผู้ใช้สำหรับทดสอบ
const testUsers = [
  { email: 'somchai.jaidee@gmail.com', password: 'zzpp1234', role: 'user' },
  { email: 'montri.borihan@gmail.com', password: 'zzpp1234', role: 'manager' },
  { email: 'wichai.phuchiacharn@gmail.com', password: 'zzpp1234', role: 'expert' }
];

// ฟังก์ชันทดสอบการเชื่อมต่อ API
async function testApiConnection() {
  console.log('🔌 ทดสอบการเชื่อมต่อ API...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ API Server เชื่อมต่อได้');
    return true;
  } catch (error) {
    console.log('❌ API Server ไม่สามารถเชื่อมต่อได้');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// ฟังก์ชันทดสอบการเชื่อมต่อ Model API
async function testModelApiConnection() {
  console.log('\n🤖 ทดสอบการเชื่อมต่อ Model API...');
  
  try {
    const response = await axios.get(`${MODEL_API_URL}/`, { timeout: 5000 });
    console.log('✅ Model API เชื่อมต่อได้');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Device: ${response.data.device}`);
    return true;
  } catch (error) {
    console.log('❌ Model API ไม่สามารถเชื่อมต่อได้');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// ฟังก์ชันทดสอบการเข้าสู่ระบบ
async function testAuthentication() {
  console.log('\n🔐 ทดสอบการเข้าสู่ระบบ...');
  
  const results = [];
  
  for (const user of testUsers) {
    try {
      console.log(`   📡 ทดสอบ: ${user.email}`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
        email: user.email,
        password: user.password
      });

      if (response.data.success) {
        console.log(`   ✅ สำเร็จ: ${user.email} (${user.role})`);
        results.push({
          user: user.email,
          role: user.role,
          success: true,
          token: response.data.token
        });
      } else {
        console.log(`   ❌ ไม่สำเร็จ: ${user.email}`);
        results.push({
          user: user.email,
          role: user.role,
          success: false,
          error: response.data.error
        });
      }
    } catch (error) {
      console.log(`   ❌ เกิดข้อผิดพลาด: ${user.email}`);
      console.log(`      Error: ${error.response?.data?.error || error.message}`);
      results.push({
        user: user.email,
        role: user.role,
        success: false,
        error: error.response?.data?.error || error.message
      });
    }
  }
  
  return results;
}

// ฟังก์ชันทดสอบ API Endpoints
async function testApiEndpoints(authResults) {
  console.log('\n🌐 ทดสอบ API Endpoints...');
  
  const endpoints = [
    // Public endpoints
    { name: 'Health Check', url: '/health', method: 'GET', auth: false },
    { name: 'Public Contests', url: '/public/contests', method: 'GET', auth: false },
    
    // User endpoints
    { name: 'User Dashboard', url: '/users/dashboard', method: 'GET', auth: true, role: 'user' },
    { name: 'User Contests', url: '/users/contests', method: 'GET', auth: true, role: 'user' },
    { name: 'User History', url: '/users/history/evaluations', method: 'GET', auth: true, role: 'user' },
    
    // Manager endpoints
    { name: 'Manager Dashboard', url: '/manager/dashboard', method: 'GET', auth: true, role: 'manager' },
    { name: 'Manager Contests', url: '/manager/contests', method: 'GET', auth: true, role: 'manager' },
    
    // Expert endpoints
    { name: 'Expert Dashboard', url: '/experts/dashboard', method: 'GET', auth: true, role: 'expert' },
    { name: 'Expert Queue', url: '/experts/queue', method: 'GET', auth: true, role: 'expert' },
    { name: 'Expert History', url: '/experts/history', method: 'GET', auth: true, role: 'expert' },
    { name: 'Expert Specialities', url: '/experts/specialities', method: 'GET', auth: true, role: 'expert' },
    
    // Submission endpoints
    { name: 'Submissions', url: '/submissions', method: 'GET', auth: true, role: 'user' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`   📡 ทดสอบ: ${endpoint.name}`);
      
      let headers = { 'Content-Type': 'application/json' };
      let url = `${API_BASE_URL}${endpoint.url}`;
      
      if (endpoint.auth) {
        const user = authResults.find(r => r.success && r.role === endpoint.role);
        if (!user) {
          console.log(`   ⚠️  ข้าม: ไม่มี token สำหรับ ${endpoint.role}`);
          continue;
        }
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      const response = await axios({
        method: endpoint.method,
        url: url,
        headers: headers,
        timeout: 10000
      });
      
      if (response.data.success !== false) {
        console.log(`   ✅ สำเร็จ: ${endpoint.name}`);
      } else {
        console.log(`   ⚠️  ไม่สำเร็จ: ${endpoint.name} - ${response.data.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ เกิดข้อผิดพลาด: ${endpoint.name}`);
      console.log(`      Status: ${error.response?.status}`);
      console.log(`      Error: ${error.response?.data?.error || error.message}`);
    }
  }
}

// ฟังก์ชันทดสอบ Database
async function testDatabase() {
  console.log('\n🗄️ ทดสอบ Database...');
  
  try {
    // ทดสอบโดยการดึงข้อมูลผู้ใช้
    const response = await axios.get(`${API_BASE_URL}/admin/users`, {
      headers: {
        'Authorization': 'Bearer admin-token-placeholder',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Database เชื่อมต่อได้');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Database เชื่อมต่อได้ (แต่ไม่มี admin token)');
    } else {
      console.log('❌ Database มีปัญหา');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }
  }
}

// ฟังก์ชันทดสอบ File Upload
async function testFileUpload(authResults) {
  console.log('\n📁 ทดสอบ File Upload...');
  
  const user = authResults.find(r => r.success && r.role === 'user');
  if (!user) {
    console.log('   ⚠️  ข้าม: ไม่มี user token');
    return;
  }
  
  try {
    // สร้าง mock image
    const mockImageBuffer = Buffer.from('fake image data for testing');
    const formData = new FormData();
    formData.append('fish_name', 'ปลาทดสอบ');
    formData.append('fish_type', 'A');
    formData.append('fish_description', 'ทดสอบการอัปโหลด');
    formData.append('images', mockImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });
    
    const response = await axios.post(`${API_BASE_URL}/submissions`, formData, {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        ...formData.getHeaders()
      },
      timeout: 30000
    });
    
    console.log('✅ File Upload สำเร็จ');
  } catch (error) {
    console.log('❌ File Upload มีปัญหา');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
  }
}

// ฟังก์ชันหลัก
async function main() {
  console.log('🔍 เริ่มตรวจสอบ Error ทั้งหมดในระบบ...\n');
  
  // 1. ทดสอบการเชื่อมต่อ API
  const apiConnected = await testApiConnection();
  
  // 2. ทดสอบการเชื่อมต่อ Model API
  const modelApiConnected = await testModelApiConnection();
  
  // 3. ทดสอบการเข้าสู่ระบบ
  const authResults = await testAuthentication();
  
  // 4. ทดสอบ API Endpoints
  if (apiConnected) {
    await testApiEndpoints(authResults);
  }
  
  // 5. ทดสอบ Database
  if (apiConnected) {
    await testDatabase();
  }
  
  // 6. ทดสอบ File Upload
  if (apiConnected) {
    await testFileUpload(authResults);
  }
  
  // สรุปผล
  console.log('\n📊 สรุปผลการตรวจสอบ:');
  console.log(`   API Server: ${apiConnected ? '✅' : '❌'}`);
  console.log(`   Model API: ${modelApiConnected ? '✅' : '❌'}`);
  console.log(`   Authentication: ${authResults.filter(r => r.success).length}/${authResults.length} สำเร็จ`);
  
  if (!apiConnected) {
    console.log('\n💡 แนะนำ: ตรวจสอบว่า API Server กำลังทำงานที่ port 5000');
    console.log('   รันคำสั่ง: cd .. && npm start');
  }
  
  if (!modelApiConnected) {
    console.log('\n💡 แนะนำ: ตรวจสอบว่า Model API กำลังทำงานที่ port 8000');
    console.log('   รันคำสั่ง: cd ../../../web-infer && source venv/bin/activate && python app.py');
  }
  
  console.log('\n✅ การตรวจสอบเสร็จสิ้น');
}

main().catch(console.error); 