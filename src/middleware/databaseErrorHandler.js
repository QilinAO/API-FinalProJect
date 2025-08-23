// ======================================================================
// File: src/middleware/databaseErrorHandler.js
// หน้าที่: จัดการ Database Errors ให้เป็น User-friendly Messages
// ======================================================================

/**
 * แปลง Database Error Codes เป็นข้อความที่เข้าใจง่าย
 */
const getDatabaseErrorMessage = (error) => {
  if (!error) return null;

  const code = error.code;
  const message = error.message || '';
  const detail = error.detail || '';

  // PostgreSQL Error Codes
  switch (code) {
    // Foreign Key Violations
    case '23503':
      if (message.includes('submissions_contest_id_fkey')) {
        return 'ไม่พบการประกวดที่ระบุ กรุณาตรวจสอบรหัสการประกวด';
      }
      if (message.includes('submissions_owner_id_fkey')) {
        return 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่';
      }
      if (message.includes('assignments_submission_id_fkey')) {
        return 'ไม่พบข้อมูลผลงานที่ต้องการประเมิน';
      }
      if (message.includes('assignments_evaluator_id_fkey')) {
        return 'ไม่พบข้อมูลผู้ประเมิน กรุณาตรวจสอบข้อมูล';
      }
      if (message.includes('contest_judges_judge_id_fkey')) {
        return 'ไม่พบข้อมูลผู้เชี่ยวชาญที่ระบุ';
      }
      if (message.includes('contest_judges_contest_id_fkey')) {
        return 'ไม่พบการประกวดที่ต้องการมอบหมายกรรมการ';
      }
      if (message.includes('contests_created_by_fkey')) {
        return 'ไม่พบข้อมูลผู้สร้างการประกวด';
      }
      return 'ข้อมูลอ้างอิงไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่เกี่ยวข้อง';

    // Unique Constraint Violations
    case '23505':
      if (message.includes('profiles_username_key')) {
        return 'ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่อผู้ใช้อื่น';
      }
      if (message.includes('profiles_email_key')) {
        return 'อีเมลนี้ถูกใช้แล้ว กรุณาใช้อีเมลอื่น';
      }
      if (message.includes('contest_judges') && message.includes('judge_id')) {
        return 'ผู้เชี่ยวชาญท่านนี้ถูกมอบหมายให้เป็นกรรมการในการประกวดนี้แล้ว';
      }
      if (message.includes('user_telegram_pkey')) {
        return 'บัญชี Telegram นี้ถูกเชื่อมต่อกับผู้ใช้อื่นแล้ว';
      }
      return 'ข้อมูลซ้ำกับที่มีอยู่แล้วในระบบ';

    // Check Constraint Violations
    case '23514':
      if (message.includes('contest_judges_status_check')) {
        return 'สถานะกรรมการไม่ถูกต้อง ต้องเป็น pending, accepted, หรือ declined';
      }
      if (message.includes('contests_category_check')) {
        return 'ประเภทการประกวดไม่ถูกต้อง';
      }
      if (message.includes('contests_status_check')) {
        return 'สถานะการประกวดไม่ถูกต้อง';
      }
      return 'ข้อมูลไม่ผ่านเงื่อนไขการตรวจสอบ';

    // Not Null Violations
    case '23502':
      if (message.includes('submissions') && message.includes('owner_id')) {
        return 'จำเป็นต้องระบุเจ้าของผลงาน';
      }
      if (message.includes('submissions') && message.includes('fish_name')) {
        return 'กรุณากรอกชื่อปลากัด';
      }
      if (message.includes('submissions') && message.includes('fish_type')) {
        return 'กรุณาระบุประเภทปลากัด';
      }
      if (message.includes('contests') && message.includes('name')) {
        return 'กรุณากรอกชื่อการประกวด';
      }
      if (message.includes('contests') && message.includes('category')) {
        return 'กรุณาระบุประเภทการประกวด';
      }
      if (message.includes('profiles') && message.includes('username')) {
        return 'กรุณากรอกชื่อผู้ใช้';
      }
      if (message.includes('profiles') && message.includes('email')) {
        return 'กรุณากรอกอีเมล';
      }
      return 'ข้อมูลที่จำเป็นขาดหายไป';

    // Invalid UUID
    case '22P02':
      if (message.includes('invalid input syntax for type uuid')) {
        return 'รหัสอ้างอิงไม่ถูกต้อง';
      }
      return 'รูปแบบข้อมูลไม่ถูกต้อง';

    // Connection Issues
    case '57P01':
      return 'การเชื่อมต่อฐานข้อมูลขาดหาย กรุณาลองใหม่อีกครั้ง';

    case '53300':
      return 'ฐานข้อมูลไม่สามารถรับการเชื่อมต่อเพิ่มได้ กรุณาลองใหม่ในอีกสักครู่';

    // Permission Denied
    case '42501':
      return 'ไม่มีสิทธิ์ในการดำเนินการนี้';

    // RLS Policy Violation
    case '42RLS':
      return 'ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้';

    default:
      // Handle Supabase-specific errors
      if (message.includes('Row Level Security')) {
        return 'ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้';
      }
      if (message.includes('JWT')) {
        return 'โทเค็นการเข้าถึงไม่ถูกต้องหรือหมดอายุ';
      }
      if (message.includes('duplicate key')) {
        return 'ข้อมูลซ้ำกับที่มีอยู่แล้วในระบบ';
      }

      // Generic messages for unknown errors
      return 'เกิดข้อผิดพลาดในการติดต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง';
  }
};

/**
 * Middleware สำหรับจัดการ Database Errors
 */
const handleDatabaseError = (error, req, res, next) => {
  // ตรวจสอบว่าเป็น Database Error หรือไม่
  if (error && (error.code || error.detail || (error.message && error.message.includes('duplicate')))) {
    const userMessage = getDatabaseErrorMessage(error);
    
    // Log original error สำหรับ debugging
    console.error('[DB Error]', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      hint: error.hint,
      userMessage,
      url: req.originalUrl,
      method: req.method,
      userId: req.userId
    });

    return res.status(400).json({
      success: false,
      error: userMessage,
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          code: error.code,
          originalMessage: error.message,
          detail: error.detail
        }
      })
    });
  }

  // ถ้าไม่ใช่ Database Error ให้ส่งต่อไปยัง error handler ตัวถัดไป
  next(error);
};

/**
 * Wrapper function สำหรับ Controller ที่ทำงานกับ Database
 */
const withDatabaseErrorHandling = (controllerFn) => {
  return async (req, res, next) => {
    try {
      await controllerFn(req, res, next);
    } catch (error) {
      handleDatabaseError(error, req, res, next);
    }
  };
};

module.exports = {
  getDatabaseErrorMessage,
  handleDatabaseError,
  withDatabaseErrorHandling
};
