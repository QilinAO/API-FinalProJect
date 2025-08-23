// src/middleware/requireCronOrAdmin.js
const authMiddleware = require('./authMiddleware');
const checkRole = require('./roleMiddleware');

module.exports = function requireCronOrAdmin(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();

  // ผ่านได้ด้วย Cron token
  if (req.headers['x-cron-token'] === process.env.CRON_TOKEN) {
    return next();
  }

  // ไม่ใช่ Cron → ต้องเป็น admin ที่ล็อกอิน
  return authMiddleware(req, res, () => checkRole('admin')(req, res, next));
};
