// ======================================================================
// สคริปต์สำหรับสร้างผู้ใช้แบบสุ่ม 50 คนในระบบ
// ใช้งาน: node scripts/createRandomUsers.js
// ======================================================================

const axios = require('axios');

// ข้อมูลการเชื่อมต่อ API
const API_BASE_URL = 'http://localhost:3001/api'; // แก้ไขตาม URL ของ API ของคุณ
const ADMIN_TOKEN = 'your-admin-token-here'; // แก้ไขเป็น Admin token ของคุณ

// ข้อมูลสำหรับสร้างผู้ใช้แบบสุ่ม
const thaiFirstNames = [
  'สมชาย', 'สมหญิง', 'ประยุทธ', 'นารี', 'วิศวะ', 'กัลยา', 'ธนวัฒน์', 'รัตนา', 'สุทธิพงษ์', 'ปิยะดา',
  'อภิชาติ', 'ศิริพร', 'ชัยวัฒน์', 'รัชนี', 'ธีระ', 'นภา', 'สมศักดิ์', 'กมลชนก', 'ธนากร', 'ปิยะมาศ',
  'มนตรี', 'รัตนา', 'ชัยวัฒน์', 'กัลยา', 'อภิชาติ', 'ศิริพร', 'ธีระ', 'นภา', 'สมศักดิ์', 'กมลชนก',
  'วิชัย', 'รัตนา', 'ชัยวัฒน์', 'กัลยา', 'อภิชาติ', 'ศิริพร', 'ธีระ', 'นภา', 'สมศักดิ์', 'กมลชนก',
  'สุชาติ', 'มณี', 'ประสาท', 'กมลา', 'วิเชียร', 'รัศมี', 'ชัยพร', 'นงลักษณ์', 'สมพงษ์', 'ปิยะ'
];

const thaiLastNames = [
  'ใจดี', 'รักดี', 'สุขใจ', 'ศรีสุข', 'ชาญวิทย์', 'มณีวงศ์', 'ทองสุข', 'แสงทอง', 'ใจเย็น', 'สุขสันต์',
  'รุ่งโรจน์', 'วัฒนา', 'มงคล', 'ศรีสุข', 'ใจดี', 'ทองสุข', 'รุ่งเรือง', 'ศรีสุข', 'ใจเย็น', 'สุขสันต์',
  'บริหาร', 'จัดการ', 'ควบคุม', 'จัดการ', 'บริหาร', 'จัดการ', 'ควบคุม', 'บริหาร', 'จัดการ', 'ควบคุม',
  'ผู้เชี่ยวชาญ', 'ผู้เชี่ยวชาญ', 'ผู้เชี่ยวชาญ', 'ผู้เชี่ยวชาญ', 'ผู้เชี่ยวชาญ', 'ผู้เชี่ยวชาญ', 'ผู้เชี่ยวชาญ', 'ผู้เชี่ยวชาญ', 'ผู้เชี่ยวชาญ', 'ผู้เชี่ยวชาญ',
  'ทองคำ', 'ศรีทอง', 'ใจเย็น', 'สุขใจ', 'รักดี', 'มณี', 'ประสาท', 'กมลา', 'วิเชียร', 'รัศมี'
];

const englishUsernames = [
  'somchai', 'somying', 'prayut', 'naree', 'wisawa', 'kanlaya', 'thanawat', 'rattana', 'sutthipong', 'piyada',
  'apichart', 'siriporn', 'chaiwat', 'rachanee', 'theera', 'napa', 'somsak', 'kamolchanok', 'thanakorn', 'piyamart',
  'montri', 'rattana2', 'chaiwat2', 'kanlaya2', 'apichart2', 'siriporn2', 'theera2', 'napa2', 'somsak2', 'kamolchanok2',
  'wichai', 'rattana3', 'chaiwat3', 'kanlaya3', 'apichart3', 'siriporn3', 'theera3', 'napa3', 'somsak3', 'kamolchanok3',
  'suchart', 'manee', 'prasat', 'kamla', 'wichien', 'ratsamee', 'chaiporn', 'nonglak', 'sompong', 'piya'
];

const emailDomains = [
  'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'
];

const emailPrefixes = [
  'user', 'member', 'client', 'customer', 'betta', 'fish', 'aquarium', 'pet', 'lover', 'enthusiast',
  'manager', 'admin', 'supervisor', 'coordinator', 'director', 'chief', 'head', 'lead', 'senior', 'junior',
  'expert', 'specialist', 'consultant', 'advisor', 'professional', 'master', 'guru', 'wizard', 'ninja', 'hero'
];

// ฟังก์ชันสุ่มเลือกจากอาร์เรย์
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ฟังก์ชันสร้างอีเมลแบบสุ่ม
function generateRandomEmail() {
  const prefix = getRandomElement(emailPrefixes);
  const domain = getRandomElement(emailDomains);
  const randomNum = Math.floor(Math.random() * 9999);
  return `${prefix}${randomNum}@${domain}`;
}

// ฟังก์ชันสร้างข้อมูลผู้ใช้แบบสุ่ม
function generateRandomUser(index, role) {
  const firstName = getRandomElement(thaiFirstNames);
  const lastName = getRandomElement(thaiLastNames);
  const username = getRandomElement(englishUsernames) + index;
  const email = generateRandomEmail();
  
  return {
    firstName,
    lastName,
    username,
    email,
    role
  };
}

// ฟังก์ชันสร้างผู้ใช้ทั้งหมด
function generateAllUsers() {
  const users = [];
  
  // User 20 คน
  for (let i = 0; i < 20; i++) {
    users.push(generateRandomUser(i + 1, 'user'));
  }
  
  // Manager 10 คน
  for (let i = 0; i < 10; i++) {
    users.push(generateRandomUser(i + 21, 'manager'));
  }
  
  // Expert 20 คน
  for (let i = 0; i < 20; i++) {
    users.push(generateRandomUser(i + 31, 'expert'));
  }
  
  return users;
}

// รหัสผ่านสำหรับทุกบัญชี
const PASSWORD = 'zzpp1234';

// ฟังก์ชันสร้างผู้ใช้
async function createUser(userData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/users`, {
      ...userData,
      password: PASSWORD
    }, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ สร้างผู้ใช้สำเร็จ: ${userData.firstName} ${userData.lastName} (${userData.role}) - ${userData.email}`);
    return { success: true, user: response.data.data };
  } catch (error) {
    console.error(`❌ สร้างผู้ใช้ไม่สำเร็จ: ${userData.firstName} ${userData.lastName} - ${userData.email}`);
    console.error(`   ข้อผิดพลาด: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

// ฟังก์ชันหลัก
async function createAllUsers() {
  console.log('🚀 เริ่มสร้างผู้ใช้แบบสุ่ม 50 คน...\n');

  const usersData = generateAllUsers();
  
  console.log('📋 รายชื่อผู้ใช้ที่จะสร้าง:');
  usersData.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`);
  });
  console.log('');

  const results = {
    success: 0,
    failed: 0,
    details: []
  };

  // สร้างผู้ใช้ทีละคน
  for (let i = 0; i < usersData.length; i++) {
    const userData = usersData[i];
    console.log(`📝 สร้างผู้ใช้ที่ ${i + 1}/${usersData.length}: ${userData.firstName} ${userData.lastName}`);
    
    const result = await createUser(userData);
    results.details.push({
      user: userData,
      result: result
    });

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }

    // รอ 1 วินาทีระหว่างการสร้างแต่ละคนเพื่อไม่ให้ API รับภาระมากเกินไป
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // แสดงผลสรุป
  console.log('\n📊 ผลสรุปการสร้างผู้ใช้:');
  console.log(`✅ สร้างสำเร็จ: ${results.success} คน`);
  console.log(`❌ สร้างไม่สำเร็จ: ${results.failed} คน`);
  console.log(`📈 อัตราความสำเร็จ: ${((results.success / usersData.length) * 100).toFixed(2)}%`);

  // แสดงรายละเอียดผู้ใช้ที่สร้างไม่สำเร็จ
  if (results.failed > 0) {
    console.log('\n❌ ผู้ใช้ที่สร้างไม่สำเร็จ:');
    results.details.forEach((detail, index) => {
      if (!detail.result.success) {
        console.log(`   ${index + 1}. ${detail.user.firstName} ${detail.user.lastName} - ${detail.user.email}`);
      }
    });
  }

  // แสดงสถิติตาม Role
  const roleStats = usersData.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  console.log('\n👥 สถิติตาม Role:');
  Object.entries(roleStats).forEach(([role, count]) => {
    console.log(`   ${role}: ${count} คน`);
  });

  // บันทึกข้อมูลผู้ใช้ที่สร้างสำเร็จลงไฟล์
  const successfulUsers = results.details
    .filter(detail => detail.result.success)
    .map(detail => ({
      ...detail.user,
      password: PASSWORD
    }));

  console.log('\n💾 ข้อมูลผู้ใช้ที่สร้างสำเร็จ:');
  successfulUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.email} - ${user.username} - ${user.password}`);
  });
}

// ตรวจสอบการตั้งค่า
function checkConfiguration() {
  console.log('🔧 ตรวจสอบการตั้งค่า...');
  
  if (!ADMIN_TOKEN || ADMIN_TOKEN === 'your-admin-token-here') {
    console.error('❌ กรุณาตั้งค่า ADMIN_TOKEN ในไฟล์สคริปต์');
    console.log('📝 วิธีการ:');
    console.log('   1. เข้าสู่ระบบด้วย Admin account');
    console.log('   2. คัดลอก token จาก localStorage หรือ response');
    console.log('   3. แก้ไขค่า ADMIN_TOKEN ในไฟล์นี้');
    return false;
  }

  if (!API_BASE_URL || API_BASE_URL === 'http://localhost:3001/api') {
    console.log('⚠️  ตรวจสอบ API_BASE_URL ว่าถูกต้อง');
  }

  console.log('✅ การตั้งค่าเรียบร้อย\n');
  return true;
}

// เริ่มต้นโปรแกรม
async function main() {
  try {
    if (!checkConfiguration()) {
      return;
    }

    await createAllUsers();
    
    console.log('\n🎉 เสร็จสิ้นการสร้างผู้ใช้!');
    console.log('📝 หมายเหตุ: ผู้ใช้ทั้งหมดจะสามารถเข้าสู่ระบบด้วยรหัสผ่าน: zzpp1234');
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการรันสคริปต์:', error.message);
  }
}

// รันสคริปต์
if (require.main === module) {
  main();
}

module.exports = { createAllUsers, createUser, generateAllUsers }; 