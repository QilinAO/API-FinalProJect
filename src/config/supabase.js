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

// ---------- Environment Variables Configuration ----------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---------- ตรวจสอบความครบถ้วนของ ENV ----------
const missing = [];
if (!SUPABASE_URL) missing.push('SUPABASE_URL');
if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

if (missing.length) {
  console.error('❌ Missing Supabase environment variables!');
  missing.forEach((k) => console.error(`  - ${k}`));
  console.error('⚠️  API will start in limited mode without database connection');
  console.error('🔧 Please check Railway Environment Variables');
  
  // Create robust dummy clients instead of crashing (chain-safe)
  const makeDummyQuery = () => {
    const result = {
      // query builders
      select: () => result,
      eq: () => result,
      ilike: () => result,
      match: () => result,
      in: () => result,
      is: () => result,
      order: () => result,
      limit: () => result,
      range: () => result,
      // execution methods
      single: async () => ({ data: null, error: { message: 'Database not configured' } }),
      maybeSingle: async () => ({ data: null, error: { message: 'Database not configured' } }),
      // select without single
      then: undefined, // ensure not treated as a promise prematurely
      // head+count style (emulate shape with count)
      // Using a function returning an object with count to prevent runtime errors
      // Callers often do: const { count } = await ...select('*', { count: 'exact', head: true })
    };
    // provide a callable to simulate the head/count call path
    result.execute = async () => ({ data: [], count: 0, error: { message: 'Database not configured' } });
    return result;
  };

  const dummyClient = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: { message: 'Auth not configured' } }),
      signIn: async () => ({ data: null, error: { message: 'Auth not configured' } }),
      admin: {
        getUserById: async () => ({ data: { user: null }, error: { message: 'Auth not configured' } })
      }
    },
    from: () => makeDummyQuery(),
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }) }
  };
  
  module.exports = {
    supabase: dummyClient,
    supabaseAdmin: dummyClient,
    getPublicUrl: () => '',
  };
  
  return;
}

console.log('🔐 Supabase Configuration:');
console.log('  📍 URL:', SUPABASE_URL);
console.log('  🔑 Anon Key:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('  🗝️ Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('✅ Using environment variables from .env file');

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
    console.log('🔍 Testing database connection...');
    
    // ใช้ตารางที่เรามีจริงในโปรเจกต์ เช่น 'contests'
    // ใช้ head+count เพื่อลดภาระ (ไม่ดึงข้อมูลจริง แค่เช็คว่าคิวรีได้)
    const { error } = await supabaseAdmin
      .from('contests')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('   Details:', error.details || 'No details available');
    } else {
      console.log('✅ Database connected successfully');
      console.log('   📊 Table: contests (accessible)');
    }
  } catch (err) {
    console.error('❌ Database connection error:', err?.message || err);
  }
}

// ทดสอบการเชื่อมต่อฐานข้อมูลทันทีเมื่อโหลดโมดูล (ถ้ามี config)
if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY) {
  testConnection();
} else {
  console.log('⚠️  Skipping database connection test - missing configuration');
}

// ---------- ส่งออกให้ส่วนอื่นใช้งาน ----------
module.exports = {
  supabase,
  supabaseAdmin,
  getPublicUrl,
};
