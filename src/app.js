// D:\ProJectFinal\Lasts\my-project\src\app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorReporter = require('./utils/errorReporter');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const parseOrigins = (s) =>
  (s || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

// 确保包含端口5175
const DEFAULT_ORIGINS = 'http://localhost:5173,http://localhost:5174,http://localhost:5175';
const ALLOWED_ORIGINS = parseOrigins(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || DEFAULT_ORIGINS);

// 调试信息
console.log('CORS Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URLS:', process.env.FRONTEND_URLS);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('ALLOWED_ORIGINS:', ALLOWED_ORIGINS);

const corsOptions = {
  origin: true, // 开发环境下允许所有origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id'],
  optionsSuccessStatus: 200 // 某些浏览器需要这个
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use((err, req, res, next) => {
  if (err && String(err.message || '').includes('not allowed by CORS')) {
    try { errorReporter.report(err, req, { context: 'CORS' }); } catch {}
    return res.status(403).json({ success: false, error: err.message });
  }
  return next(err);
});

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ success: true, status: 'OK' }));
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'OK', service: 'betta-fish-api' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'คำขอมากเกินไป กรุณาลองใหม่ในภายหลัง' },
  handler: (req, res, _next, options) => {
    const err = new Error('Too many requests');
    err.status = 429;
    try { errorReporter.report(err, req, { context: 'rate-limit' }); } catch {}
    res.status(429).json(options.message);
  },
});
app.use('/api', limiter);

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const managerRoutes = require('./routes/managerRoutes');
const expertRoutes = require('./routes/expertRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const modelRoutes = require('./routes/modelRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/model', modelRoutes);
app.use('/api', notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint Not Found' });
});

// Import enhanced error handlers
const { handleDatabaseError } = require('./middleware/databaseErrorHandler');

// Database error handling middleware (before global error handler)
app.use(handleDatabaseError);

// Global error handler
app.use((err, req, res, _next) => {
  try { errorReporter.report(err, req, { context: 'global-error' }); } catch {}
  
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Unhandled Error]', err.stack || err);
  } else {
    console.error('[Unhandled Error]', err.message);
  }

  // Enhanced error response with validation details
  const response = {
    success: false,
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  };

  // Add validation details if available
  if (err.details && Array.isArray(err.details)) {
    response.details = err.details;
  }

  // Add debug info in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.debug = {
      stack: err.stack,
      code: err.code
    };
  }

  res.status(err.status || 500).json(response);
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  try { errorReporter.reportProcessError(err, 'unhandledRejection'); } catch {}
});

process.on('uncaughtException', (err) => {
  try { errorReporter.reportProcessError(err, 'uncaughtException'); } catch {}
});

app.listen(PORT, () => {
  console.log(`Server is flying on port ${PORT}`);
  console.log(`Allowed CORS origins: ${ALLOWED_ORIGINS.join(', ') || '(none)'}`);
});
