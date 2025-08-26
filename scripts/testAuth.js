// ======================================================================
// สคริปต์สำหรับทดสอบการเข้าสู่ระบบและสร้าง token
// ใช้งาน: node scripts/testAuth.js
// ======================================================================

const axios = require('axios');

// ข้อมูลการเชื่อมต่อ API
const API_BASE_URL = 'http://localhost:5000/api';

// ข้อมูลผู้ใช้สำหรับทดสอบ
const testUsers = [
  {
    email: 'somchai.jaidee@gmail.com',
    password: 'zzpp1234',
    role: 'user'
  },
  {
    email: 'montri.borihan@gmail.com',
    password: 'zzpp1234',
    role: 'manager'
  },
  {
    email: 'wichai.phuchiacharn@gmail.com',
    password: 'zzpp1234',
    role: 'expert'
  }
];

// ฟังก์ชันทดสอบการเข้าสู่ระบบ
async function testSignIn(email, password) {
  try {
    console.log(`🔐 ทดสอบการเข้าสู่ระบบ: ${email}`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email,
      password
    });

    if (response.data.success) {
      console.log(`✅ เข้าสู่ระบบสำเร็จ: ${email}`);
      console.log(`   Token: ${response.data.token.substring(0, 50)}...`);
      console.log(`   Role: ${response.data.profile.role}`);
      console.log(`   Name: ${response.data.profile.first_name} ${response.data.profile.last_name}`);
      
      return {
        success: true,
        token: response.data.token,
        profile: response.data.profile
      };
    } else {
      console.log(`❌ เข้าสู่ระบบไม่สำเร็จ: ${email}`);
      return { success: false };
    }
  } catch (error) {
    console.error(`❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${email}`);
    console.error(`   ข้อผิดพลาด: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

// ฟังก์ชันทดสอบ API endpoints
async function testApiEndpoints(token, role) {
  console.log(`\n🧪 ทดสอบ API endpoints สำหรับ role: ${role}`);
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const endpoints = [
    { name: 'Profile', url: '/auth/profile', method: 'GET' },
    { name: 'Health', url: '/health', method: 'GET' }
  ];

  // เพิ่ม endpoints ตาม role
  if (role === 'user') {
    endpoints.push(
      { name: 'User Dashboard', url: '/users/dashboard', method: 'GET' },
      { name: 'User Contests', url: '/users/contests', method: 'GET' }
    );
  } else if (role === 'manager') {
    endpoints.push(
      { name: 'Manager Dashboard', url: '/manager/dashboard', method: 'GET' },
      { name: 'Manager Contests', url: '/manager/contests', method: 'GET' }
    );
  } else if (role === 'expert') {
    endpoints.push(
      { name: 'Expert Dashboard', url: '/experts/dashboard', method: 'GET' },
      { name: 'Expert Queue', url: '/experts/queue', method: 'GET' },
      { name: 'Expert Specialities', url: '/experts/specialities', method: 'GET' }
    );
  }

  for (const endpoint of endpoints) {
    try {
      console.log(`   📡 ทดสอบ ${endpoint.name}...`);
      
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE_URL}${endpoint.url}`,
        headers
      });

      if (response.data.success) {
        console.log(`   ✅ ${endpoint.name}: สำเร็จ`);
      } else {
        console.log(`   ⚠️  ${endpoint.name}: ไม่สำเร็จ - ${response.data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: เกิดข้อผิดพลาด - ${error.response?.status} ${error.response?.data?.error || error.message}`);
    }
  }
}

// ฟังก์ชันทดสอบ submissions endpoint
async function testSubmissionsEndpoint(token) {
  console.log(`\n📋 ทดสอบ Submissions endpoint`);
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log(`   📡 ทดสอบ GET /submissions...`);
    
    const response = await axios.get(`${API_BASE_URL}/submissions`, { headers });

    if (response.data.success) {
      console.log(`   ✅ Submissions: สำเร็จ`);
      console.log(`   📊 จำนวน submissions: ${response.data.data?.length || 0}`);
    } else {
      console.log(`   ⚠️  Submissions: ไม่สำเร็จ - ${response.data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Submissions: เกิดข้อผิดพลาด - ${error.response?.status} ${error.response?.data?.error || error.message}`);
  }
}

// ฟังก์ชันหลัก
async function main() {
  console.log('🚀 เริ่มทดสอบการเข้าสู่ระบบและ API endpoints...\n');

  for (const user of testUsers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`👤 ทดสอบผู้ใช้: ${user.email} (${user.role})`);
    console.log(`${'='.repeat(60)}`);

    const signInResult = await testSignIn(user.email, user.password);
    
    if (signInResult.success) {
      // ทดสอบ API endpoints
      await testApiEndpoints(signInResult.token, user.role);
      
      // ทดสอบ submissions endpoint
      await testSubmissionsEndpoint(signInResult.token);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 เสร็จสิ้นการทดสอบ!');
  console.log(`${'='.repeat(60)}`);
}

// ตรวจสอบการตั้งค่า
function checkConfiguration() {
  console.log('🔧 ตรวจสอบการตั้งค่า...');
  
  if (!API_BASE_URL || API_BASE_URL === 'http://localhost:5000/api') {
    console.log('⚠️  ตรวจสอบ API_BASE_URL ว่าถูกต้อง');
  }

  console.log('✅ การตั้งค่าเรียบร้อย\n');
  return true;
}

// เริ่มต้นโปรแกรม
async function run() {
  try {
    if (!checkConfiguration()) {
      return;
    }

    await main();
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการรันสคริปต์:', error.message);
  }
}

// รันสคริปต์
if (require.main === module) {
  run();
}

module.exports = { 
  testSignIn, 
  testApiEndpoints, 
  testSubmissionsEndpoint 
}; 