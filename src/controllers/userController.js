const userService = require('../services/userService');
const multer = require('multer');
const path = require('path');
const { supabaseAdmin } = require('../config/supabase');

// --- Multer Configuration ---
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('ไฟล์ต้องเป็นรูปภาพเท่านั้น (JPEG, PNG หรือ JPG)'));
    }
  }
});

class UserController {

  async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const profileData = req.body;
      const updatedProfile = await userService.updateProfile(userId, profileData);
      res.json({ success: true, message: 'อัปเดตโปรไฟล์สำเร็จ', data: updatedProfile });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async uploadProfilePicture(req, res) {
    try {
      const userId = req.userId;
      if (!req.file) return res.status(400).json({ success: false, error: 'ไม่พบไฟล์รูปภาพ' });
      
      const file = req.file;
      const fileExtension = path.extname(file.originalname);
      const filePath = `Profile/${userId}${fileExtension}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('posters')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) throw new Error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์ไปที่ Storage: ' + uploadError.message);

      const { data: urlData } = supabaseAdmin.storage.from('posters').getPublicUrl(filePath);
      const updatedProfile = await userService.updateProfile(userId, { avatar_url: urlData.publicUrl });
      
      res.json({ success: true, message: 'อัปโหลดรูปโปรไฟล์สำเร็จ', data: updatedProfile });
    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getEvaluationHistory(req, res) {
    try {
      const history = await userService.getEvaluationHistory(req.userId);
      res.json({ success: true, data: history });
    } catch (error) {
      console.error('Get evaluation history error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * [ฟังก์ชันใหม่] Controller สำหรับดึงประวัติการแข่งขัน
   */
  async getCompetitionHistory(req, res) {
    try {
      // เรียกใช้ Service เพื่อดึงข้อมูล โดยใช้ userId จาก Middleware
      const history = await userService.getCompetitionHistory(req.userId);
      res.json({ success: true, data: history });
    } catch (error) {
      console.error('Get competition history error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// --- Export ---
const userController = new UserController();
module.exports = {
  userController,
  uploadMiddleware: upload.single('profilePicture')
};