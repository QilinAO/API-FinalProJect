// ======================================================================
// File: src/middleware/dataValidation.js
// หน้าที่: Enhanced Data Validation สำหรับ Database Fields
// ======================================================================

const Joi = require('joi');

// ==================== Custom Validators ====================

/**
 * UUID Validator
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' }).messages({
  'string.guid': 'รหัสอ้างอิงไม่ถูกต้อง',
  'any.required': 'จำเป็นต้องมีรหัสอ้างอิง'
});

/**
 * Fish Age Validator (ตาม database constraint)
 */
const fishAgeSchema = Joi.number().integer().min(0).max(120).allow(null).messages({
  'number.base': 'อายุปลาต้องเป็นตัวเลข',
  'number.integer': 'อายุปลาต้องเป็นจำนวนเต็ม',
  'number.min': 'อายุปลาต้องไม่น้อยกว่า 0 เดือน',
  'number.max': 'อายุปลาต้องไม่เกิน 120 เดือน'
});

/**
 * Contest Status Validator
 */
const contestStatusSchema = Joi.string().valid(
  'draft', 'กำลังดำเนินการ', 'ปิดรับสมัคร', 'ตัดสิน', 'ประกาศผล', 'ยกเลิก', 'published', 'archived'
).messages({
  'any.only': 'สถานะการประกวดไม่ถูกต้อง'
});

/**
 * Contest Category Validator
 */
const contestCategorySchema = Joi.string().valid(
  'การประกวด', 'ข่าวสารทั่วไป', 'ข่าวสารประชาสัมพันธ์'
).messages({
  'any.only': 'ประเภทการประกวดไม่ถูกต้อง'
});

/**
 * Judge Status Validator
 */
const judgeStatusSchema = Joi.string().valid('pending', 'accepted', 'declined').messages({
  'any.only': 'สถานะกรรมการต้องเป็น pending, accepted, หรือ declined'
});

/**
 * Submission Status Validator
 */
const submissionStatusSchema = Joi.string().valid('pending', 'approved', 'rejected').messages({
  'any.only': 'สถานะผลงานต้องเป็น pending, approved, หรือ rejected'
});

/**
 * Assignment Status Validator
 */
const assignmentStatusSchema = Joi.string().valid('pending', 'evaluated', 'rejected').messages({
  'any.only': 'สถานะการประเมินต้องเป็น pending, evaluated, หรือ rejected'
});

/**
 * User Role Validator
 */
const userRoleSchema = Joi.string().valid('user', 'expert', 'manager', 'admin').messages({
  'any.only': 'บทบาทผู้ใช้ไม่ถูกต้อง'
});

/**
 * Score Validator (0-100)
 */
const scoreSchema = Joi.number().min(0).max(100).precision(2).allow(null).messages({
  'number.base': 'คะแนนต้องเป็นตัวเลข',
  'number.min': 'คะแนนต้องไม่น้อยกว่า 0',
  'number.max': 'คะแนนต้องไม่เกิน 100',
  'number.precision': 'คะแนนมีทศนิยมได้สูงสุด 2 ตำแหน่ง'
});

// ==================== Validation Schemas ====================

/**
 * Submission Creation Validation
 */
const submissionCreateSchema = Joi.object({
  betta_name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'กรุณากรอกชื่อปลากัด',
    'string.min': 'ชื่อปลากัดต้องมีอย่างน้อย 1 ตัวอักษร',
    'string.max': 'ชื่อปลากัดต้องไม่เกิน 100 ตัวอักษร',
    'any.required': 'กรุณากรอกชื่อปลากัด'
  }),
  betta_type: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'กรุณาระบุประเภทปลากัด',
    'string.min': 'ประเภทปลากัดต้องมีอย่างน้อย 1 ตัวอักษร',
    'string.max': 'ประเภทปลากัดต้องไม่เกิน 50 ตัวอักษร',
    'any.required': 'กรุณาระบุประเภทปลากัด'
  }),
  betta_age_months: fishAgeSchema,
  contest_id: uuidSchema.allow(null)
});

/**
 * Contest Creation Validation
 */
const contestCreateSchema = Joi.object({
  name: Joi.string().min(1).max(200).required().messages({
    'string.empty': 'กรุณากรอกชื่อการประกวด',
    'string.min': 'ชื่อการประกวดต้องมีอย่างน้อย 1 ตัวอักษร',
    'string.max': 'ชื่อการประกวดต้องไม่เกิน 200 ตัวอักษร',
    'any.required': 'กรุณากรอกชื่อการประกวด'
  }),
  short_description: Joi.string().max(500).allow(null, '').messages({
    'string.max': 'คำอธิบายสั้นต้องไม่เกิน 500 ตัวอักษร'
  }),
  full_description: Joi.string().allow(null, ''),
  category: contestCategorySchema.required(),
  status: contestStatusSchema.default('draft'),
  start_date: Joi.date().iso().allow(null).messages({
    'date.format': 'รูปแบบวันที่เริ่มต้นไม่ถูกต้อง'
  }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null).messages({
    'date.format': 'รูปแบบวันที่สิ้นสุดไม่ถูกต้อง',
    'date.min': 'วันที่สิ้นสุดต้องไม่เร็วกว่าวันที่เริ่มต้น'
  }),
  is_vote_open: Joi.boolean().default(false),
  allowed_subcategories: Joi.array().items(Joi.string()).default([]),
  poster_url: Joi.string().uri().allow(null, '').messages({
    'string.uri': 'URL โปสเตอร์ไม่ถูกต้อง'
  })
});

/**
 * Profile Update Validation
 */
const profileUpdateSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).messages({
    'string.alphanum': 'ชื่อผู้ใช้ต้องเป็นตัวอักษรและตัวเลขเท่านั้น',
    'string.min': 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร',
    'string.max': 'ชื่อผู้ใช้ต้องไม่เกิน 30 ตัวอักษร'
  }),
  firstName: Joi.string().min(1).max(50).messages({
    'string.min': 'ชื่อต้องมีอย่างน้อย 1 ตัวอักษร',
    'string.max': 'ชื่อต้องไม่เกิน 50 ตัวอักษร'
  }),
  lastName: Joi.string().min(1).max(50).messages({
    'string.min': 'นามสกุลต้องมีอย่างน้อย 1 ตัวอักษร',
    'string.max': 'นามสกุลต้องไม่เกิน 50 ตัวอักษร'
  }),
  role: userRoleSchema,
  specialities: Joi.array().items(Joi.string()).default([])
});

/**
 * Assignment Validation
 */
const assignmentSchema = Joi.object({
  submission_id: uuidSchema.required(),
  evaluator_id: uuidSchema.required(),
  status: assignmentStatusSchema.default('pending'),
  scores: Joi.object().allow(null),
  total_score: scoreSchema,
  reject_reason: Joi.string().max(500).allow(null, '').messages({
    'string.max': 'เหตุผลการปฏิเสธต้องไม่เกิน 500 ตัวอักษร'
  })
});

// ==================== Middleware Functions ====================

/**
 * สร้าง Validation Middleware
 */
const createValidator = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        details: errors
      });
    }

    // อัพเดต request ด้วยข้อมูลที่ validated แล้ว
    req[source] = value;
    next();
  };
};

/**
 * UUID Parameter Validator
 */
const validateUuidParam = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];
    const { error } = uuidSchema.validate(value);

    if (error) {
      return res.status(400).json({
        success: false,
        error: `${paramName} ไม่ถูกต้อง`
      });
    }

    next();
  };
};

/**
 * File Validation
 */
const validateFiles = (req, res, next) => {
  const files = req.files;
  const errors = [];

  // ตรวจสอบรูปภาพ
  if (files?.images) {
    if (files.images.length === 0) {
      errors.push('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป');
    } else if (files.images.length > 3) {
      errors.push('อัปโหลดรูปภาพได้สูงสุด 3 รูป');
    }

    // ตรวจสอบขนาดและประเภทไฟล์
    for (const file of files.images) {
      if (file.size > 50 * 1024 * 1024) { // 50MB
        errors.push(`ไฟล์ ${file.originalname} มีขนาดใหญ่เกินไป (สูงสุด 50MB)`);
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        errors.push(`ไฟล์ ${file.originalname} ไม่ใช่รูปภาพที่รองรับ`);
      }
    }
  }

  // ตรวจสอบวิดีโอ
  if (files?.video) {
    const videoFile = files.video[0];
    if (videoFile.size > 100 * 1024 * 1024) { // 100MB
      errors.push('ไฟล์วิดีโอมีขนาดใหญ่เกินไป (สูงสุด 100MB)');
    }
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(videoFile.mimetype)) {
      errors.push('ไฟล์วิดีโอไม่ถูกต้อง');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'ไฟล์ไม่ถูกต้อง',
      details: errors
    });
  }

  next();
};

module.exports = {
  // Schemas
  submissionCreateSchema,
  contestCreateSchema,
  profileUpdateSchema,
  assignmentSchema,
  
  // Validators
  createValidator,
  validateUuidParam,
  validateFiles,
  
  // Individual field schemas for reuse
  uuidSchema,
  fishAgeSchema,
  contestStatusSchema,
  contestCategorySchema,
  judgeStatusSchema,
  submissionStatusSchema,
  assignmentStatusSchema,
  userRoleSchema,
  scoreSchema
};
