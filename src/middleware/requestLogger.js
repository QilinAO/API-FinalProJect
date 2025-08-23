// ======================================================================
// File: src/middleware/requestLogger.js
// หน้าที่: Log request details อย่างละเอียดเพื่อการ debug และ monitoring
// ======================================================================

const morgan = require('morgan');

// Custom token สำหรับแสดงข้อมูลเพิ่มเติม
morgan.token('user-id', (req) => req.userId || 'anonymous');
morgan.token('user-role', (req) => req.userRole || 'none');
morgan.token('request-id', (req) => req.id || 'no-id');

// Format สำหรับ Development
const devFormat = [
  ':method',
  ':url',
  ':status',
  ':res[content-length]',
  '-',
  ':response-time ms',
  '| User: :user-id (:user-role)',
  '| IP: :remote-addr'
].join(' ');

// Format สำหรับ Production (ละเอียดกว่า)
const prodFormat = [
  ':remote-addr',
  '-',
  ':remote-user',
  '[:date[clf]]',
  '":method :url HTTP/:http-version"',
  ':status',
  ':res[content-length]',
  '":referrer"',
  '":user-agent"',
  ':response-time ms',
  'user=:user-id',
  'role=:user-role',
  'req-id=:request-id'
].join(' ');

/**
 * สร้าง Morgan logger middleware ตาม environment
 */
const createRequestLogger = () => {
  const format = process.env.NODE_ENV === 'production' ? prodFormat : devFormat;
  
  return morgan(format, {
    // กรองไม่ให้ log health check และ static files
    skip: (req, res) => {
      // ไม่ log health check
      if (req.url === '/health') return true;
      
      // ไม่ log static files
      if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) return true;
      
      // ใน production ไม่ log request ที่ success ธรรมดา
      if (process.env.NODE_ENV === 'production' && res.statusCode < 400) {
        return false; // ยัง log อยู่ เผื่อต้องการ monitoring
      }
      
      return false;
    },
    
    // Stream ไปยัง console หรือ file ได้
    stream: {
      write: (message) => {
        // ตัด newline ออกเพื่อให้ console.log จัดการ format เอง
        const cleanMessage = message.trim();
        
        if (process.env.NODE_ENV === 'production') {
          console.log(`[HTTP] ${cleanMessage}`);
        } else {
          // ใน dev mode ใช้สีสันเพิ่มความสวยงาม
          console.log(`\x1b[36m[HTTP]\x1b[0m ${cleanMessage}`);
        }
      }
    }
  });
};

module.exports = createRequestLogger;
