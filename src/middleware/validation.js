// D:\ProJectFinal\Lasts\betta-fish-api\src\middleware\validation.js

const Joi = require('joi');

// Validation สำหรับการสมัครสมาชิก (ตรงกับ UI ของคุณ)
const validateSignUp = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'กรุณากรอกอีเมลให้ถูกต้อง',
      'any.required': 'กรุณากรอกอีเมล'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      'any.required': 'กรุณากรอกรหัสผ่าน'
    }),
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': 'ชื่อผู้ใช้ต้องเป็นตัวอักษรและตัวเลขเท่านั้น',
      'string.min': 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร',
      'string.max': 'ชื่อผู้ใช้ต้องไม่เกิน 30 ตัวอักษร',
      'any.required': 'กรุณากรอกชื่อผู้ใช้'
    }),
    firstName: Joi.string().min(1).max(50).required().messages({
      'string.min': 'กรุณากรอกชื่อ',
      'string.max': 'ชื่อต้องไม่เกิน 50 ตัวอักษร',
      'any.required': 'กรุณากรอกชื่อ'
    }),
    lastName: Joi.string().min(1).max(50).required().messages({
      'string.min': 'กรุณากรอกนามสกุล',
      'string.max': 'นามสกุลต้องไม่เกิน 50 ตัวอักษร',
      'any.required': 'กรุณากรอกนามสกุล'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.details[0].message 
    });
  }
  next();
};

// Validation สำหรับการเข้าสู่ระบบ
const validateSignIn = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'กรุณากรอกอีเมลให้ถูกต้อง',
      'any.required': 'กรุณากรอกอีเมล'
    }),
    password: Joi.string().required().messages({
      'any.required': 'กรุณากรอกรหัสผ่าน'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false,
      error: error.details[0].message 
    });
  }
  next();
};

module.exports = {
  validateSignUp,
  validateSignIn
};