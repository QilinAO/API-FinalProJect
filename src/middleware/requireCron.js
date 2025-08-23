// src/middleware/requireCron.js
const crypto = require('crypto');

function getTokens() {
  const raw = process.env.CRON_TOKENS || process.env.CRON_TOKEN || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a || ''));
  const B = Buffer.from(String(b || ''));
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

function bearer(req) {
  const h = req.headers['authorization'] || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1];
}

function ipAllowed(req) {
  const allow = process.env.CRON_IP_ALLOWLIST;
  if (!allow) return true;
  const ips = allow.split(',').map(s => s.trim()).filter(Boolean);
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '';
  return ips.includes(ip);
}

module.exports = function requireCron(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();

  if (!ipAllowed(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const tokens = getTokens();
  if (tokens.length === 0) {
    return res.status(500).json({ error: 'cron token not configured' });
  }

  const candidate = req.headers['x-cron-token'] || bearer(req);
  if (!candidate) {
    return res.status(401).json({ error: 'missing cron token' });
  }

  const ok = tokens.some(t => safeEqual(candidate, t));
  if (!ok) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  next();
};
