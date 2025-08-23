// =======================================================================
// File: D:\ProJectFinal\Lasts\betta-fish-api\src\config\supabase.js
// (ฉบับสมบูรณ์ พร้อมใช้งานกับโค้ดส่วนอื่น ๆ ของโปรเจกต์)
// -----------------------------------------------------------------------
// จุดเด่นของไฟล์นี้
// 1) โหลดตัวแปรแวดล้อมจาก .env และตรวจสอบความครบถ้วน
// 2) สร้าง Supabase Client 2 ตัว:
//    - supabase       : ใช้ ANON KEY สำหรับงานปกติ (ยึดตาม RLS)
//    - supabaseAdmin  : ใช้ SERVICE ROLE KEY สำหรับงานฝั่งเซิร์ฟเวอร์ (ข้าม RLS)
// 3) มีฟังก์ชันทดสอบการเชื่อมต่อฐานข้อมูล (ผ่าน admin client เพื่อไม่ติด RLS)
// 4) ยูทิลิตี้เล็ก ๆ สำหรับ getPublicUrl
// =======================================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ---------- ดึงค่า ENV ----------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---------- ตรวจสอบความครบถ้วนของ ENV ----------
// โค้ดส่วนอื่นของโปรเจกต์นี้เรียกใช้ supabaseAdmin อย่างแพร่หลาย
// ดังนั้นถ้าไม่มี SERVICE ROLE KEY ให้หยุดการทำงานทันทีเพื่อป้องกัน error ย้อนหลัง
const missing = [];
if (!SUPABASE_URL) missing.push('SUPABASE_URL');
if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

if (missing.length) {
  console.error('❌ Missing Supabase environment variables!');
  missing.forEach((k) => console.error(`  - ${k}`));
  console.error('กรุณาตั้งค่าในไฟล์ .env ให้ครบถ้วนก่อนเริ่มเซิร์ฟเวอร์\n' +
                'ตัวอย่าง:\n' +
                '  SUPABASE_URL=...\n' +
                '  SUPABASE_ANON_KEY=...\n' +
                '  SUPABASE_SERVICE_ROLE_KEY=...\n');
  process.exit(1);
}

// ---------- สร้าง Client ทั้งสอง ----------
// หมายเหตุ: ตั้งค่า auth.persistSession=false & autoRefreshToken=false
// สำหรับฝั่งเซิร์ฟเวอร์ (ไม่ต้องการเก็บ session state ใด ๆ ในหน่วยความจำ)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------- ยูทิลิตี้: สร้าง Public URL จาก bucket/path ----------
/**
 * getPublicUrl - คืนค่า public URL ของไฟล์ใน Supabase Storage
 * @param {string} bucket - ชื่อบัคเก็ต (เช่น 'posters')
 * @param {string} filePath - path ของไฟล์ในบัคเก็ต (เช่น 'Profile/xxx.png')
 * @returns {string} public URL หรือ string ว่างถ้าสร้างไม่ได้
 */
function getPublicUrl(bucket, filePath) {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data?.publicUrl || '';
  } catch {
    return '';
  }
}

// ---------- ทดสอบการเชื่อมต่อฐานข้อมูล (ผ่าน admin เพื่อไม่ติด RLS) ----------
async function testConnection() {
  try {
    // ใช้ตารางที่เรามีจริงในโปรเจกต์ เช่น 'profiles'
    // ใช้ head+count เพื่อลดภาระ (ไม่ดึงข้อมูลจริง แค่เช็คว่าคิวรีได้)
    const { error } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Database connection failed:', error.message);
    } else {
      console.log('✅ Database connected successfully');
    }
  } catch (err) {
    console.error('❌ Database connection error:', err?.message || err);
  }
}
testConnection(); // เรียกทดสอบทันทีเมื่อโหลดโมดูล

// ---------- ส่งออกให้ส่วนอื่นใช้งาน ----------
module.exports = {
  supabase,
  supabaseAdmin,
  getPublicUrl,
};
