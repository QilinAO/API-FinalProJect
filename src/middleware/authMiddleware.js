// ======================================================================
// File: src/middleware/authMiddleware.js
// หน้าที่: Middleware หลักสำหรับตรวจสอบและยืนยันตัวตนผู้ใช้จาก JWT
// ======================================================================

const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

// --- Helper Functions ---

/**
 * ดึง Bearer Token จาก Authorization header
 * @param {import('express').Request} req - Express request object
 * @returns {string|null}
 */
function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * ดึงข้อมูลโปรไฟล์ผู้ใช้จากฐานข้อมูล
 * @param {string} userId - UUID ของผู้ใช้
 * @returns {Promise<object|null>}
 */
async function fetchProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, role, username, first_name, last_name, email')
    .eq('id', userId)
    .single();
  
  // หากเกิด Error หรือไม่พบข้อมูล ให้คืนค่า null
  return error || !data ? null : data;
}

/**
 * ตรวจสอบ Supabase JWT และดึงข้อมูลโปรไฟล์ที่เกี่ยวข้อง
 * @param {string} token - Supabase JWT
 * @returns {Promise<object|null>}
 */
async function verifySupabaseToken(token) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  const profile = await fetchProfile(user.id);
  if (!profile) {
    // กรณีนี้อาจเกิดขึ้นได้หาก Trigger สร้างโปรไฟล์ไม่ทำงาน
    console.warn(`[Auth] User ${user.id} exists in auth but not in profiles.`);
    return null;
  }

  return {
    id: profile.id,
    role: profile.role || 'user',
    email: profile.email,
    username: profile.username,
    firstName: profile.first_name,
    lastName: profile.last_name,
  };
}

// --- Main Middleware ---

/**
 * Middleware สำหรับตรวจสอบสิทธิ์การเข้าถึง
 * 1. ตรวจสอบ Dev Override (x-user-id)
 * 2. ดึง Token จาก Header
 * 3. ตรวจสอบ Token กับ Supabase Auth
 * 4. แนบข้อมูลผู้ใช้ (userId, userRole, user) ไปกับ Request object
 */
async function authMiddleware(req, res, next) {
  try {
    // 1. Dev Override: สำหรับการทดสอบในสภาพแวดล้อมที่ไม่ใช่ Production
    if (process.env.NODE_ENV !== 'production' && req.headers['x-user-id']) {
      const devUserId = String(req.headers['x-user-id']).trim();
      const profile = await fetchProfile(devUserId);
      if (!profile) {
        return res.status(404).json({ success: false, error: 'Dev user not found' });
      }
      req.userId = profile.id;
      req.userRole = profile.role || 'user';
      req.user = { ...profile, devImpersonated: true };
      return next();
    }

    // 2. ดึง Token
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'ไม่พบ Authentication Token' });
    }

    // 3. ตรวจสอบ Token
    const user = await verifySupabaseToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'เซสชันหมดอายุหรือ Token ไม่ถูกต้อง' });
    }

    // 4. แนบข้อมูลผู้ใช้ไปกับ Request
    req.userId = user.id;
    req.userRole = user.role;
    req.user = user;
    
    return next();
  } catch (err) {
    // ส่งต่อ Error ที่ไม่คาดคิดไปยัง Global Error Handler
    console.error('[AuthMiddleware] Unexpected error:', err);
    next(err);
  }
}

module.exports = authMiddleware;

// เพิ่ม export สำหรับ requireAuth
module.exports.requireAuth = authMiddleware;