// ======================================================================
// File: src/controllers/submissionController.js
// หน้าที่: จัดการการส่งผลงาน (Submission) ทั้งประเมินคุณภาพและประกวด
// ======================================================================

'use strict';

const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin, supabase } = require('../config/supabase');
const submissionService = require('../services/submissionService');
const checklistNotifier = require('../services/checklistNotifierService');
const devNotifier = require('../notifiers/devTelegramNotifier');
const autoAssignmentService = require('../services/autoAssignmentService');
const modelApiService = require('../services/modelApiService');

// ------------------------------- Utils --------------------------------

const isUuid = (v) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const parseIntOrNull = (val) => {
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : null;
};

// ---------------------------- Middleware ------------------------------

const asyncWrapperWithFileCleanup = (fn) => async (req, res, next) => {
  const uploadedFilePaths = [];
  try {
    req.addUploadedFilePath = (fp) => {
      if (fp) uploadedFilePaths.push(fp);
    };
    await fn(req, res, next);
  } catch (error) {
    // Cleanup uploaded files ถ้าเกิด error
    if (uploadedFilePaths.length > 0) {
      console.warn(`[Cleanup] Removing ${uploadedFilePaths.length} files due to error:`, error.message);
      supabaseAdmin.storage.from('posters').remove(uploadedFilePaths)
        .catch((e) => console.error('[Cleanup] Failed to remove files:', e.message));
    }
    
    // ส่งต่อ error ไปยัง database error handler
    next(error);
  }
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
  const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype);
  const ok = (file.fieldname === 'images' && isImage) || (file.fieldname === 'video' && isVideo);
  if (!ok) return cb(new Error('ชนิดไฟล์ไม่ถูกต้อง'), false);
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const uploadSubmissionFiles = upload.fields([
  { name: 'images', maxCount: 3 },
  { name: 'video', maxCount: 1 },
]);

// ---------------------------- Shared Logic ----------------------------

async function uploadAndGetUrls(files, addUploadedFilePath) {
  const uploadFile = async (file, folder) => {
    const ext = path.extname(file.originalname) || '';
    const filePath = `Fish/${folder}/${uuidv4()}${ext}`;
    addUploadedFilePath(filePath);
    const { error } = await supabaseAdmin.storage
      .from('posters')
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new Error(`อัปโหลดไฟล์ ${file.originalname} ล้มเหลว: ${error.message}`);
    const { data } = supabase.storage.from('posters').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const imageUrls = Array.isArray(files?.images) && files.images.length > 0
    ? await Promise.all(files.images.map((f) => uploadFile(f, 'Picture')))
    : [];

  const videoUrl =
    Array.isArray(files?.video) && files.video.length > 0
      ? await uploadFile(files.video[0], 'Video')
      : null;

  return { imageUrls, videoUrl };
}

function validateSubmissionRequest(req, { requireContestId = false } = {}) {
  const { userId } = req;
  const { betta_name, betta_type, contest_id } = req.body;
  const errors = [];

  // ตรวจสอบ authentication
  if (!userId) {
    const err = new Error('ไม่สามารถระบุตัวตนผู้ใช้ได้'); 
    err.status = 401; 
    throw err;
  }

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!betta_name || betta_name.trim().length === 0) {
    errors.push({ field: 'betta_name', message: 'กรุณากรอกชื่อปลากัด' });
  } else if (betta_name.length > 100) {
    errors.push({ field: 'betta_name', message: 'ชื่อปลากัดต้องไม่เกิน 100 ตัวอักษร' });
  }

  if (!betta_type || betta_type.trim().length === 0) {
    errors.push({ field: 'betta_type', message: 'กรุณาระบุประเภทปลากัด' });
  } else if (betta_type.length > 50) {
    errors.push({ field: 'betta_type', message: 'ประเภทปลากัดต้องไม่เกิน 50 ตัวอักษร' });
  }

  // ตรวจสอบไฟล์รูปภาพ
  if (!req.files?.images || req.files.images.length === 0) {
    errors.push({ field: 'images', message: 'กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป' });
  } else if (req.files.images.length > 3) {
    errors.push({ field: 'images', message: 'อัปโหลดรูปภาพได้สูงสุด 3 รูป' });
  }

  // ตรวจสอบ contest_id ถ้าจำเป็น
  if (requireContestId) {
    if (!contest_id) {
      errors.push({ field: 'contest_id', message: 'จำเป็นต้องระบุรหัสการประกวด' });
    } else if (!isUuid(contest_id)) {
      errors.push({ field: 'contest_id', message: 'รหัสการประกวดไม่ถูกต้อง' });
    }
  }

  // ถ้ามี validation errors ให้ throw พร้อม details
  if (errors.length > 0) {
    const err = new Error('ข้อมูลไม่ถูกต้อง');
    err.status = 400;
    err.details = errors;
    throw err;
  }
}

// ------------------------------ Controllers ---------------------------

const createEvaluationSubmission = asyncWrapperWithFileCleanup(async (req, res) => {
  validateSubmissionRequest(req, { requireContestId: false });

  const { imageUrls, videoUrl } = await uploadAndGetUrls(req.files, req.addUploadedFilePath);

  const rpcParams = {
    p_owner_id: req.userId,
    p_contest_id: null,
    p_fish_name: req.body.betta_name,
    p_fish_type: req.body.betta_type,
    p_fish_age_months: parseIntOrNull(req.body.betta_age_months),
    p_fish_image_urls: imageUrls,
    p_fish_video_url: videoUrl,
  };

  const newSubmissionId = await submissionService.createSubmission(rpcParams);

  // Auto-assign to expert immediately after creation
  setTimeout(async () => {
    try {
      await autoAssignmentService.createAutoAssignment(newSubmissionId, req.body.betta_type);
    } catch (error) {
      console.warn('[SubmissionController] Auto-assignment failed:', error.message);
    }
  }, 1000); // หน่วงเวลา 1 วินาที เพื่อให้ submission บันทึกเสร็จก่อน

  checklistNotifier
    .onUserSubmitForEvaluation(newSubmissionId, req.userId)
    .catch((e) => console.warn(e.message));
  devNotifier
    .onSubmissionCreated(newSubmissionId)
    .catch((e) => console.warn(e.message));

  res.status(201).json({
    success: true,
    message: 'ส่งเพื่อประเมินคุณภาพสำเร็จ!',
    data: { submissionId: newSubmissionId },
  });
});

const createCompetitionSubmission = asyncWrapperWithFileCleanup(async (req, res) => {
  validateSubmissionRequest(req, { requireContestId: true });

  // ดึงข้อมูลการประกวดเพื่อตรวจสอบ allowed_subcategories
  const { data: contest, error: contestError } = await supabaseAdmin
    .from('contests')
    .select('allowed_subcategories')
    .eq('id', req.body.contest_id)
    .single();

  if (contestError || !contest) {
    throw new Error('ไม่พบข้อมูลการประกวดที่ระบุ');
  }

  // ตรวจสอบด้วย AI Model
  let aiValidation = null;
  if (req.files?.images && req.files.images.length > 0) {
    try {
      // ตรวจสอบว่า Model API พร้อมใช้งานหรือไม่
      const isModelReady = await modelApiService.isModelReady();
      
      if (isModelReady) {
        // ใช้รูปแรกในการตรวจสอบ
        const firstImage = req.files.images[0];
        const aiResult = await modelApiService.predictBettaType(firstImage.buffer);
        
        if (aiResult.success && aiResult.data.final_label) {
          const aiPredictedType = aiResult.data.final_label.code;
          const confidence = aiResult.data.top1.prob;
          
          aiValidation = modelApiService.validateBettaType(
            req.body.betta_type,
            contest.allowed_subcategories || [],
            aiPredictedType,
            confidence
          );
        }
      }
    } catch (error) {
      console.warn('AI validation failed:', error.message);
      // ไม่ throw error เพราะ AI validation เป็นเพียงการแจ้งเตือน
    }
  }

  const { imageUrls, videoUrl } = await uploadAndGetUrls(req.files, req.addUploadedFilePath);

  const rpcParams = {
    p_owner_id: req.userId,
    p_contest_id: req.body.contest_id,
    p_fish_name: req.body.betta_name,
    p_fish_type: req.body.betta_type,
    p_fish_age_months: parseIntOrNull(req.body.betta_age_months),
    p_fish_image_urls: imageUrls,
    p_fish_video_url: videoUrl,
  };

  const newSubmissionId = await submissionService.createSubmission(rpcParams);

  checklistNotifier
    .onUserSubmitForCompetition(newSubmissionId, req.userId)
    .catch((e) => console.warn(e.message));
  devNotifier
    .onContestSubmissionCreated(newSubmissionId)
    .catch((e) => console.warn(e.message));

  // ส่ง response พร้อม AI validation warning (ถ้ามี)
  const response = {
    success: true,
    message: 'ส่งเข้าร่วมประกวดสำเร็จ!',
    data: { submissionId: newSubmissionId }
  };

  if (aiValidation && aiValidation.warning) {
    response.aiValidation = {
      warning: aiValidation.warning,
      isValid: aiValidation.isValid,
      confidence: aiValidation.confidence,
      aiPredictedType: aiValidation.aiPredictedType,
      userSelectedType: aiValidation.userSelectedType
    };
  }

  res.status(201).json(response);
});

/**
 * ดึงข้อมูล submissions ของผู้ใช้
 * GET /api/submissions
 */
const getUserSubmissions = asyncWrapperWithFileCleanup(async (req, res) => {
  const { userId } = req;
  
  try {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        id,
        fish_name,
        fish_type,
        fish_age_months,
        fish_image_urls,
        fish_video_url,
        status,
        final_score,
        submitted_at,
        contest:contests(id, name, category, status)
      `)
      .eq('owner_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`ไม่สามารถดึงข้อมูล submissions ได้: ${error.message}`);
    }

    res.json({
      success: true,
      data: submissions || []
    });
  } catch (error) {
    throw new Error(`เกิดข้อผิดพลาดในการดึงข้อมูล submissions: ${error.message}`);
  }
});

// ------------------------------- Exports ------------------------------

module.exports = {
  uploadSubmissionFiles,
  createEvaluationSubmission,
  createCompetitionSubmission,
  getUserSubmissions,
};
