// ======================================================================
// File: src/controllers/notificationController.js
// หน้าที่: จัดการ Logic สำหรับการดึงและอัปเดตการแจ้งเตือน (Notifications)
// ======================================================================

const NotificationService = require('../services/notificationService');

/**
 * Utility function สำหรับครอบ (wrap) async route handlers
 * เพื่อจัดการ Error และส่งต่อไปยัง Global Error Handler โดยอัตโนมัติ
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// --- Helper functions for parsing query parameters ---

const asBool = (v) => String(v ?? '').trim().toLowerCase() === 'true';
const asLimit = (v, def = 50, max = 200) => {
  const n = Number(v);
  return !Number.isFinite(n) || n <= 0 ? def : Math.min(n, max);
};

class NotificationController {
  /**
   * ดึงรายการแจ้งเตือนของผู้ใช้ที่ล็อกอินอยู่
   * Route: GET /api/notifications
   */
  list = asyncWrapper(async (req, res) => {
    const options = {
      unreadOnly: asBool(req.query.unreadOnly),
      limit: asLimit(req.query.limit),
    };
    const data = await NotificationService.getNotifications(req.userId, options);
    res.status(200).json({ success: true, data });
  });

  /**
   * ทำเครื่องหมายการแจ้งเตือนรายการเดียวว่าอ่านแล้ว
   * Route: PATCH /api/notifications/:id/read
   */
  markRead = asyncWrapper(async (req, res) => {
    const idStr = String(req.params.id || '').trim();
    if (!/^\d+$/.test(idStr)) {
      // สร้าง Error object พร้อม status code เพื่อให้ Global Handler จัดการ
      throw Object.assign(new Error('notificationId ไม่ถูกต้อง'), { status: 400 });
    }

    const id = Number(idStr);
    const row = await NotificationService.markAsRead(id, req.userId);
    
    if (!row) {
      throw Object.assign(new Error('ไม่พบการแจ้งเตือนหรือไม่มีสิทธิ์'), { status: 404 });
    }

    res.status(200).json({ success: true, data: row });
  });

  /**
   * ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว
   * Route: PATCH /api/notifications/read-all
   */
  markAllRead = asyncWrapper(async (req, res) => {
    const updatedCount = await NotificationService.markAllAsRead(req.userId);
    res.status(200).json({ success: true, updatedCount });
  });
}

module.exports = new NotificationController();