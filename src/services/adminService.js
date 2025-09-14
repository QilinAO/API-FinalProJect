// ======================================================================
// File: src/services/adminService.js
// หน้าที่: จัดการ Logic การทำงานทั้งหมดที่เกี่ยวข้องกับสิทธิ์ของผู้ดูแลระบบ
// ======================================================================

const { supabaseAdmin } = require('../config/supabase');

class AdminService {
  /**
   * ดึงข้อมูลผู้ใช้ทั้งหมดในระบบ
   * @returns {Promise<Array>} Array ของ Object ผู้ใช้ทั้งหมด
   */
  async getAllUsers() {
    const { data, error } = await supabaseAdmin.from('profiles').select('*');
    if (error) {
      throw new Error(`ไม่สามารถดึงข้อมูลผู้ใช้ทั้งหมดได้: ${error.message}`);
    }
    return data;
  }

  /**
   * สร้างผู้ใช้ใหม่โดย Admin
   * @param {object} userData - ข้อมูลผู้ใช้ { email, password, role, firstName, lastName, username }
   * @returns {Promise<object>} Object ของผู้ใช้ที่ถูกสร้างในระบบ Auth
   */
  async createUser(userData) {
    const { email, password, role, firstName, lastName, username } = userData;

    // สร้างผู้ใช้ในระบบ Auth พร้อมแนบ metadata เพื่อให้ Trigger สร้างโปรไฟล์อัตโนมัติ
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // ยืนยันอีเมลอัตโนมัติ
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        username: username,
        role: role,
      },
    });

    if (authError) {
      if (authError.message.includes('User already exists')) {
        throw new Error('มีผู้ใช้อีเมลนี้ในระบบแล้ว');
      }
      if (authError.message.includes('Password should be at least 6 characters')) {
        throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      }
      throw new Error(`เกิดข้อผิดพลาดในการสร้างผู้ใช้: ${authError.message}`);
    }

    // Trigger ใน Database จะจัดการสร้างโปรไฟล์ให้เอง
    // เราจึงส่งคืนแค่ข้อมูล user จากระบบ Auth ก็เพียงพอ
    return authData.user;
  }

  /**
   * ลบผู้ใช้ตาม ID ที่ระบุ
   * @param {string} userId - UUID ของผู้ใช้ที่ต้องการลบ
   * @returns {Promise<{message: string}>} ข้อความยืนยันการลบ
   */
  async deleteUser(userId) {
    // การลบผู้ใช้ในระบบ Auth จะทำให้ Trigger ลบข้อมูลในตาราง profiles ที่เกี่ยวข้องโดยอัตโนมัติ (ON DELETE CASCADE)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      if (error.message.includes('User not found')) {
        throw new Error('ไม่พบผู้ใช้ที่ต้องการลบ');
      }
      throw new Error(`เกิดข้อผิดพลาดในการลบผู้ใช้: ${error.message}`);
    }

    return { message: `ลบผู้ใช้ ID: ${userId} สำเร็จ` };
  }

  /**
   * ดึงข้อมูลสรุปสำหรับหน้า Admin Dashboard
   * @returns {Promise<object>} Object ข้อมูลสรุปทั้งหมด
   */
  async getDashboardStats() {
    // ดึงข้อมูล Users และ Contests พร้อมกันเพื่อประสิทธิภาพ
    const [usersResponse, contestsResponse] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, role, first_name, last_name, email, created_at').order('created_at', { ascending: false }),
      supabaseAdmin.from('contests').select('id, category'),
    ]);

    if (usersResponse.error) throw new Error(`ดึงข้อมูล Users ไม่สำเร็จ: ${usersResponse.error.message}`);
    if (contestsResponse.error) throw new Error(`ดึงข้อมูล Contests ไม่สำเร็จ: ${contestsResponse.error.message}`);

    const users = usersResponse.data || [];
    const contests = contestsResponse.data || [];

    // ประมวลผลข้อมูล Users: นับจำนวนตาม Role
    const roleCounts = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, { admin: 0, user: 0, manager: 0, expert: 0 });

    // ประมวลผลข้อมูล Contests/News: นับจำนวนตาม Category
    const contentCounts = contests.reduce((acc, c) => {
      if (c.category === 'การประกวด') {
        acc.totalContests = (acc.totalContests || 0) + 1;
      } else {
        acc.totalNews = (acc.totalNews || 0) + 1;
      }
      return acc;
    }, { totalContests: 0, totalNews: 0 });

    // ดึงผู้ใช้ 5 คนล่าสุด
    const recentUsers = users.slice(0, 5).map(u => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      role: u.role,
    }));

    // ประกอบข้อมูลทั้งหมดเป็น Object เดียวแล้วส่งกลับ
    return {
      totalUsers: users.length,
      ...roleCounts,
      ...contentCounts,
      recentUsers,
    };
  }

  /**
   * อัปเดตข้อมูลผู้ใช้ (profiles): first_name, last_name, username, role
   */
  async updateUser(userId, payload) {
    const patch = {};
    const allowed = ['first_name', 'last_name', 'username', 'role'];
    for (const k of allowed) {
      if (payload[k] !== undefined) patch[k] = payload[k];
    }
    if (Object.keys(patch).length === 0) return { message: 'no-change' };
    if (patch.role && !['user', 'expert', 'manager', 'admin'].includes(patch.role)) {
      throw new Error('บทบาทไม่ถูกต้อง');
    }
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new Error(`อัปเดตผู้ใช้ไม่สำเร็จ: ${error.message}`);
    return data;
  }

  /**
   * อัปเดตอีเมล / รหัสผ่าน ผ่าน Supabase Auth (Admin only)
   * และซิงก์ email ไปตาราง profiles ด้วย (ถ้ามีการเปลี่ยน)
   */
  async updateUserCredentials(userId, payload) {
    const { email, password } = payload || {};
    if (!email && !password) throw new Error('กรุณาระบุอีเมลหรือรหัสผ่านอย่างน้อย 1 อย่าง');

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
    }
    if (password && String(password).length < 6) {
      throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }

    const updatePayload = {};
    if (email) updatePayload.email = email;
    if (password) updatePayload.password = password;

    const { data: updated, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload);
    if (error) {
      throw new Error(`อัปเดตบัญชีผู้ใช้ไม่สำเร็จ: ${error.message}`);
    }

    // Sync email to profiles if provided
    if (email) {
      const { error: profErr } = await supabaseAdmin
        .from('profiles')
        .update({ email })
        .eq('id', userId);
      if (profErr) {
        // ไม่ทำให้ล้มเหลว แต่บอกเตือน
        console.warn('[admin.updateUserCredentials] sync email to profiles failed:', profErr.message);
      }
    }

    return { message: 'อัปเดตข้อมูลเข้าสู่ระบบสำเร็จ' };
  }
}

module.exports = new AdminService();
