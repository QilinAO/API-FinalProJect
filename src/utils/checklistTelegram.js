// src/utils/checklistTelegram.js
const axios = require("axios");

const BOT_TOKEN = process.env.CHECKLIST_BOT_TOKEN;
const CHAT_ID = process.env.CHECKLIST_CHAT_ID;

function isEnabled() {
  return Boolean(BOT_TOKEN && CHAT_ID) && process.env.DEV_CHECKLIST_NOTIFY === '1';
}

async function sendMessage(text, options = {}) {
  if (!isEnabled()) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML', // ใช้ HTML เพื่อจัดรูปแบบได้สวยงามกว่า
      ...options,
    }, { timeout: 8000 });
  } catch (err) {
    console.warn("[checklistTelegram] sendMessage failed:", err?.message || err);
  }
}

module.exports = { isEnabled, sendMessage };