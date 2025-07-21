// D:\ProJectFinal\Lasts\betta-fish-api\src\services\notificationService.js (ฉบับสมบูรณ์)

// --- ส่วนที่ 1: การนำเข้า (Imports) ---

// นำเข้า Supabase clients ทั้งสองแบบ
const { supabaseAdmin, supabase } = require('../config/supabase');


// --- ส่วนที่ 2: Service Class ---

class NotificationService {

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับ "สร้าง" การแจ้งเตือนใหม่
     * (ฟังก์ชันนี้จะถูกเรียกใช้จาก Service อื่นๆ ภายใน Backend เท่านั้น)
     * ===================================================================
     * @param {string} userId - UUID ของผู้ใช้ที่จะเป็นผู้รับการแจ้งเตือน
     * @param {string} message - ข้อความที่จะแจ้งเตือน
     * @param {string} [linkTo] - (Optional) ลิงก์ใน Frontend ที่จะพาไปเมื่อคลิก
     */
    async createNotification(userId, message, linkTo = null) {
        // ตรวจสอบข้อมูลเบื้องต้น ป้องกันการสร้างข้อมูลที่ไม่มีผู้รับหรือข้อความ
        if (!userId || !message) {
            console.error("พยายามสร้าง Notification แต่ไม่มี userId หรือ message");
            return; // หยุดการทำงานของฟังก์ชัน
        }
        
        // [สำคัญ] ใช้ `supabaseAdmin` ในการ INSERT ข้อมูล
        // เพราะเป็นการทำงานหลังบ้าน (Server-to-Server) ที่ไม่ควรถูกจำกัดด้วย RLS Policies
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: userId,
                message: message,
                link_to: linkTo
            });

        // หากเกิดข้อผิดพลาด ให้แสดง log ในฝั่ง Server เพื่อให้เราตรวจสอบได้
        if (error) {
            console.error(`สร้าง Notification ให้ user ${userId} ไม่สำเร็จ:`, error.message);
        }
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับ "ดึง" การแจ้งเตือนทั้งหมดของผู้ใช้ที่ Login อยู่
     * (ฟังก์ชันนี้จะถูกเรียกใช้โดย Controller เพื่อส่งข้อมูลให้ Frontend)
     * ===================================================================
     * @param {string} userId - UUID ของผู้ใช้ที่ล็อกอินอยู่ (ได้มาจาก authMiddleware)
     */
    async getNotifications(userId) {
        // [สำคัญ] ที่นี่เราใช้ `supabase` (Client ธรรมดา)
        // เพราะเราได้สร้าง RLS Policy ไว้แล้วว่า "ผู้ใช้สามารถเห็นได้เฉพาะ Notification ของตัวเอง"
        // Supabase จะใช้ Token ของผู้ใช้ที่ Login อยู่เพื่อกรองข้อมูลให้เราโดยอัตโนมัติตาม Policy นั้น
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId) // แม้ RLS จะกรองให้แล้ว แต่การใส่ .eq() ซ้ำเป็นการป้องกันอีกชั้น
            .order('created_at', { ascending: false }) // เรียงจากใหม่สุดไปเก่าสุด
            .limit(50); // ดึงสูงสุด 50 รายการล่าสุด

        if (error) {
            throw new Error('ไม่สามารถดึงข้อมูลการแจ้งเตือนได้: ' + error.message);
        }
        return data;
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับ "อัปเดต" สถานะการแจ้งเตือนเป็น "อ่านแล้ว"
     * (ฟังก์ชันนี้จะถูกเรียกใช้โดย Controller เมื่อผู้ใช้คลิกที่การแจ้งเตือน)
     * ===================================================================
     * @param {number} notificationId - ID ของการแจ้งเตือนที่จะอัปเดต
     * @param {string} userId - UUID ของผู้ใช้ที่ล็อกอินอยู่ (เพื่อความปลอดภัย)
     */
    async markAsRead(notificationId, userId) {
        // ใช้ `supabase` (Client ธรรมดา) เพราะ RLS Policy อนุญาตให้ผู้ใช้อัปเดตเฉพาะ Notification ของตัวเอง
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .match({ id: notificationId, user_id: userId }) // อัปเดตเฉพาะแถวที่ ID และ User ID ตรงกันเท่านั้น
            .select()
            .single();
        
        if (error) {
            throw new Error('ไม่สามารถอัปเดตสถานะการแจ้งเตือนได้: ' + error.message);
        }
        return data;
    }
}

// --- ส่วนที่ 3: การส่งออก (Export) ---

module.exports = new NotificationService();