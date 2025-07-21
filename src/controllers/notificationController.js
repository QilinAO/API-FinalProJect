// D:\ProJectFinal\Lasts\betta-fish-api\src\controllers\notificationController.js (ฉบับสมบูรณ์)

// --- ส่วนที่ 1: การนำเข้า (Imports) ---

// นำเข้า NotificationService ซึ่งเป็นที่รวม Logic ทั้งหมดของการแจ้งเตือน
const NotificationService = require('../services/notificationService');


// --- ส่วนที่ 2: Controller Class ---

class NotificationController {

    /**
     * ===================================================================
     * Controller สำหรับดึงการแจ้งเตือนทั้งหมดของผู้ใช้
     * (จัดการ Route: GET /api/notifications/)
     * ===================================================================
     */
    async getNotifications(req, res) {
        try {
            // 1. เรียกใช้ฟังก์ชัน getNotifications จาก Service
            //    โดยใช้ `req.userId` ที่ได้มาจาก `authMiddleware` ซึ่งทำงานก่อนหน้านี้แล้ว
            const notifications = await NotificationService.getNotifications(req.userId);

            // 2. หากสำเร็จ ส่งข้อมูลกลับไปให้ Frontend พร้อมสถานะ 200 OK
            res.status(200).json({ success: true, data: notifications });
        } catch (error) {
            // 3. หากเกิดข้อผิดพลาด ส่ง Error กลับไปพร้อมสถานะ 500 Internal Server Error
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับอัปเดตสถานะการแจ้งเตือนเป็น "อ่านแล้ว"
     * (จัดการ Route: POST /api/notifications/:id/read)
     * ===================================================================
     */
    async markAsRead(req, res) {
        try {
            // 1. ดึง notification ID จาก URL parameter (เช่น /api/notifications/123/read)
            const { id } = req.params;

            // 2. เรียกใช้ฟังก์ชัน markAsRead จาก Service
            //    โดยส่งทั้ง `id` ของ notification และ `req.userId` ของผู้ใช้ปัจจุบันไปด้วย
            //    เพื่อความปลอดภัย (ป้องกันไม่ให้ผู้ใช้อัปเดต notification ของคนอื่น)
            const notification = await NotificationService.markAsRead(id, req.userId);

            // 3. หากสำเร็จ ส่งข้อมูล notification ที่อัปเดตแล้วกลับไปพร้อมสถานะ 200 OK
            res.status(200).json({ success: true, data: notification });
        } catch (error) {
            // 4. หากเกิดข้อผิดพลาด (เช่น พยายามอัปเดตของคนอื่น) RLS จะป้องกันและทำให้เกิด Error
            //    เราจึงส่งสถานะ 403 Forbidden (ไม่มีสิทธิ์) กลับไป
            res.status(403).json({ success: false, error: error.message });
        }
    }
}

// --- ส่วนที่ 3: การส่งออก (Export) ---

// ส่งออก instance ของ Controller เพื่อให้ไฟล์ routes สามารถนำไปใช้งานได้
module.exports = new NotificationController();