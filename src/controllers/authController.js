// D:\ProJectFinal\Lasts\betta-fish-api\src\controllers\authController.js (ฉบับแก้ไข)
const AuthService = require('../services/authService');
const UserService = require('../services/userService'); // [เพิ่ม] เรียกใช้ UserService

class AuthController {
    async signUp(req, res) {
        try {
            const data = await AuthService.signUp(req.body);
            res.status(201).json({
                success: true,
                message: 'การสมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน',
                user: data.user
            });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async signIn(req, res) {
        try {
            const { email, password } = req.body;
            // Service จะคืน { token, profile } กลับมา
            const data = await AuthService.signIn(email, password);
            
            res.json({
                success: true,
                message: 'เข้าสู่ระบบสำเร็จ',
                token: data.token,       // [แก้ไข] ใช้ data.token ที่ถูกต้อง
                profile: data.profile    // [แก้ไข] ใช้ data.profile ที่ถูกต้อง
            });
        } catch (error) {
            res.status(401).json({ success: false, error: error.message });
        }
    }

    async signOut(req, res) {
        try {
            const result = await AuthService.signOut();
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getProfile(req, res) {
        try {
            // [แก้ไข] เปลี่ยนไปเรียกใช้ getProfile จาก "UserService" ที่มีฟังก์ชันนี้อยู่จริง
            const profile = await UserService.getProfile(req.userId); 
            
            if (!profile) {
                return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลโปรไฟล์' });
            }
            
            // [แก้ไข] ส่ง profile ที่ได้กลับไปตรงๆ ใน property ที่ชื่อ profile
            res.json({ success: true, profile: profile }); 
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new AuthController();