// ======================================================================
// File: src/controllers/adminController.js
// หน้าที่: จัดการ Logic การทำงานที่เกี่ยวข้องกับส่วนของผู้ดูแลระบบ (Admin)
// ======================================================================

const AdminService = require('../services/adminService');

/**
 * Utility function สำหรับครอบ (wrap) async route handlers
 * เพื่อจัดการ Error ที่เกิดขึ้นและส่งต่อไปยัง Global Error Handler โดยอัตโนมัติ
 * @param {Function} fn - Async controller function ที่จะถูกเรียกใช้งาน
 * @returns {Function} - Express route handler function
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class AdminController {
  /**
   * ดึงข้อมูลผู้ใช้ทั้งหมด
   * Route: GET /api/admin/users
   */
  getAllUsers = asyncWrapper(async (req, res) => {
    const users = await AdminService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  });

  /**
   * สร้างผู้ใช้ใหม่โดย Admin
   * Route: POST /api/admin/users
   */
  createUser = asyncWrapper(async (req, res) => {
    // Service จะ throw error หากข้อมูลไม่ถูกต้อง (เช่น อีเมลซ้ำ)
    // ซึ่ง asyncWrapper จะดักจับและส่งไปให้ Global Error Handler จัดการ
    const newUser = await AdminService.createUser(req.body);
    res.status(201).json({ success: true, data: newUser });
  });

  /**
   * ลบผู้ใช้ตาม ID
   * Route: DELETE /api/admin/users/:id
   */
  deleteUser = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const result = await AdminService.deleteUser(id);
    res.status(200).json({ success: true, data: result });
  });

  /**
   * ดึงข้อมูลสรุปสำหรับ Dashboard
   * Route: GET /api/admin/dashboard/stats
   */
  getDashboardStats = asyncWrapper(async (req, res) => {
    const stats = await AdminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  });
}

module.exports = new AdminController();