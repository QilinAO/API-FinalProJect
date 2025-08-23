#!/usr/bin/env node
// ======================================================================
// File: scripts/processAssignments.js
// หน้าที่: Script สำหรับประมวลผล auto-assignments (ใช้กับ cron หรือ manual run)
// ======================================================================

const autoAssignmentService = require('../src/services/autoAssignmentService');

async function main() {
  try {
    console.log('🚀 Starting auto-assignment processing...');
    console.log('⏰ Time:', new Date().toLocaleString('th-TH'));
    
    const createdCount = await autoAssignmentService.processUnassignedSubmissions();
    
    console.log(`✅ Processing completed successfully!`);
    console.log(`📊 Created ${createdCount} new assignments`);
    
    if (createdCount > 0) {
      console.log(`🎯 ${createdCount} submissions have been assigned to experts`);
    } else {
      console.log('ℹ️  No unassigned submissions found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during auto-assignment processing:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
