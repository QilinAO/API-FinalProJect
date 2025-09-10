// ======================================================================
// File: src/controllers/authController.js
// หน้าที่: จัดการ Logic การยืนยันตัวตน (Authentication) ทั้งหมด
// ======================================================================

const AuthService = require('../services/authService');
const UserService = require('../services/userService');
const checklistNotifier = require('../services/checklistNotifierService');

/**
 * Utility function สำหรับครอบ (wrap) async route handlers
 * เพื่อจัดการ Error และส่งต่อไปยัง Global Error Handler โดยอัตโนมัติ
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class AuthController {
  /**
   * ลงทะเบียนผู้ใช้ใหม่
   * Route: POST /api/auth/signup
   */
  signUp = asyncWrapper(async (req, res) => {
    const result = await AuthService.signUp(req.body);

    // ส่งการแจ้งเตือน (Fire-and-forget, ไม่ต้องรอ)
    if (result && result.user) {
      checklistNotifier.onUserSignUp(result.user).catch(err => 
        console.warn('[ChecklistNotifier] SignUp notification failed:', err.message)
      );
    }

    res.status(201).json({
      success: true,
      message: 'การสมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน',
      user: result.user,
    });
  });

  /**
   * เข้าสู่ระบบ
   * Route: POST /api/auth/signin
   */
  signIn = asyncWrapper(async (req, res) => {
    const { email, identifier, password } = req.body;
    let loginEmail = (email || identifier || '').toString().trim();

    if (!loginEmail || !password) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (!loginEmail.includes('@')) {
      const { supabase, supabaseAdmin } = require('../config/supabase');
      const username = loginEmail.toLowerCase();
      const { data: profileRow, error: findErr } = await supabase
        .from('profiles')
        .select('id, email, username')
        .ilike('username', username)
        .single();
      if (findErr || !profileRow?.id) {
        return res.status(400).json({ success: false, error: 'ไม่พบผู้ใช้ตามชื่อผู้ใช้ที่ระบุ' });
      }
      if (profileRow.email) {
        loginEmail = profileRow.email;
      } else {
        const { data: userRes, error: adminErr } = await supabaseAdmin.auth.admin.getUserById(profileRow.id);
        if (adminErr || !userRes?.user?.email) {
          return res.status(400).json({ success: false, error: 'ไม่สามารถดึงอีเมลของผู้ใช้ได้' });
        }
        loginEmail = userRes.user.email;
      }
    }

    const { token, profile } = await AuthService.signIn(loginEmail, password);

    if (profile) {
      checklistNotifier.onUserSignIn(profile.id).catch(err => 
        console.warn('[ChecklistNotifier] SignIn notification failed:', err.message)
      );
    }

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      profile,
    });
  });

  /**
   * ออกจากระบบ
   * Route: POST /api/auth/signout
   */
  signOut = asyncWrapper(async (req, res) => {
    await AuthService.signOut();
    res.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ',
    });
  });

  /**
   * ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่
   * Route: GET /api/auth/profile
   */
  getProfile = asyncWrapper(async (req, res) => {
    // req.userId ถูกแนบมาจาก authMiddleware
    const userId = req.userId;
    if (!userId) {
      // โดยปกติ authMiddleware จะดักจับเคสนี้ก่อนแล้ว แต่ใส่ไว้เพื่อความปลอดภัย
      return res.status(401).json({ success: false, error: 'ไม่ได้รับอนุญาต' });
    }

    const profile = await UserService.getProfile(userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลโปรไฟล์' });
    }

    res.json({ success: true, profile });
  });
}

module.exports = new AuthController();