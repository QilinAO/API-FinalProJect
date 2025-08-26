// ======================================================================
// สคริปต์สำหรับตั้งค่าความถนัดให้ผู้เชี่ยวชาญ 20 คน
// ใช้งาน: node scripts/setExpertSpecialities.js
// ======================================================================

const { createClient } = require('@supabase/supabase-js');

// ข้อมูลการเชื่อมต่อ Supabase
const SUPABASE_URL = 'https://lgnhyqwtilthhqvlgvnd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnbmh5cXd0aWx0aGhxdmxndm5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMxNDQ4OCwiZXhwIjoyMDY1ODkwNDg4fQ.IccXmRcb_OaUA1tXvjmjF-V3pNdpbY7OzHmoPgbs_hE';

// สร้าง Supabase client ด้วย Service Role Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// รายการความถนัดทั้งหมดที่มีในระบบจริง
const ALL_SPECIALITIES = [
  "ปลากัดพื้นบ้านภาคกลางและเหนือ", 
  "ปลากัดพื้นบ้านภาคอีสาน", 
  "ปลากัดพื้นภาคใต้",
  "ปลากัดพื้นบ้านมหาชัย", 
  "ปลากัดพื้นบ้านภาคตะวันออก", 
  "ปลากัดพื้นบ้านอีสานหางลาย"
];

// ฟังก์ชันสุ่มเลือกจากอาร์เรย์
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ฟังก์ชันสุ่มเลือกความถนัด 2 อันที่ไม่ซ้ำกัน
function getRandomSpecialities() {
  const specialities = [...ALL_SPECIALITIES]; // คัดลอกอาร์เรย์
  const selected = [];
  
  // สุ่มเลือก 2 อัน
  for (let i = 0; i < 2; i++) {
    const randomIndex = Math.floor(Math.random() * specialities.length);
    selected.push(specialities[randomIndex]);
    specialities.splice(randomIndex, 1); // ลบออกเพื่อไม่ให้ซ้ำ
  }
  
  return selected;
}

// ฟังก์ชันดึงข้อมูลผู้เชี่ยวชาญทั้งหมด
async function getAllExperts() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, username, specialities')
      .eq('role', 'expert')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`ไม่สามารถดึงข้อมูลผู้เชี่ยวชาญได้: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูลผู้เชี่ยวชาญ:', error.message);
    return [];
  }
}

// ฟังก์ชันตั้งค่าความถนัดให้ผู้เชี่ยวชาญ
async function setExpertSpecialities(expertId, specialities) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        specialities: specialities,
        updated_at: new Date().toISOString() 
      })
      .eq('id', expertId)
      .select()
      .single();

    if (error) {
      throw new Error(`ไม่สามารถอัปเดตความถนัดได้: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw new Error(`เกิดข้อผิดพลาดในการตั้งค่าความถนัด: ${error.message}`);
  }
}

// ฟังก์ชันหลัก
async function setAllExpertSpecialities() {
  console.log('🚀 เริ่มตั้งค่าความถนัดให้ผู้เชี่ยวชาญ...\n');

  // ดึงข้อมูลผู้เชี่ยวชาญทั้งหมด
  const experts = await getAllExperts();
  
  if (experts.length === 0) {
    console.log('❌ ไม่พบผู้เชี่ยวชาญในระบบ');
    return;
  }

  console.log(`📋 พบผู้เชี่ยวชาญ ${experts.length} คน:`);
  experts.forEach((expert, index) => {
    console.log(`   ${index + 1}. ${expert.first_name} ${expert.last_name} (${expert.email})`);
  });
  console.log('');

  const results = {
    success: 0,
    failed: 0,
    details: []
  };

  // ตั้งค่าความถนัดให้แต่ละคน
  for (let i = 0; i < experts.length; i++) {
    const expert = experts[i];
    const specialities = getRandomSpecialities();
    
    console.log(`📝 ตั้งค่าความถนัดที่ ${i + 1}/${experts.length}: ${expert.first_name} ${expert.last_name}`);
    console.log(`   ความถนัด: ${specialities.join(', ')}`);
    
    try {
      const updatedExpert = await setExpertSpecialities(expert.id, specialities);
      
      console.log(`✅ ตั้งค่าความถนัดสำเร็จ: ${expert.first_name} ${expert.last_name}`);
      console.log(`   ความถนัดใหม่: ${updatedExpert.specialities.join(', ')}\n`);
      
      results.success++;
      results.details.push({
        expert: expert,
        specialities: specialities,
        success: true
      });
    } catch (error) {
      console.error(`❌ ตั้งค่าความถนัดไม่สำเร็จ: ${expert.first_name} ${expert.last_name}`);
      console.error(`   ข้อผิดพลาด: ${error.message}\n`);
      
      results.failed++;
      results.details.push({
        expert: expert,
        specialities: specialities,
        success: false,
        error: error.message
      });
    }

    // รอ 500ms ระหว่างการอัปเดตแต่ละคน
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // แสดงผลสรุป
  console.log('📊 ผลสรุปการตั้งค่าความถนัด:');
  console.log(`✅ ตั้งค่าสำเร็จ: ${results.success} คน`);
  console.log(`❌ ตั้งค่าไม่สำเร็จ: ${results.failed} คน`);
  console.log(`📈 อัตราความสำเร็จ: ${((results.success / experts.length) * 100).toFixed(2)}%`);

  // แสดงรายละเอียดผู้เชี่ยวชาญที่ตั้งค่าไม่สำเร็จ
  if (results.failed > 0) {
    console.log('\n❌ ผู้เชี่ยวชาญที่ตั้งค่าไม่สำเร็จ:');
    results.details.forEach((detail, index) => {
      if (!detail.success) {
        console.log(`   ${index + 1}. ${detail.expert.first_name} ${detail.expert.last_name} - ${detail.error}`);
      }
    });
  }

  // แสดงสถิติความถนัด
  const specialityStats = {};
  results.details.forEach(detail => {
    if (detail.success) {
      detail.specialities.forEach(spec => {
        specialityStats[spec] = (specialityStats[spec] || 0) + 1;
      });
    }
  });

  console.log('\n🎯 สถิติความถนัด:');
  Object.entries(specialityStats)
    .sort(([,a], [,b]) => b - a) // เรียงตามจำนวนมากไปน้อย
    .forEach(([spec, count]) => {
      console.log(`   ${spec}: ${count} คน`);
    });

  // แสดงข้อมูลผู้เชี่ยวชาญที่ตั้งค่าสำเร็จ
  const successfulExperts = results.details.filter(detail => detail.success);
  
  console.log('\n💾 ข้อมูลผู้เชี่ยวชาญที่ตั้งค่าสำเร็จ:');
  successfulExperts.forEach((detail, index) => {
    console.log(`   ${index + 1}. ${detail.expert.first_name} ${detail.expert.last_name} - ${detail.specialities.join(', ')}`);
  });
}

// ฟังก์ชันแสดงสถิติความถนัดปัจจุบัน
async function showCurrentSpecialities() {
  console.log('📊 สถิติความถนัดปัจจุบัน:\n');
  
  const experts = await getAllExperts();
  
  if (experts.length === 0) {
    console.log('❌ ไม่พบผู้เชี่ยวชาญในระบบ');
    return;
  }

  const specialityStats = {};
  let totalWithSpecialities = 0;

  experts.forEach(expert => {
    if (expert.specialities && expert.specialities.length > 0) {
      totalWithSpecialities++;
      expert.specialities.forEach(spec => {
        specialityStats[spec] = (specialityStats[spec] || 0) + 1;
      });
    }
  });

  console.log(`👥 ผู้เชี่ยวชาญทั้งหมด: ${experts.length} คน`);
  console.log(`✅ มีความถนัด: ${totalWithSpecialities} คน`);
  console.log(`❌ ไม่มีความถนัด: ${experts.length - totalWithSpecialities} คน\n`);

  if (Object.keys(specialityStats).length > 0) {
    console.log('🎯 ความถนัดที่มีอยู่:');
    Object.entries(specialityStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([spec, count]) => {
        console.log(`   ${spec}: ${count} คน`);
      });
  } else {
    console.log('📝 ยังไม่มีผู้เชี่ยวชาญที่มีความถนัด');
  }
}

// ตรวจสอบการตั้งค่า
function checkConfiguration() {
  console.log('🔧 ตรวจสอบการตั้งค่า...');
  
  if (!SUPABASE_URL || SUPABASE_URL === 'your-supabase-url') {
    console.error('❌ กรุณาตั้งค่า SUPABASE_URL ในไฟล์สคริปต์');
    return false;
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key') {
    console.error('❌ กรุณาตั้งค่า SUPABASE_SERVICE_ROLE_KEY ในไฟล์สคริปต์');
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

    // แสดงสถิติปัจจุบัน
    await showCurrentSpecialities();
    console.log('\n' + '='.repeat(50) + '\n');

    // ตั้งค่าความถนัดใหม่
    await setAllExpertSpecialities();
    
    console.log('\n🎉 เสร็จสิ้นการตั้งค่าความถนัด!');
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการรันสคริปต์:', error.message);
  }
}

// รันสคริปต์
if (require.main === module) {
  main();
}

module.exports = { 
  setAllExpertSpecialities, 
  setExpertSpecialities, 
  getAllExperts,
  showCurrentSpecialities,
  getRandomSpecialities 
}; 