// ======================================================================
// สคริปต์สำหรับสร้างผู้ใช้แบบง่ายๆ โดยใช้ Supabase Admin SDK
// ใช้งาน: node scripts/createUsersSimple.js
// ======================================================================

const { createClient } = require('@supabase/supabase-js');

// ข้อมูลการเชื่อมต่อ Supabase
const SUPABASE_URL = 'https://lgnhyqwtilthhqvlgvnd.supabase.co'; // แก้ไขเป็น URL ของ Supabase ของคุณ
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnbmh5cXd0aWx0aGhxdmxndm5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMxNDQ4OCwiZXhwIjoyMDY1ODkwNDg4fQ.IccXmRcb_OaUA1tXvjmjF-V3pNdpbY7OzHmoPgbs_hE'; // แก้ไขเป็น Service Role Key ของคุณ

// สร้าง Supabase client ด้วย Service Role Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ข้อมูลผู้ใช้ที่ต้องการสร้าง
const usersData = [
  // User 20 คน
  { firstName: 'สมชาย', lastName: 'ใจดี', username: 'somchai', email: 'somchai.jaidee@gmail.com', role: 'user' },
  { firstName: 'สมหญิง', lastName: 'รักดี', username: 'somying', email: 'somying.rakdee@gmail.com', role: 'user' },
  { firstName: 'ประยุทธ', lastName: 'สุขใจ', username: 'prayut', email: 'prayut.sukjai@gmail.com', role: 'user' },
  { firstName: 'นารี', lastName: 'ศรีสุข', username: 'naree', email: 'naree.srisuk@gmail.com', role: 'user' },
  { firstName: 'วิศวะ', lastName: 'ชาญวิทย์', username: 'wisawa', email: 'wisawa.chanwit@gmail.com', role: 'user' },
  { firstName: 'กัลยา', lastName: 'มณีวงศ์', username: 'kanlaya', email: 'kanlaya.maniwong@gmail.com', role: 'user' },
  { firstName: 'ธนวัฒน์', lastName: 'ทองสุข', username: 'thanawat', email: 'thanawat.thongsuk@gmail.com', role: 'user' },
  { firstName: 'รัตนา', lastName: 'แสงทอง', username: 'rattana', email: 'rattana.saengthong@gmail.com', role: 'user' },
  { firstName: 'สุทธิพงษ์', lastName: 'ใจเย็น', username: 'sutthipong', email: 'sutthipong.jaiyen@gmail.com', role: 'user' },
  { firstName: 'ปิยะดา', lastName: 'สุขสันต์', username: 'piyada', email: 'piyada.suksan@gmail.com', role: 'user' },
  { firstName: 'อภิชาติ', lastName: 'รุ่งโรจน์', username: 'apichart', email: 'apichart.rungroj@gmail.com', role: 'user' },
  { firstName: 'ศิริพร', lastName: 'วัฒนา', username: 'siriporn', email: 'siriporn.wattana@gmail.com', role: 'user' },
  { firstName: 'ชัยวัฒน์', lastName: 'มงคล', username: 'chaiwat', email: 'chaiwat.mongkol@gmail.com', role: 'user' },
  { firstName: 'รัชนี', lastName: 'ศรีสุข', username: 'rachanee', email: 'rachanee.srisuk@gmail.com', role: 'user' },
  { firstName: 'ธีระ', lastName: 'ใจดี', username: 'theera', email: 'theera.jaidee@gmail.com', role: 'user' },
  { firstName: 'นภา', lastName: 'ทองสุข', username: 'napa', email: 'napa.thongsuk@gmail.com', role: 'user' },
  { firstName: 'สมศักดิ์', lastName: 'รุ่งเรือง', username: 'somsak', email: 'somsak.rungruang@gmail.com', role: 'user' },
  { firstName: 'กมลชนก', lastName: 'ศรีสุข', username: 'kamolchanok', email: 'kamolchanok.srisuk@gmail.com', role: 'user' },
  { firstName: 'ธนากร', lastName: 'ใจเย็น', username: 'thanakorn', email: 'thanakorn.jaiyen@gmail.com', role: 'user' },
  { firstName: 'ปิยะมาศ', lastName: 'สุขสันต์', username: 'piyamart', email: 'piyamart.suksan@gmail.com', role: 'user' },

  // Manager 10 คน
  { firstName: 'มนตรี', lastName: 'บริหาร', username: 'montri', email: 'montri.borihan@gmail.com', role: 'manager' },
  { firstName: 'รัตนา', lastName: 'จัดการ', username: 'rattana2', email: 'rattana.jakkan@gmail.com', role: 'manager' },
  { firstName: 'ชัยวัฒน์', lastName: 'ควบคุม', username: 'chaiwat2', email: 'chaiwat.khontrol@gmail.com', role: 'manager' },
  { firstName: 'กัลยา', lastName: 'จัดการ', username: 'kanlaya2', email: 'kanlaya.jakkan@gmail.com', role: 'manager' },
  { firstName: 'อภิชาติ', lastName: 'บริหาร', username: 'apichart2', email: 'apichart.borihan@gmail.com', role: 'manager' },
  { firstName: 'ศิริพร', lastName: 'จัดการ', username: 'siriporn2', email: 'siriporn.jakkan@gmail.com', role: 'manager' },
  { firstName: 'ธีระ', lastName: 'ควบคุม', username: 'theera2', email: 'theera.khontrol@gmail.com', role: 'manager' },
  { firstName: 'นภา', lastName: 'บริหาร', username: 'napa2', email: 'napa.borihan@gmail.com', role: 'manager' },
  { firstName: 'สมศักดิ์', lastName: 'จัดการ', username: 'somsak2', email: 'somsak.jakkan@gmail.com', role: 'manager' },
  { firstName: 'กมลชนก', lastName: 'ควบคุม', username: 'kamolchanok2', email: 'kamolchanok.khontrol@gmail.com', role: 'manager' },

  // Expert 20 คน
  { firstName: 'ดร.วิชัย', lastName: 'ผู้เชี่ยวชาญ', username: 'wichai', email: 'wichai.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.รัตนา', lastName: 'ผู้เชี่ยวชาญ', username: 'rattana3', email: 'rattana.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.ชัยวัฒน์', lastName: 'ผู้เชี่ยวชาญ', username: 'chaiwat3', email: 'chaiwat.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.กัลยา', lastName: 'ผู้เชี่ยวชาญ', username: 'kanlaya3', email: 'kanlaya.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.อภิชาติ', lastName: 'ผู้เชี่ยวชาญ', username: 'apichart3', email: 'apichart.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.ศิริพร', lastName: 'ผู้เชี่ยวชาญ', username: 'siriporn3', email: 'siriporn.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.ธีระ', lastName: 'ผู้เชี่ยวชาญ', username: 'theera3', email: 'theera.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.นภา', lastName: 'ผู้เชี่ยวชาญ', username: 'napa3', email: 'napa.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.สมศักดิ์', lastName: 'ผู้เชี่ยวชาญ', username: 'somsak3', email: 'somsak.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.กมลชนก', lastName: 'ผู้เชี่ยวชาญ', username: 'kamolchanok3', email: 'kamolchanok.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.มนตรี', lastName: 'ผู้เชี่ยวชาญ', username: 'montri2', email: 'montri.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.รัตนา', lastName: 'ผู้เชี่ยวชาญ', username: 'rattana4', email: 'rattana2.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.ชัยวัฒน์', lastName: 'ผู้เชี่ยวชาญ', username: 'chaiwat4', email: 'chaiwat2.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.กัลยา', lastName: 'ผู้เชี่ยวชาญ', username: 'kanlaya4', email: 'kanlaya2.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.อภิชาติ', lastName: 'ผู้เชี่ยวชาญ', username: 'apichart4', email: 'apichart2.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.ศิริพร', lastName: 'ผู้เชี่ยวชาญ', username: 'siriporn4', email: 'siriporn2.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.ธีระ', lastName: 'ผู้เชี่ยวชาญ', username: 'theera4', email: 'theera2.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.นภา', lastName: 'ผู้เชี่ยวชาญ', username: 'napa4', email: 'napa2.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.สมศักดิ์', lastName: 'ผู้เชี่ยวชาญ', username: 'somsak4', email: 'somsak2.phuchiacharn@gmail.com', role: 'expert' },
  { firstName: 'ดร.กมลชนก', lastName: 'ผู้เชี่ยวชาญ', username: 'kamolchanok4', email: 'kamolchanok2.phuchiacharn@gmail.com', role: 'expert' }
];

// รหัสผ่านสำหรับทุกบัญชี
const PASSWORD = 'zzpp1234';

// ฟังก์ชันสร้างผู้ใช้
async function createUser(userData) {
  try {
    // สร้างผู้ใช้ในระบบ Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: PASSWORD,
      email_confirm: true, // ยืนยันอีเมลอัตโนมัติ
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        username: userData.username,
        role: userData.role,
      },
    });

    if (authError) {
      if (authError.message.includes('User already exists')) {
        console.log(`⚠️  มีผู้ใช้อีเมลนี้ในระบบแล้ว: ${userData.email}`);
        return { success: false, error: 'User already exists' };
      }
      throw new Error(`เกิดข้อผิดพลาดในการสร้างผู้ใช้: ${authError.message}`);
    }

    // รอสักครู่เพื่อให้ Trigger ทำงาน
    await new Promise(resolve => setTimeout(resolve, 500));

    // ตรวจสอบว่าสร้างโปรไฟล์สำเร็จหรือไม่
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.warn(`⚠️  ไม่พบโปรไฟล์สำหรับผู้ใช้: ${userData.email}`);
    }

    console.log(`✅ สร้างผู้ใช้สำเร็จ: ${userData.firstName} ${userData.lastName} (${userData.role}) - ${userData.email}`);
    return { success: true, user: authData.user };
  } catch (error) {
    console.error(`❌ สร้างผู้ใช้ไม่สำเร็จ: ${userData.firstName} ${userData.lastName} - ${userData.email}`);
    console.error(`   ข้อผิดพลาด: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ฟังก์ชันหลัก
async function createAllUsers() {
  console.log('🚀 เริ่มสร้างผู้ใช้ 50 คนด้วย Supabase Admin SDK...\n');

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

    // รอ 1 วินาทีระหว่างการสร้างแต่ละคน
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

  // แสดงข้อมูลผู้ใช้ที่สร้างสำเร็จ
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
  
  if (!SUPABASE_URL || SUPABASE_URL === 'your-supabase-url') {
    console.error('❌ กรุณาตั้งค่า SUPABASE_URL ในไฟล์สคริปต์');
    console.log('📝 วิธีการ:');
    console.log('   1. ไปที่ Supabase Dashboard');
    console.log('   2. คัดลอก Project URL');
    console.log('   3. แก้ไขค่า SUPABASE_URL ในไฟล์นี้');
    return false;
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key') {
    console.error('❌ กรุณาตั้งค่า SUPABASE_SERVICE_ROLE_KEY ในไฟล์สคริปต์');
    console.log('📝 วิธีการ:');
    console.log('   1. ไปที่ Supabase Dashboard > Settings > API');
    console.log('   2. คัดลอก Service Role Key');
    console.log('   3. แก้ไขค่า SUPABASE_SERVICE_ROLE_KEY ในไฟล์นี้');
    return false;
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

module.exports = { createAllUsers, createUser, usersData }; 