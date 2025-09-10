// D:\ProJectFinal\Lasts\my-project\src\app.js

// =================================================================
// SECTION: IMPORTS & INITIALIZATION
// =================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorReporter = require('./utils/errorReporter');
const { handleDatabaseError } = require('./middleware/databaseErrorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// =================================================================
// SECTION: CORE MIDDLEWARE
// =================================================================

// Trust proxy for rate limiting and secure cookies in production
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// --- CORS Configuration for Local Development ---
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman, curl)
    if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('This origin is not allowed by CORS policy.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'คำขอมากเกินไป กรุณาลองใหม่ในภายหลัง' },
  handler: (req, res, _next, options) => {
    const err = new Error('Too many requests');
    err.status = 429;
    try { errorReporter.report(err, req, { context: 'rate-limit' }); } catch {}
    res.status(options.statusCode).json(options.message);
  },
});
app.use('/api', limiter);


// =================================================================
// SECTION: HEALTH CHECK & ROOT ROUTES
// =================================================================

const healthCheckHandler = (_req, res) => {
  try {
    res.json({
      success: true,
      status: 'OK',
      service: 'betta-fish-api',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Betta Fish API!',
    health_check: '/api/health',
    timestamp: new Date().toISOString()
  });
});


// =================================================================
// SECTION: API ROUTES
// =================================================================

// --- Route Imports ---
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const managerRoutes = require('./routes/managerRoutes');
const expertRoutes = require('./routes/expertRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const modelRoutes = require('./routes/modelRoutes');

// --- Route Middleware ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/model', modelRoutes);
app.use('/api', notificationRoutes); // General API routes like notifications

// Development-only stub for offline testing
if (process.env.OFFLINE_AUTH === 'true') {
  console.warn('⚠️ RUNNING IN OFFLINE AUTH MODE - STUBBING EXPERT DATA');
  const invitations = [{ id: 'inv_1', title: 'เชิญประเมินปลา A', status: 'pending' }];
  const assignments = [{ id: 'job_1', title: 'งานประเมิน #1001', status: 'assigned' }];
  app.get(['/api/experts/invitations', '/api/experts/me/invitations'], (req,res) => res.json(invitations));
  app.get(['/api/experts/assignments', '/api/experts/me/assignments'], (req,res) => res.json(assignments));
}


// =================================================================
// SECTION: ERROR HANDLING
// =================================================================

// Custom Database Error Handler
app.use(handleDatabaseError);

// 404 Not Found Handler (must be after all routes)
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint Not Found' });
});

// Global Error Handler (must be the last middleware)
app.use((err, req, res, _next) => {
  console.error('[Unhandled Error]', err.stack || err);
  try { errorReporter.report(err, req, { context: 'global-error' }); } catch {}

  const response = {
    success: false,
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  };

  if (err.details && Array.isArray(err.details)) {
    response.details = err.details;
  }

  // Avoid leaking stack trace in production
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.debug = { stack: err.stack, code: err.code };
  }

  res.status(err.status || 500).json(response);
});


// =================================================================
// SECTION: PROCESS & SERVER LIFECYCLE
// =================================================================

// --- Process-wide Error Handlers ---
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  try { errorReporter.reportProcessError(err, 'uncaughtException'); } catch {}
  // In a real production app, you might want to exit gracefully here
  // process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  console.error('❌ Unhandled Rejection:', err);
  try { errorReporter.reportProcessError(err, 'unhandledRejection'); } catch {}
});

// --- Server Startup ---
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🎉 Server Started Successfully!');
    console.log('='.repeat(50));
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🎯 CORS Origins: ${ALLOWED_ORIGINS.join(', ')}`);
    console.log('='.repeat(50));
    console.log('✨ Ready to serve requests!\n');
});

// --- Graceful Shutdown ---
function shutdown(signal) {
  console.log(`\n🔄 [${signal}] Received. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after a timeout
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcing shutdown.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// For testing purposes
module.exports = { app, server };