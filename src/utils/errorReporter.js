// ======================================================================
// File: src/utils/errorReporter.js
// ใช้ส่ง Error รายละเอียดไป Telegram แบบปลอดภัย (redact ข้อมูลอ่อนไหว)
// ======================================================================
const os = require('os');
const telegram = require('./errorTelegram');  // ต้องมี utils/telegram.js ที่มี sendMessage(), isEnabled()

// เปิด/ปิดการแจ้งเตือนด้วย env
function shouldNotify() {
  // ปิดเฉพาะตอน test; ที่เหลือตามสวิตช์ DEV_TELEGRAM_ERROR_NOTIFY
  if (process.env.NODE_ENV === 'test') return false;
  return telegram?.isEnabled?.() && process.env.DEV_TELEGRAM_ERROR_NOTIFY === '1';
}

// ตัดข้อมูลอ่อนไหวออกจาก headers/body
function sanitizeRequest(req = {}) {
  try {
    const headers = { ...(req.headers || {}) };
    // ลบความลับ
    delete headers.authorization;
    delete headers.cookie;
    delete headers['x-supabase-auth'];
    delete headers['x-api-key'];

    // body/query ที่ยาวเกิน ตัดให้สั้น
    const trim = (v) => {
      if (v == null) return v;
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      return s.length > 800 ? s.slice(0, 800) + '…(trimmed)' : s;
    };

    return {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userId: req.userId || null,
      userRole: req.userRole || null,
      headers,
      query: req.query ? JSON.parse(trim(req.query)) : req.query,
      body: req.body ? JSON.parse(trim(req.body)) : req.body,
    };
  } catch {
    // ถ้า parse ไม่ได้ ให้คืนข้อมูลย่อย ๆ แทน
    return {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userId: req.userId || null,
      userRole: req.userRole || null,
    };
  }
}

// สร้างข้อความสั้น ๆ ไม่เกิน 4096 ตัวอักษร (ลิมิตข้อความ Telegram)
function clip(text, max = 3900) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '\n…(clipped)' : text;
}

// สร้างข้อความแจ้งเตือน
function buildMessage(err, req, extra = {}) {
  const when = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const env = process.env.NODE_ENV || 'development';
  const host = os.hostname();

  const reqInfo = req ? sanitizeRequest(req) : null;

  const lines = [
    '🚨 *SERVER ERROR*',
    `เวลา: ${when}`,
    `สิ่งแวดล้อม: ${env} @ ${host}`,
  ];

  if (reqInfo) {
    lines.push(
      `เมธอด: ${reqInfo.method || '-'} | URL: ${reqInfo.url || '-'}`,
      `ผู้ใช้: ${reqInfo.userId || '-'} (role: ${reqInfo.userRole || '-'})`,
      reqInfo.ip ? `IP: ${reqInfo.ip}` : null,
    );
  }

  if (extra && extra.context) {
    lines.push(`บริบท: ${extra.context}`);
  }
  if (extra && extra.note) {
    lines.push(`โน้ต: ${extra.note}`);
  }

  lines.push(
    '',
    `ข้อความผิดพลาด: ${err?.message || String(err)}`,
    '',
    '*Stack (ส่วนแรก)*:',
    '```',
    clip(String(err?.stack || '(no stack)')),
    '```'
  );

  if (reqInfo) {
    lines.push(
      '',
      '*Request (safe)*',
      '```',
      clip(JSON.stringify(reqInfo, null, 2)),
      '```'
    );
  }

  return lines.filter(Boolean).join('\n');
}

/**
 * รายงาน error ไป Telegram (ไม่ throw; ไม่ทำให้ flow หลักพัง)
 */
async function report(err, req = null, extra = {}) {
  try {
    if (!shouldNotify()) return;
    const text = buildMessage(err, req, extra);
    await telegram.sendMessage(text, { parse_mode: 'Markdown' });
  } catch (e) {
    // อย่าทำให้ระบบล้มเพราะการแจ้งเตือนล้มเหลว
    console.warn('[errorReporter] sendMessage failed:', e?.message || e);
  }
}

/**
 * ใช้ wrap async handler เพื่อให้ error โยนไป next() เสมอ
 * ตัวนี้เน้น flow express ที่ไม่ต้องเขียน try/catch ในทุก ๆ route
 */
const wrap = (fn, extraMeta = {}) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // ใส่ report เบื้องต้น (ออปชัน; หรือจะไปแจ้งใน global error handler อย่างเดียวก็ได้)
      report(err, req, { context: extraMeta.context || 'route' }).finally(() => next(err));
    });
  };
};

/**
 * รายงาน error ที่เกิดนอก request (เช่น process-level)
 */
async function reportProcessError(err, tag = 'process') {
  try {
    if (!shouldNotify()) return;
    const when = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const lines = [
      `🔥 *${tag.toUpperCase()} ERROR*`,
      `เวลา: ${when}`,
      '',
      `ข้อความผิดพลาด: ${err?.message || String(err)}`,
      '',
      '*Stack (ส่วนแรก)*:',
      '```',
      clip(String(err?.stack || '(no stack)')),
      '```',
    ].join('\n');
    await telegram.sendMessage(lines, { parse_mode: 'Markdown' });
  } catch (e) {
    console.warn('[errorReporter] process error notify failed:', e?.message || e);
  }
}

module.exports = {
  report,
  wrap,
  reportProcessError,
};
