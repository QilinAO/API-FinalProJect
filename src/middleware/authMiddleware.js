// D:\ProJectFinal\Lasts\betta-fish-api\src\middleware\authMiddleware.js

const { supabase } = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'ไม่พบ Authentication Token' });
  }
  
  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(403).json({ error: 'Token ไม่ถูกต้องหรือไม่ได้รับอนุญาต' });
  }
  
  // [เพิ่มบรรทัดนี้] เพิ่มสายสืบเพื่อดู ID ของผู้ใช้
  console.log('[authMiddleware] Found User ID:', user.id); 
  
  req.userId = user.id; 
  next();
};

module.exports = authMiddleware;