const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// --- Import Routes (นำเข้าเส้นทาง API ต่างๆ) ---
// [แก้ไข] เปลี่ยนชื่อไฟล์ให้ตรงกับไฟล์ที่มีอยู่จริง
const authRoutes = require('./routes/auth'); // จาก 'authRoutes' เป็น 'auth'
const userRoutes = require('./routes/users'); // จาก 'userRoutes' เป็น 'users'
const managerRoutes = require('./routes/managerRoutes');
const expertRoutes = require('./routes/expertRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const publicRoutes = require('./routes/publicRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// === Middleware Setup (ตั้งค่า Middleware ทั่วไป) ===
app.use(helmet());

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true,
};
app.use(cors(corsOptions));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, error: 'คำขอมากเกินไป กรุณาลองใหม่ในภายหลัง' }
});
app.use('/api/', limiter); 

// === API Routes (กำหนดเส้นทาง API หลัก) ===
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// --- Health Check Endpoint ---
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// --- Error Handling Middleware (จัดการข้อผิดพลาด) ---
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- Server Start (เริ่ม Server) ---
app.listen(PORT, () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
  console.log(`   CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`); 
});