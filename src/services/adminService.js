// D:\ProJectFinal\Lasts\betta-fish-api\src\services\adminService.js (ฉบับสมบูรณ์)

// [สำคัญ] ต้องใช้ Admin client เสมอสำหรับงานของ Admin เพื่อให้มีสิทธิ์เพียงพอ
const { supabaseAdmin } = require('../config/supabase'); 

class AdminService {

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ทั้งหมด (โค้ดเดิม สมบูรณ์ดีอยู่แล้ว)
     * ===================================================================
     */
    async getAllUsers() {
        const { data, error } = await supabaseAdmin.from('profiles').select('*');
        if (error) {
            throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ทั้งหมดได้: ' + error.message);
        }
        return data;
    }

    /**
     * ===================================================================
     * ▼▼▼ [ส่วนที่อัปเดต] ฟังก์ชันสำหรับสร้างผู้ใช้ใหม่โดย Admin ▼▼▼
     * ===================================================================
     * @param {object} userData - { email, password, role, firstName, lastName, username }
     */
    async createUser(userData) {
        const { email, password, role, firstName, lastName, username } = userData;

        // 1. ใช้ Admin-level function `createUser` เพื่อสร้างผู้ใช้ในระบบ Auth
        //    พร้อมกับส่งข้อมูล profile ทั้งหมดเข้าไปใน `user_metadata`
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // ตั้งค่าให้ยืนยันอีเมลแล้วโดยอัตโนมัติ
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                username: username,
                role: role
            }
        });

        // 2. จัดการ Error ที่อาจเกิดขึ้น
        if (authError) {
            if (authError.message.includes('User already exists')) throw new Error('มีผู้ใช้อีเมลนี้ในระบบแล้ว');
            if (authError.message.includes('Password should be at least 6 characters')) throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            throw new Error('เกิดข้อผิดพลาดในการสร้างผู้ใช้: ' + authError.message);
        }

        // [อัปเดต] เราไม่ต้องดึงข้อมูล profile จากฐานข้อมูลอีกต่อไป
        // เพราะ Database Trigger จะเป็นคนจัดการสร้าง profile ให้เอง
        // เราแค่ส่งข้อมูล user ที่สร้างสำเร็จกลับไปก็เพียงพอแล้ว
        return authData.user;
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับลบผู้ใช้โดย Admin (โค้ดเดิม สมบูรณ์ดีอยู่แล้ว)
     * ===================================================================
     * @param {string} userId - UUID ของผู้ใช้ที่จะลบ
     */
    async deleteUser(userId) {
        // ใช้ Admin-level function `deleteUser` เพื่อลบผู้ใช้ออกจากระบบ Auth
        // การตั้งค่า Foreign Key แบบ "ON DELETE CASCADE" ในตาราง profiles
        // จะทำให้ข้อมูล profile ของผู้ใช้คนนี้ถูกลบตามไปด้วยโดยอัตโนมัติ
        const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            if (error.message.includes('User not found')) throw new Error('ไม่พบผู้ใช้ที่ต้องการลบ');
            throw new Error('เกิดข้อผิดพลาดในการลบผู้ใช้: ' + error.message);
        }
        
        return { message: `ลบผู้ใช้ ID: ${userId} สำเร็จ` };
    }

    /**
     * ===================================================================
     * ▼▼▼ [ส่วนที่เพิ่มใหม่] ฟังก์ชันดึงข้อมูลสรุปสำหรับ Admin Dashboard ▼▼▼
     * ===================================================================
     */
    async getDashboardStats() {
        // 1. ดึงข้อมูลผู้ใช้ทั้งหมด พร้อมเรียงจากใหม่ไปเก่า
        const { data: users, error: usersError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, first_name, last_name, email, created_at')
            .order('created_at', { ascending: false });
        if (usersError) throw usersError;

        // 2. ดึงข้อมูลกิจกรรมทั้งหมด
        const { data: contests, error: contestsError } = await supabaseAdmin
            .from('contests')
            .select('id, category');
        if (contestsError) throw contestsError;

        // 3. ประมวลผลข้อมูล Users: นับจำนวนตาม Role
        const roleCounts = users.reduce((acc, u) => {
          acc[u.role] = (acc[u.role] || 0) + 1;
          return acc;
        }, { admin: 0, user: 0, manager: 0, expert: 0 });

        // 4. ประมวลผลข้อมูล Contests/News: นับจำนวนตาม Category
        const contentCounts = contests.reduce((acc, c) => {
          if (c.category === 'การประกวด') {
             acc.totalContests = (acc.totalContests || 0) + 1;
          } else {
             acc.totalNews = (acc.totalNews || 0) + 1;
          }
          return acc;
        }, { totalContests: 0, totalNews: 0 });

        // 5. ดึงผู้ใช้ 5 คนล่าสุด (เนื่องจากเราเรียงข้อมูลไว้แล้ว จึงแค่ slice 5 ตัวแรก)
        const recentUsers = users.slice(0, 5).map(u => ({
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            role: u.role
        }));

        // 6. ประกอบข้อมูลทั้งหมดเป็น Object เดียวแล้วส่งกลับ
        return {
          totalUsers: users.length,
          ...roleCounts,
          ...contentCounts,
          recentUsers: recentUsers
        };
    }
}

module.exports = new AdminService();