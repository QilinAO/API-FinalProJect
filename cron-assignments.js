// ======================================================================
// File: cron-assignments.js
// หน้าที่: Cron job สำหรับประมวลผล auto-assignments ทุก 5 นาที
// ======================================================================

require('dotenv').config();

const autoAssignmentService = require('./src/services/autoAssignmentService');

async function runAutoAssignments() {
  const startTime = Date.now();
  
  try {
    console.log(`[${new Date().toISOString()}] Starting auto-assignment cron job...`);
    
    const createdCount = await autoAssignmentService.processUnassignedSubmissions();
    
    const duration = Date.now() - startTime;
    
    console.log(`[${new Date().toISOString()}] Auto-assignment completed in ${duration}ms`);
    console.log(`[${new Date().toISOString()}] Created ${createdCount} assignments`);
    
    // Log เพื่อ monitoring
    if (process.env.NODE_ENV === 'production') {
      // ส่งไปยัง monitoring service หรือ log aggregator
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        job: 'auto-assignment',
        duration,
        createdAssignments: createdCount,
        status: 'success'
      }));
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`[${new Date().toISOString()}] Auto-assignment failed after ${duration}ms:`, error.message);
    
    // Log error for monitoring
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        job: 'auto-assignment',
        duration,
        status: 'error',
        error: error.message
      }));
    }
    
    // ไม่ให้ process exit เพื่อให้ cron ทำงานต่อไป
  }
}

// ตั้งเวลาให้ทำงานทุก 5 นาที
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

console.log(`[${new Date().toISOString()}] Auto-assignment cron job started`);
console.log(`[${new Date().toISOString()}] Running every ${INTERVAL_MS / 1000} seconds`);

// รันครั้งแรกทันที
runAutoAssignments();

// ตั้งเวลาให้รันต่อไป
setInterval(runAutoAssignments, INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] Auto-assignment cron job stopping...`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] Auto-assignment cron job terminating...`);
  process.exit(0);
});
