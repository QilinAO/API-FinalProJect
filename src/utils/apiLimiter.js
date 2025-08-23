// ======================================================================
// File: src/utils/apiLimiter.js
// หน้าที่: ระบบ Rate Limiting ที่ปรับแต่งได้สำหรับ endpoints ต่างๆ
// ======================================================================

const rateLimit = require('express-rate-limit');

/**
 * สร้าง Rate Limiter แบบ Configurable
 */
const createLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 นาที default
    max = 100, // จำนวน requests สูงสุด
    message = 'คำขอมากเกินไป กรุณาลองใหม่ในภายหลัง',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => req.ip, // ใช้ IP เป็น key
    onLimitReached = null, // callback เมื่อถึงขีดจำกัด
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator,
    handler: (req, res, next, options) => {
      // Log เมื่อมีการ rate limit
      console.warn(`[Rate Limit] ${keyGenerator(req)} exceeded limit: ${max} requests per ${windowMs}ms`);
      
      // เรียก callback ถ้ามี
      if (typeof onLimitReached === 'function') {
        try {
          onLimitReached(req, res);
        } catch (err) {
          console.error('[Rate Limit] onLimitReached callback error:', err);
        }
      }

      res.status(429).json(options.message);
    },
  });
};

// Limiters สำหรับ endpoints ต่างๆ

/**
 * Rate Limiter สำหรับ Authentication endpoints
 * เข้มงวดกว่าปกติเพื่อป้องกัน brute force attacks
 */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 10, // 10 ครั้งต่อ 15 นาที
  message: 'พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่',
  skipSuccessfulRequests: true, // ไม่นับ login สำเร็จ
  onLimitReached: (req, res) => {
    console.warn(`[Auth Limit] Suspicious login attempts from ${req.ip}`);
    // TODO: สามารถเพิ่มการแจ้งเตือนผ่าน Telegram ได้
  }
});

/**
 * Rate Limiter สำหรับ Password Reset
 * เข้มงวดมากเพื่อป้องกันการส่ง email spam
 */
const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 ชั่วโมง
  max: 3, // 3 ครั้งต่อชั่วโมง
  message: 'ขอรีเซ็ตรหัสผ่านมากเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่',
  keyGenerator: (req) => {
    // ใช้ทั้ง IP และ email เป็น key
    const email = req.body?.email || 'unknown';
    return `${req.ip}:${email}`;
  }
});

/**
 * Rate Limiter สำหรับ File Upload
 * จำกัดการอัพโหลดไฟล์เพื่อป้องกัน abuse
 */
const uploadLimiter = createLimiter({
  windowMs: 10 * 60 * 1000, // 10 นาที
  max: 20, // 20 ไฟล์ต่อ 10 นาที
  message: 'อัพโหลดไฟล์มากเกินไป กรุณารอสักครู่แล้วลองใหม่'
});

/**
 * Rate Limiter สำหรับ API calls ทั่วไป
 * ผ่อนปรนกว่าปกติสำหรับการใช้งานปกติ
 */
const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 1000, // 1000 requests ต่อ 15 นาที
  message: 'การใช้งาน API มากเกินไป กรุณาลดความถี่ในการเรียกใช้'
});

/**
 * Rate Limiter สำหรับ Search/Query operations
 * จำกัดเพื่อป้องกันการ query ที่หนักเกินไป
 */
const searchLimiter = createLimiter({
  windowMs: 5 * 60 * 1000, // 5 นาที
  max: 100, // 100 searches ต่อ 5 นาที
  message: 'ค้นหามากเกินไป กรุณาลดความถี่ในการค้นหา'
});

/**
 * Rate Limiter สำหรับผู้ใช้ที่ล็อกอินแล้ว
 * ใช้ userId แทน IP เพื่อความแม่นยำ
 */
const userLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 500, // 500 requests ต่อ 15 นาที
  keyGenerator: (req) => {
    // ใช้ userId ถ้ามี ถ้าไม่มีใช้ IP
    return req.userId || req.ip;
  },
  message: 'การใช้งานมากเกินไป กรุณาลดความถี่ในการใช้งาน'
});

module.exports = {
  createLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  generalLimiter,
  searchLimiter,
  userLimiter,
};
