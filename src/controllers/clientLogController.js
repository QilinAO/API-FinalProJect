// D:\ProJectFinal\Lasts\betta-fish-api\src\controllers\clientLogController.js
const { supabaseAdmin } = require('../config/supabase');
const devNotify = require('../notifiers/devTelegramNotifier');

function safe(obj, max = 8000) {
  try { return JSON.stringify(obj).slice(0, max); } catch { return null; }
}

async function tryInsertToDB(row) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('client_logs').insert([row]);
  } catch (e) {
    console.warn('[client-logs] insert db failed:', e?.message || e);
  }
}

exports.create = async (req, res) => {
  try {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      null;

    const {
      level = 'error',
      message = 'Client error',
      stack = null,
      url = null,
      route = null,
      ua = null,
      meta = null,
      ts = new Date().toISOString(),
    } = req.body || {};

    const row = {
      level: String(level).toLowerCase().slice(0, 16),
      message: String(message).slice(0, 2000),
      stack: stack ? String(stack).slice(0, 8000) : null,
      url: url ? String(url).slice(0, 1000) : null,
      route: route ? String(route).slice(0, 255) : null,
      ua: ua ? String(ua).slice(0, 1000) : null,
      meta_json: meta ? safe(meta, 4000) : null,
      ip,
      created_at: new Date(ts).toISOString(),
    };

    // ส่งเข้า Telegram (dev/log)
    try {
      await devNotify.onClientError({
        level: row.level,
        message: row.message,
        url: row.url,
        route: row.route,
        ua: row.ua,
        ip: row.ip,
        stack: row.stack,
      });
    } catch (e) {
      console.warn('[devNotify] onClientError failed:', e?.message || e);
    }

    // (ออปชัน) บันทึกลง DB ถ้าคุณมีตาราง client_logs
    await tryInsertToDB(row);

    res.status(201).json({ success: true });
  } catch (e) {
    console.error('[client-logs] create error:', e?.message || e);
    res.status(500).json({ success: false, error: 'log failed' });
  }
};
