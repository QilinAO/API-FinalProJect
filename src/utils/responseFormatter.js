// ======================================================================
// File: src/utils/responseFormatter.js
// หน้าที่: Standardize API Response Formats
// ======================================================================

/**
 * Success Response Formatter
 */
const success = (data = null, message = 'สำเร็จ', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Error Response Formatter
 */
const error = (message = 'เกิดข้อผิดพลาด', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  // เพิ่ม details ถ้ามี (เช่น validation errors)
  if (details) {
    response.details = details;
  }

  // เพิ่มข้อมูล debug ใน development mode
  if (process.env.NODE_ENV === 'development' && details?.debug) {
    response.debug = details.debug;
  }

  return response;
};

/**
 * Pagination Response Formatter
 */
const paginated = (data, pagination, message = 'สำเร็จ') => {
  return {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Express Response Helper
 */
const sendSuccess = (res, data = null, message = 'สำเร็จ', statusCode = 200) => {
  return res.status(statusCode).json(success(data, message, statusCode));
};

const sendError = (res, message = 'เกิดข้อผิดพลาด', statusCode = 500, details = null) => {
  return res.status(statusCode).json(error(message, statusCode, details));
};

const sendPaginated = (res, data, pagination, message = 'สำเร็จ', statusCode = 200) => {
  return res.status(statusCode).json(paginated(data, pagination, message));
};

/**
 * Validation Error Formatter
 */
const validationError = (errors) => {
  const details = Array.isArray(errors) ? errors : [errors];
  return error('ข้อมูลไม่ถูกต้อง', 400, details);
};

/**
 * Database Error Formatter
 */
const databaseError = (dbError, userMessage = 'เกิดข้อผิดพลาดในการติดต่อฐานข้อมูล') => {
  const details = {
    message: userMessage
  };

  // เพิ่มข้อมูล debug ใน development
  if (process.env.NODE_ENV === 'development') {
    details.debug = {
      code: dbError.code,
      originalMessage: dbError.message,
      detail: dbError.detail
    };
  }

  return error(userMessage, 400, details);
};

/**
 * Authentication Error Formatter
 */
const authError = (message = 'ไม่ได้รับการอนุญาต') => {
  return error(message, 401);
};

/**
 * Authorization Error Formatter
 */
const forbiddenError = (message = 'ไม่มีสิทธิ์เข้าถึง') => {
  return error(message, 403);
};

/**
 * Not Found Error Formatter
 */
const notFoundError = (resource = 'ข้อมูล') => {
  return error(`ไม่พบ${resource}ที่ต้องการ`, 404);
};

/**
 * Rate Limit Error Formatter
 */
const rateLimitError = (message = 'คำขอมากเกินไป กรุณาลองใหม่ในภายหลัง') => {
  return error(message, 429);
};

/**
 * Server Error Formatter
 */
const serverError = (message = 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์') => {
  return error(message, 500);
};

module.exports = {
  // Basic formatters
  success,
  error,
  paginated,
  
  // Express helpers
  sendSuccess,
  sendError,
  sendPaginated,
  
  // Specific error types
  validationError,
  databaseError,
  authError,
  forbiddenError,
  notFoundError,
  rateLimitError,
  serverError
};
