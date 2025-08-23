// src/utils/errorTelegram.js
const axios = require("axios");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function isEnabled() {
  return Boolean(BOT_TOKEN && CHAT_ID) && process.env.DEV_TELEGRAM_ERROR_NOTIFY === '1';
}

async function sendMessage(text, options = {}) {
  if (!isEnabled()) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'Markdown',
      ...options,
    }, { timeout: 8000 });
  } catch (err) {
    console.warn("[errorTelegram] sendMessage failed:", err?.message || err);
  }
}

module.exports = { isEnabled, sendMessage };