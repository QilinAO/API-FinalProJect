// ======================================================================
// File: src/controllers/adminController.js
// หน้าที่: จัดการ Logic การทำงานที่เกี่ยวข้องกับส่วนของผู้ดูแลระบบ (Admin)
// ======================================================================

const AdminService = require('../services/adminService');

/**
 * Utility function สำหรับครอบ (wrap) async route handlers
 * เพื่อจัดการ Error ที่เกิดขึ้นและส่งต่อไปยัง Global Error Handler โดยอัตโนมัติ
 * @param {Function} fn - Async controller function ที่จะถูกเรียกใช้งาน
 * @returns {Function} - Express route handler function
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class AdminController {
  /**
   * ดึงข้อมูลผู้ใช้ทั้งหมด
   * Route: GET /api/admin/users
   */
  getAllUsers = asyncWrapper(async (req, res) => {
    const users = await AdminService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  });

  /**
   * สร้างผู้ใช้ใหม่โดย Admin
   * Route: POST /api/admin/users
   */
  createUser = asyncWrapper(async (req, res) => {
    // Service จะ throw error หากข้อมูลไม่ถูกต้อง (เช่น อีเมลซ้ำ)
    // ซึ่ง asyncWrapper จะดักจับและส่งไปให้ Global Error Handler จัดการ
    const newUser = await AdminService.createUser(req.body);
    res.status(201).json({ success: true, data: newUser });
  });

  /**
   * ลบผู้ใช้ตาม ID
   * Route: DELETE /api/admin/users/:id
   */
  deleteUser = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const result = await AdminService.deleteUser(id);
    res.status(200).json({ success: true, data: result });
  });

  /**
   * ดึงข้อมูลสรุปสำหรับ Dashboard
   * Route: GET /api/admin/dashboard/stats
   */
  getDashboardStats = asyncWrapper(async (req, res) => {
    const stats = await AdminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  });

  /**
   * อัปเดตผู้ใช้
   * Route: PUT /api/admin/users/:id
   */
  updateUser = asyncWrapper(async (req, res) => {
    const updated = await AdminService.updateUser(req.params.id, req.body || {});
    res.status(200).json({ success: true, data: updated });
  });

  /**
   * อัปเดตอีเมล / รหัสผ่าน (Admin only)
   * Route: PUT /api/admin/users/:id/credentials
   */
  updateUserCredentials = asyncWrapper(async (req, res) => {
    const result = await AdminService.updateUserCredentials(req.params.id, req.body || {});
    res.status(200).json({ success: true, data: result });
  });

  /**
   * สรุปจำนวนไฟล์ใน Supabase Storage ตามหมวดที่กำหนด
   * GET /api/admin/storage/summary
   */
  getStorageSummary = asyncWrapper(async (_req, res) => {
    const { supabaseAdmin } = require('../config/supabase');
    const bucket = 'posters';

    async function listCount(prefix) {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(prefix, { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw new Error(error.message);
      return (data || []).filter((obj) => obj && obj.name && !obj.name.startsWith('.')).length;
    }

    const [profileCnt, posterCnt, imgCnt, vidCnt] = await Promise.all([
      listCount('Profile'),
      listCount('ContestPosters'),
      listCount('Fish/Picture'),
      listCount('Fish/Video'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        Profile: profileCnt,
        Poster: posterCnt,
        BettaFish_Image: imgCnt,
        BettaFish_Video: vidCnt,
      },
    });
  });

  /**
   * รายการไฟล์ใน Supabase Storage ตาม folder ที่ร้องขอ
   * GET /api/admin/storage/list?folder=Profile|Poster|BettaFish_Image|BettaFish_Video
   */
  listStorage = asyncWrapper(async (req, res) => {
    const { supabaseAdmin, supabase } = require('../config/supabase');
    const bucket = 'posters';
    const map = {
      Profile: 'Profile',
      Poster: 'ContestPosters',
      BettaFish_Image: 'Fish/Picture',
      BettaFish_Video: 'Fish/Video',
    };
    const folder = String(req.query.folder || '').trim();
    const path = map[folder];
    if (!path) return res.status(400).json({ success: false, error: 'โฟลเดอร์ไม่ถูกต้อง' });

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(path, { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw new Error(error.message);
    const files = (data || [])
      .filter((obj) => obj && obj.name && !obj.name.startsWith('.'))
      .map((obj) => {
        const filePath = `${path}/${obj.name}`;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return { name: obj.name, path: filePath, downloadUrl: urlData?.publicUrl || '' };
      });
    res.status(200).json({ success: true, data: files });
  });

  /**
   * สร้าง ZIP ของไฟล์ใน Supabase Storage ตามโฟลเดอร์ที่ระบุ
   * GET /api/admin/storage/zip?folder=Profile|Poster|BettaFish_Image|BettaFish_Video
   */
  zipStorageFolder = asyncWrapper(async (req, res) => {
    const { supabaseAdmin } = require('../config/supabase');
    const archiver = require('archiver');
    const bucket = 'posters';
    const map = {
      Profile: 'Profile',
      Poster: 'ContestPosters',
      BettaFish_Image: 'Fish/Picture',
      BettaFish_Video: 'Fish/Video',
    };
    const folder = String(req.query.folder || '').trim();
    const path = map[folder];
    if (!path) return res.status(400).json({ success: false, error: 'โฟลเดอร์ไม่ถูกต้อง' });

    // List files in folder
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(path, { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw new Error(error.message);
    let files = (data || []).filter((obj) => obj && obj.name && !obj.name.startsWith('.'));

    // Optional: only include selected names (names can be array or single string)
    let names = req.query.names;
    if (typeof names === 'string') names = [names];
    if (Array.isArray(names) && names.length > 0) {
      const allow = new Set(
        names
          .map((n) => String(n).trim())
          .filter((n) => n && !n.startsWith('.'))
      );
      files = files.filter((f) => allow.has(f.name));
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folder}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    for (const obj of files) {
      const fullPath = `${path}/${obj.name}`;
      const dl = await supabaseAdmin.storage.from(bucket).download(fullPath);
      if (dl.error || !dl.data) continue;
      const arrayBuffer = await dl.data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      archive.append(buffer, { name: obj.name });
    }

    await archive.finalize();
  });
  /**
   * ลบไฟล์ใน Supabase Storage ตาม folder mapping
   * DELETE /api/admin/storage/file?folder=...&name=...
   */
  deleteStorageFile = asyncWrapper(async (req, res) => {
    const { supabaseAdmin } = require('../config/supabase');
    const bucket = 'posters';
    const map = {
      Profile: 'Profile',
      Poster: 'ContestPosters',
      BettaFish_Image: 'Fish/Picture',
      BettaFish_Video: 'Fish/Video',
    };
    const folder = String(req.query.folder || '').trim();
    const name = String(req.query.name || '').trim();
    if (!folder || !name) return res.status(400).json({ success: false, error: 'กรุณาระบุ folder และ name' });
    if (name.startsWith('.')) return res.status(400).json({ success: false, error: 'ไม่อนุญาตให้ลบไฟล์ระบบ' });
    const prefix = map[folder];
    if (!prefix) return res.status(400).json({ success: false, error: 'โฟลเดอร์ไม่ถูกต้อง' });
    const fullPath = `${prefix}/${name}`;
    const { error } = await supabaseAdmin.storage.from(bucket).remove([fullPath]);
    if (error) throw new Error(error.message);
    res.json({ success: true, data: { removed: fullPath } });
  });
}

module.exports = new AdminController();
