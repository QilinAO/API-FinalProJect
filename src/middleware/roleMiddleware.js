// D:\ProJectFinal\Lasts\betta-fish-api\src\middleware\roleMiddleware.js
const { supabase } = require('../config/supabase');

const checkRole = (requiredRole) => async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'ไม่สามารถระบุตัวตนผู้ใช้ได้' });
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.userId)
      .single();
    
    if (error || !profile) {
      return res.status(404).json({ error: 'ไม่พบโปรไฟล์ผู้ใช้' });
    }

    if (profile.role !== requiredRole) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
    }
    
    next();
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
  }
};
module.exports = checkRole;