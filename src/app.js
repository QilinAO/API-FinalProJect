// D:\ProJectFinal\Lasts\my-project\src\app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorReporter = require('./utils/errorReporter');

const app = express();
const PORT = process.env.PORT || 5000; // Use .env or default to 5000

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Parse origins from environment or use defaults
const parseOrigins = (s) =>
  (s || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const DEFAULT_ORIGINS = 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000';
const ALLOWED_ORIGINS = parseOrigins(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || DEFAULT_ORIGINS);

// Configuration logging
console.log('🚀 Railway Configuration:');
console.log('📍 PORT:', process.env.PORT || 'Not set (will use 5000)');
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🔗 FRONTEND_URLS:', process.env.FRONTEND_URLS);
console.log('🎯 FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('🌐 ALLOWED_ORIGINS:', ALLOWED_ORIGINS);
console.log('📡 Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'Not set');

const corsOptions = {
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id'],
  optionsSuccessStatus: 200
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

// Health check routes for Railway
// Health check endpoints for Railway
app.get('/health', (_req, res) => {
  try {
    res.json({ 
      success: true, 
      status: 'OK', 
      service: 'betta-fish-api',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || PORT
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Health check failed',
      message: error.message 
    });
  }
});

app.get('/api/health', (_req, res) => {
  try {
    res.json({ 
      success: true, 
      status: 'OK', 
      service: 'betta-fish-api',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || PORT
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Health check failed',
      message: error.message 
    });
  }
});

app.get('/', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'Betta Fish API is running', 
    health: '/health',
    api: '/api/health',
    timestamp: new Date().toISOString()
  });
});

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
const userRoutes = require('./routes/users');
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
// --- DEV stub for expert invitations/assignments (local only) ---
if (process.env.OFFLINE_AUTH === 'true') {
  const invitations = [
    { id: 'inv_1', title: 'เชิญประเมินปลา A', status: 'pending', created_at: '2024-01-20T10:00:00Z' },
    { id: 'inv_2', title: 'เชิญประเมินปลา B', status: 'pending', created_at: '2024-01-22T09:00:00Z' }
  ];
  const assignments = [
    { id: 'job_1', title: 'งานประเมิน #1001', status: 'assigned', due_at: '2024-02-01T12:00:00Z' }
  ];
  // 支持多个路径：可用字符串数组，或正则写法需包含 /.../ 字面量
  const INVITE_PATHS = ['/api/experts/invitations', '/api/experts/me/invitations'];
  const ASSIGN_PATHS = ['/api/experts/assignments', '/api/experts/me/assignments'];
  app.get(INVITE_PATHS, (req,res) => res.json(invitations));
  app.get(ASSIGN_PATHS, (req,res) => res.json(assignments));
}
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

// Graceful startup - don't crash if environment variables are missing
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  if (err.message.includes('Missing Supabase environment variables')) {
    console.log('⚠️  API will start in limited mode without database connection');
    console.log('🔧 Please check Railway Environment Variables');
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Graceful shutdown handlers
function shutdown(signal) {
  console.log(`\n🔄 [${signal}] Shutting down gracefully...`);
  console.log('⏳ Closing HTTP server...');
  
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed successfully');
      console.log('👋 Goodbye!');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds if server doesn't close gracefully
    setTimeout(() => {
      console.log('⚠️  Force shutdown after timeout');
      process.exit(0);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon restart

// Global error handler
app.use((err, req, res, _next) => {
  try { errorReporter.report(err, req, { context: 'global-error' }); } catch {}
  
  // Local development error logging
  console.error('[Unhandled Error]', err.stack || err);

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

  // Add debug info in local development
  if (err.stack) {
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

// Create server instance for graceful shutdown
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🎉 Server Started Successfully!');
  console.log('='.repeat(50));
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health Check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🎯 CORS Origins: ${ALLOWED_ORIGINS.join(', ') || '(none)'}`);
  console.log(`📡 Railway Port: ${process.env.PORT || 'Not set'}`);
  console.log('='.repeat(50));
  console.log('✨ Ready to serve requests!\n');
});

// Export server for testing (if needed)
module.exports = { app, server };
