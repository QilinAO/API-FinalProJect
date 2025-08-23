// ======================================================================
// File: src/middleware/securityHeaders.js
// หน้าที่: เพิ่ม Security Headers ให้กับ Response เพื่อป้องกันการโจมตีต่างๆ
// ======================================================================

/**
 * Middleware สำหรับเพิ่ม Security Headers
 * รวม: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
 */
const securityHeaders = (req, res, next) => {
  // Content Security Policy - ป้องกัน XSS
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // ผ่อนปรนสำหรับ React dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.supabase.co wss://realtime.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );

  // Strict Transport Security - บังคับใช้ HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // X-Frame-Options - ป้องกัน Clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - ป้องกัน MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection - เปิดใช้ XSS filtering ใน browser เก่า
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy - ควบคุมการส่ง referrer header
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - ควบคุม browser features
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'bluetooth=()'
    ].join(', ')
  );

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'Betta-API');

  next();
};

module.exports = securityHeaders;
