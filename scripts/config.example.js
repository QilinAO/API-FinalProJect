// ======================================================================
// ไฟล์ตัวอย่างสำหรับการตั้งค่า
// คัดลอกไฟล์นี้เป็น config.js และแก้ไขค่าต่างๆ
// ======================================================================

// สำหรับสคริปต์ createUsers.js และ createRandomUsers.js
module.exports = {
  // URL ของ API server
  API_BASE_URL: 'http://localhost:3001/api',
  
  // Admin Token (ได้จากการเข้าสู่ระบบด้วย Admin account)
  ADMIN_TOKEN: 'your-admin-token-here',
  
  // รหัสผ่านสำหรับผู้ใช้ทั้งหมด
  PASSWORD: 'zzpp1234'
};

// สำหรับสคริปต์ createUsersSimple.js
module.exports = {
  // Supabase Project URL
  SUPABASE_URL: 'https://your-project-id.supabase.co',
  
  // Supabase Service Role Key
  SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key-here',
  
  // รหัสผ่านสำหรับผู้ใช้ทั้งหมด
  PASSWORD: 'zzpp1234'
}; 