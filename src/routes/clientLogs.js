// D:\ProJectFinal\Lasts\betta-fish-api\src\routes\clientLogs.js
const router = require('express').Router();
const ctrl = require('../controllers/clientLogController');

// ไม่ต้อง auth ก็ได้ (เป็นเพียงช่องรับ error จาก client)
// ถ้าต้องการล็อก อาจเพิ่ม rate-limit เฉพาะ path นี้ในอนาคต
router.post('/', ctrl.create);

module.exports = router;
