// src/utils/telegram.js
const axios = require("axios");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

function isEnabled() {
  return Boolean(BOT_TOKEN && CHAT_ID);
}

async function sendMessage(text) {
  if (!isEnabled()) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(
      url,
      {
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',           // <<< เพิ่มบรรทัดนี้
        disable_web_page_preview: true,
      },
      { timeout: 8000 }
    );
  } catch (err) {
    console.warn("[telegram] sendMessage failed:", err?.message || err);
  }
}

/**
 * ส่งอัลบัมสื่อ (ภาพ/วิดีโอ) สูงสุด 10 รายการ
 * media: [{ type: 'photo'|'video', media: 'https://...', caption?: '...' }]
 */
async function sendMediaGroup(media = []) {
  if (!isEnabled() || !Array.isArray(media) || media.length === 0) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`;
  try {
    await axios.post(
      url,
      {
        chat_id: CHAT_ID,
        media,
        disable_notification: true,
      },
      { timeout: 15000 }
    );
  } catch (err) {
    console.warn("[telegram] sendMediaGroup failed:", err?.message || err);
  }
}

module.exports = { isEnabled, sendMessage, sendMediaGroup };
