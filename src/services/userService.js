// ======================================================================
// File: src/services/userService.js
// หน้าที่: จัดการ Logic การทำงานที่เกี่ยวข้องกับข้อมูลผู้ใช้ (Profile, History)
// ======================================================================

const { supabase, supabaseAdmin } = require('../config/supabase');
const path = require('path');

class UserService {
  /**
   * ดึงข้อมูลโปรไฟล์ของผู้ใช้ตาม ID
   * @param {string} userId - UUID ของผู้ใช้
   * @returns {Promise<object|null>}
   */
  async getProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') {
      throw new Error(`ไม่สามารถดึงข้อมูลโปรไฟล์ได้: ${error.message}`);
    }
    return data;
  }

  /**
   * อัปเดตข้อมูลโปรไฟล์ของผู้ใช้
   * @param {string} userId - UUID ของผู้ใช้
   * @param {object} profileData - ข้อมูลที่ต้องการอัปเดต
   * @returns {Promise<object>}
   */
  async updateProfile(userId, profileData) {
    const { firstName, lastName, ...rest } = profileData;
    const dataToUpdate = { ...rest, updated_at: new Date().toISOString() };
    if (firstName !== undefined) dataToUpdate.first_name = firstName;
    if (lastName !== undefined) dataToUpdate.last_name = lastName;

    // ตรวจสอบ Username ซ้ำ (ถ้ามีการส่งมา)
    if (dataToUpdate.username) {
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', dataToUpdate.username)
        .neq('id', userId)
        .maybeSingle();
      if (checkError) throw new Error('เกิดข้อผิดพลาดในการตรวจสอบชื่อผู้ใช้');
      if (existingUser) throw new Error('ชื่อผู้ใช้นี้ถูกใช้แล้ว');
    }

    // [สำคัญ] ใช้ supabaseAdmin เพื่อให้แน่ใจว่ามีสิทธิ์ในการอัปเดต
    const { data, error } = await supabaseAdmin.from('profiles').update(dataToUpdate).eq('id', userId).select().single();
    if (error) {
      throw new Error(`ไม่สามารถอัปเดตโปรไฟล์ได้: ${error.message}`);
    }
    return data;
  }

  /**
   * อัปโหลดรูปโปรไฟล์และอัปเดต URL ในโปรไฟล์
   * @param {string} userId - UUID ของผู้ใช้
   * @param {object} file - ไฟล์ที่ได้จาก Multer (req.file)
   * @returns {Promise<object>}
   */
  async uploadProfilePicture(userId, file) {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const filePath = `Profile/${userId}${fileExtension}`;

    // [สำคัญ] ใช้ supabaseAdmin เพื่อให้แน่ใจว่ามีสิทธิ์ในการอัปโหลด/เขียนทับ
    const { error: uploadError } = await supabaseAdmin.storage
      .from('posters')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    if (uploadError) {
      throw new Error(`Supabase Storage Error: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from('posters').getPublicUrl(filePath);
    const avatarUrl = urlData.publicUrl;

    // เรียกใช้ฟังก์ชัน updateProfile ภายใน Class เดียวกัน
    return this.updateProfile(userId, { avatar_url: avatarUrl });
  }

  /**
   * [Admin Only] ดึงข้อมูลผู้ใช้ทั้งหมด
   * @returns {Promise<Array>}
   */
  async getAllUsers() {
    // ใช้ supabaseAdmin เพื่อข้าม RLS และดึงข้อมูลทั้งหมดได้
    const { data, error } = await supabaseAdmin.from('profiles').select('*');
    if (error) throw new Error(`ไม่สามารถดึงข้อมูลผู้ใช้ทั้งหมดได้: ${error.message}`);
    return data || [];
  }

  /**
   * แปลงข้อมูลดิบของประวัติการประเมินให้พร้อมใช้งานสำหรับ Frontend
   * @private
   */
  #transformEvaluationData(submission) {
    let displayStatus = 'รอการตรวจสอบ';
    const firstAssign = submission.assignments?.[0];

    if (submission.status === 'rejected') {
      displayStatus = 'ถูกปฏิเสธ';
    } else if (submission.status === 'evaluated') {
      displayStatus = 'ประเมินเสร็จสิ้น';
    } else if (submission.status === 'pending') {
      if (firstAssign?.status === 'evaluated') {
        displayStatus = 'ประเมินเสร็จสิ้น';
      } else if (firstAssign?.status === 'accepted') {
        displayStatus = 'กำลังประเมิน';
      } else if (firstAssign?.status === 'pending') {
        displayStatus = 'รอผู้เชี่ยวชาญตอบรับ';
      } else {
        displayStatus = 'รอการมอบหมาย';
      }
    } else {
      displayStatus = 'รอการตรวจสอบ';
    }

    const assignees = (submission.assignments || []).map(a => ({
      assignment_id: a.id,
      status: a.status,
      total_score: a.total_score,
      evaluator_name: [a.evaluator?.first_name, a.evaluator?.last_name].filter(Boolean).join(' ') || a.evaluator?.username || 'ผู้เชี่ยวชาญ',
    }));

    return {
      id: submission.id,
      betta_name: submission.fish_name,
      evaluationDate: submission.submitted_at,
      status: displayStatus,
      images: submission.fish_image_urls,
      video: submission.fish_video_url,
      betta_type: submission.fish_type,
      betta_age_months: submission.fish_age_months, // ส่งค่าเดิม
      fish_age_months: submission.fish_age_months,   // เพิ่มเพื่อความเข้ากันได้
      assignees,
    };
  }

  /**
   * ดึงประวัติการส่งประเมินคุณภาพ (ไม่ใช่การประกวด)
   * @param {string} userId - UUID ของผู้ใช้
   * @returns {Promise<Array>}
   */
  async getEvaluationHistory(userId) {
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        id, fish_name, fish_type, fish_age_months, fish_image_urls, fish_video_url, submitted_at, status,
        assignments (id, status, total_score, evaluator:profiles(first_name, last_name, username))
      `)
      .eq('owner_id', userId)
      .is('contest_id', null)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`ไม่สามารถดึงประวัติการประเมินได้: ${error.message}`);
    }

    return (data || []).map(this.#transformEvaluationData);
  }

  /**
   * ดึงประวัติการเข้าร่วมการแข่งขัน
   * @param {string} userId - UUID ของผู้ใช้
   * @returns {Promise<Array>}
   */
  async getCompetitionHistory(userId) {
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select(`id, fish_name, submitted_at, status, final_score, contest:contests(name, status)`)
      .eq('owner_id', userId)
      .not('contest_id', 'is', null)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`ไม่สามารถดึงประวัติการแข่งขันได้: ${error.message}`);
    }
    return data || [];
  }

  /**
   * ดึงข้อมูล Dashboard ของผู้ใช้
   * @param {string} userId - UUID ของผู้ใช้
   * @returns {Promise<object>}
   */
  async getUserDashboard(userId) {
    try {
      // ดึงข้อมูลสรุปต่างๆ
      const [evaluationCount, competitionCount, recentSubmissions] = await Promise.all([
        // จำนวนการประเมิน
        supabaseAdmin
          .from('submissions')
          .select('id', { count: 'exact' })
          .eq('owner_id', userId)
          .is('contest_id', null),
        
        // จำนวนการแข่งขัน
        supabaseAdmin
          .from('submissions')
          .select('id', { count: 'exact' })
          .eq('owner_id', userId)
          .not('contest_id', 'is', null),
        
        // การส่งล่าสุด
        supabaseAdmin
          .from('submissions')
          .select('id, fish_name, status, submitted_at')
          .eq('owner_id', userId)
          .order('submitted_at', { ascending: false })
          .limit(5)
      ]);

      return {
        stats: {
          totalEvaluations: evaluationCount.count || 0,
          totalCompetitions: competitionCount.count || 0,
        },
        recentSubmissions: recentSubmissions.data || []
      };
    } catch (error) {
      throw new Error(`ไม่สามารถดึงข้อมูล Dashboard ได้: ${error.message}`);
    }
  }

  /**
   * ดึงข้อมูล Contests สำหรับผู้ใช้
   * @param {string} userId - UUID ของผู้ใช้
   * @returns {Promise<Array>}
   */
  async getUserContests(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('submissions')
        .select(`
          id, fish_name, status, final_score, submitted_at,
          contest:contests(id, name, category, status, start_date, end_date)
        `)
        .eq('owner_id', userId)
        .not('contest_id', 'is', null)
        .order('submitted_at', { ascending: false });

      if (error) {
        throw new Error(`ไม่สามารถดึงข้อมูล Contests ได้: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`ไม่สามารถดึงข้อมูล Contests ได้: ${error.message}`);
    }
  }

  /**
   * ดึงประวัติการประเมินของฉัน
   * @param {string} userId - UUID ของผู้ใช้
   * @returns {Promise<Array>}
   */
  async getMyEvaluationHistory(userId) {
    return this.getEvaluationHistory(userId);
  }
}

module.exports = new UserService();