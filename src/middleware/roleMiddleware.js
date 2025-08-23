// D:\ProJectFinal\Lasts\betta-fish-api\src/middleware/roleMiddleware.js
/**
 * Middleware Factory สำหรับตรวจสอบ Role ของผู้ใช้
 * @param {string|string[]} requiredRoles - Role ที่ต้องการ (สามารถเป็น String เดียว หรือ Array ของ Strings)
 * @returns {Function} - Middleware function สำหรับ Express
 */
const checkRole = (requiredRoles) => {
  
  return (req, res, next) => {
    // 1. ดึง userRole ที่ถูกแนบมาจาก authMiddleware
    const userRole = req.userRole;

    // 2. ตรวจสอบว่ามี userRole หรือไม่
    if (!userRole) {
      return res.status(401).json({ 
        success: false, 
        error: 'ไม่สามารถระบุ Role ของผู้ใช้ได้' 
      });
    }

    // 3. ทำให้ requiredRoles เป็น Array เสมอ เพื่อให้รองรับทั้ง String และ Array
    const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    // 4. ตรวจสอบว่า Role ของผู้ใช้ อยู่ในรายการ Role ที่ได้รับอนุญาตหรือไม่
    if (!rolesToCheck.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' 
      });
    }
    
    // 5. หากสิทธิ์ถูกต้อง ให้ผ่านไปยังขั้นตอนถัดไป
    next();
  };
};

module.exports = checkRole;