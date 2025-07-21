const { supabaseAdmin } = require('../config/supabase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'กรุณาเข้าสู่ระบบก่อน' 
      });
    }

    // ตรวจสอบ JWT token ด้วย Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ 
        success: false,
        error: 'Token ไม่ถูกต้องหรือหมดอายุ' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' 
    });
  }
};

module.exports = { authenticateToken };