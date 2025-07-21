// D:\ProJectFinal\Lasts\betta-fish-api\src/controllers/adminController.js (ฉบับสมบูรณ์)

// --- ส่วนที่ 1: การนำเข้า (Imports) ---

// นำเข้า AdminService ซึ่งเป็นที่รวม Logic ทั้งหมดของ Admin
const AdminService = require('../services/adminService');

// --- ส่วนที่ 2: Controller Class ---

class AdminController {

    /**
     * ===================================================================
     * Controller สำหรับดึงข้อมูลผู้ใช้ทั้งหมด
     * (จัดการ Route: GET /api/admin/users)
     * ===================================================================
     */
    async getAllUsers(req, res) {
        try {
            // 1. เรียกใช้ฟังก์ชัน getAllUsers จาก Service
            const users = await AdminService.getAllUsers();
            // 2. หากสำเร็จ ส่งข้อมูลกลับไปพร้อมสถานะ 200 OK
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            // 3. หากเกิดข้อผิดพลาด ส่ง Error กลับไปพร้อมสถานะ 500 Internal Server Error
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับสร้างผู้ใช้ใหม่
     * (จัดการ Route: POST /api/admin/users)
     * ===================================================================
     */
    async createUser(req, res) {
        try {
            // 1. เรียกใช้ฟังก์ชัน createUser จาก Service โดยส่งข้อมูลจาก body ของ request ไปด้วย
            const newUser = await AdminService.createUser(req.body);
            // 2. หากสร้างสำเร็จ ส่งข้อมูลผู้ใช้ใหม่กลับไปพร้อมสถานะ 201 Created
            res.status(201).json({ success: true, data: newUser });
        } catch (error) {
            // 3. หากเกิดข้อผิดพลาด (เช่น อีเมลซ้ำ, รหัสผ่านสั้นไป) ส่ง Error กลับไปพร้อมสถานะ 400 Bad Request
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับลบผู้ใช้
     * (จัดการ Route: DELETE /api/admin/users/:id)
     * ===================================================================
     */
    async deleteUser(req, res) {
        try {
            // 1. ดึง user ID จาก URL parameter (เช่น /api/admin/users/abc-123)
            const { id } = req.params;
            // 2. เรียกใช้ฟังก์ชัน deleteUser จาก Service
            const result = await AdminService.deleteUser(id);
            // 3. หากลบสำเร็จ ส่งข้อความยืนยันกลับไปพร้อมสถานะ 200 OK
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            // 4. หากเกิดข้อผิดพลาด (เช่น ไม่พบ user) ส่ง Error กลับไปพร้อมสถานะ 400 Bad Request
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับดึงข้อมูลสรุปของ Dashboard
     * (จัดการ Route: GET /api/admin/dashboard/stats)
     * ===================================================================
     */
    async getDashboardStats(req, res) {
        try {
            // 1. เรียกใช้ฟังก์ชัน getDashboardStats จาก Service
            const stats = await AdminService.getDashboardStats();
            // 2. หากสำเร็จ ส่งข้อมูลสถิติกลับไปพร้อมสถานะ 200 OK
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            // 3. หากเกิดข้อผิดพลาด ส่ง Error กลับไปพร้อมสถานะ 500 Internal Server Error
            res.status(500).json({ success: false, error: error.message });
        }
    }

}

// --- ส่วนที่ 3: การส่งออก (Export) ---

// ส่งออก instance ของ Controller เพื่อให้ไฟล์ routes สามารถนำไปใช้งานได้
module.exports = new AdminController();