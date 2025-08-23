const axios = require("axios");

const BOT_TOKEN = process.env.DEV_BOT_TOKEN;
const CHAT_ID = process.env.DEV_CHAT_ID;

function isEnabled() {
  // ตรวจสอบ DEV_TELEGRAM_NOTIFY เพื่อเปิด/ปิด
  return Boolean(BOT_TOKEN && CHAT_ID) && process.env.DEV_TELEGRAM_NOTIFY === '1';
}

async function sendMessage(text, options = {}) {
  if (!isEnabled()) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML', // ใช้ HTML เพื่อให้ข้อความสวยงาม
      disable_web_page_preview: true,
      ...options,
    }, { timeout: 8000 });
  } catch (err) {
    console.warn("[devTelegram] sendMessage failed:", err?.message || err);
  }
}

async function sendMediaGroup(media = []) {
  if (!isEnabled() || !Array.isArray(media) || media.length === 0) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      media,
      disable_notification: true,
    }, { timeout: 15000 });
  } catch (err) {
    console.warn("[devTelegram] sendMediaGroup failed:", err?.message || err);
  }
}

module.exports = { isEnabled, sendMessage, sendMediaGroup };