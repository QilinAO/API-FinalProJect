// ======================================================================
// File: src/services/expertService.js (ฉบับสมบูรณ์ แก้ไขแล้ว)
// หน้าที่: จัดการ Logic การทำงานทั้งหมดที่เกี่ยวข้องกับผู้เชี่ยวชาญ (Expert)
// ======================================================================

const { supabase, supabaseAdmin } = require('../config/supabase');
const NotificationService = require('./notificationService');
const scoringSchemas = require('../config/scoringSchemas');

class ExpertService {
  /**
   * ดึงข้อมูลสรุปสำหรับหน้า Dashboard ของ Expert
   * @param {string} expertId - UUID ของผู้เชี่ยวชาญ
   */
  async getDashboardStats(expertId) {
    const [
      { count: pendingEvaluations },
      { count: pendingInvitations },
      { count: completedTasks }
    ] = await Promise.all([
      supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('evaluator_id', expertId).eq('status', 'pending').is('submission.contest_id', null),
      supabase.from('contest_judges').select('*', { count: 'exact', head: true }).eq('judge_id', expertId).eq('status', 'pending'),
      supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('evaluator_id', expertId).eq('status', 'evaluated')
    ]);

    return {
      pendingEvaluations: pendingEvaluations || 0,
      pendingInvitations: pendingInvitations || 0,
      completedTasks: completedTasks || 0,
    };
  }

  /**
   * แปลงชื่อประเภทปลาจากตัวย่อเป็นชื่อเต็ม
   * @param {string} fishType - ประเภทปลา (อาจเป็นตัวย่อ)
   * @returns {string} ชื่อเต็มของประเภทปลา
   */
  getFullFishTypeName(fishType) {
    const typeMapping = {
      'A': 'ปลากัดพื้นบ้านภาคใต้',
      'B': 'ปลากัดพื้นบ้านภาคอีสาน', 
      'C': 'ปลากัดพื้นบ้านมหาชัย',
      'D': 'ปลากัดพื้นบ้านอีสานหางลาย',
      'E': 'ปลากัดพื้นบ้านภาคตะวันออก',
      'F': 'ปลากัดพื้นบ้านภาคกลางและเหนือ'
    };
    
    return typeMapping[fishType] || fishType;
  }

  /**
   * ดึงคิวงานประเมินคุณภาพที่รอการตอบรับและที่ตอบรับแล้ว
   * @param {string} expertId - UUID ของผู้เชี่ยวชาญ
   */
  async getEvaluationQueue(expertId) {
    const { data, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        id, status, 
        submission:submissions!inner(id, fish_name, fish_type, fish_image_urls, fish_video_url, owner:profiles(first_name, last_name))
      `)
      .eq('evaluator_id', expertId)
      .in('status', ['pending', 'accepted'])
      .is('submission.contest_id', null);

    if (error) throw new Error(`ไม่สามารถดึงคิวงานประเมินได้: ${error.message}`);
    
    const formattedData = data.map(item => ({
      assignment_id: item.id,
      status: item.status,
      submission_id: item.submission.id,
      fish_name: item.submission.fish_name,
      fish_type: this.getFullFishTypeName(item.submission.fish_type),
      owner_name: `${item.submission.owner.first_name || ''} ${item.submission.owner.last_name || ''}`.trim(),
      fish_image_urls: item.submission.fish_image_urls,
      fish_video_url: item.submission.fish_video_url
    }));

    return {
      pending: formattedData.filter(item => item.status === 'pending'),
      accepted: formattedData.filter(item => item.status === 'accepted'),
    };
  }

  /**
   * ตอบรับหรือปฏิเสธงานประเมินคุณภาพ
   * @param {string} assignmentId - ID ของงาน
   * @param {string} expertId - UUID ของผู้เชี่ยวชาญ
   * @param {'accepted' | 'rejected'} status - สถานะใหม่
   * @param {string} [reason] - เหตุผล (ถ้ามี)
   */
  async respondToEvaluation(assignmentId, expertId, status, reason = null) {
    const { data: check, error: checkError } = await supabaseAdmin.from('assignments').select('id').match({ id: assignmentId, evaluator_id: expertId, status: 'pending' }).single();
    if (checkError || !check) throw new Error('ไม่พบ Assignment หรือคุณไม่มีสิทธิ์ในการดำเนินการ');
    
    const { data, error } = await supabaseAdmin.from('assignments').update({ status, reject_reason: reason }).eq('id', assignmentId).select().single();
    if (error) throw new Error(`อัปเดต Assignment ไม่สำเร็จ: ${error.message}`);
    return data;
  }
    
  /**
   * ส่งคะแนนการประเมินคุณภาพ
   * @param {string} assignmentId - ID ของงาน
   * @param {string} expertId - UUID ของผู้เชี่ยวชาญ
   * @param {object} scoresData - ข้อมูลคะแนน { scores, totalScore }
   */
  async submitQualityScores(assignmentId, expertId, scoresData) {
    const { data: check, error: checkError } = await supabaseAdmin.from('assignments').select('id, submission_id, submission:submissions(owner_id, fish_name)').match({ id: assignmentId, evaluator_id: expertId, status: 'accepted' }).single();
    if (checkError || !check) throw new Error('ไม่สามารถให้คะแนนได้ งานนี้อาจยังไม่ถูกตอบรับหรือไม่มีสิทธิ์');
    
    const updatePayload = { 
      status: 'evaluated', 
      scores: scoresData.scores, 
      total_score: scoresData.totalScore, 
      evaluated_at: new Date().toISOString() 
    };
    const { data, error } = await supabaseAdmin.from('assignments').update(updatePayload).eq('id', assignmentId).select().single();
    if (error) throw new Error(`บันทึกคะแนน Assignment ไม่สำเร็จ: ${error.message}`);
    
    await supabaseAdmin.from('submissions').update({ final_score: scoresData.totalScore, status: 'evaluated' }).eq('id', check.submission_id);

    const ownerId = check.submission?.owner_id;
    if (ownerId) {
      const fishName = check.submission?.fish_name || 'ของคุณ';
      NotificationService.createNotification(ownerId, `ผลการประเมินคุณภาพปลากัด "${fishName}" ออกแล้ว! ได้รับคะแนน ${scoresData.totalScore}`, `/history`);
    }
    return data;
  }

  /**
   * ดึงข้อมูลการแข่งขันทั้งหมด (คำเชิญและรายการที่รับแล้ว)
   * @param {string} expertId - UUID ของผู้เชี่ยวชาญ
   */
  async getJudgingContests(expertId) {
    // ############ START: โค้ดที่แก้ไข ############
    const [invitesRes, contestsRes] = await Promise.all([
      // ดึงคำเชิญที่ยังรอดำเนินการ (pending)
      supabaseAdmin
        .from('contests')
        .select(`
          *,
          contest_judges!inner(status)
        `)
        .eq('contest_judges.judge_id', expertId)
        .eq('contest_judges.status', 'pending'),
      
      // ดึงการแข่งขันที่ตอบรับแล้ว (accepted) และกำลังดำเนินการอยู่
      supabaseAdmin
        .from('contests')
        .select(`
          *,
          contest_judges!inner(status)
        `)
        .eq('contest_judges.judge_id', expertId)
        .eq('contest_judges.status', 'accepted')
        .in('status', ['กำลังดำเนินการ', 'ตัดสิน'])
    ]);
    // ############ END: โค้ดที่แก้ไข ############

    if (invitesRes.error) throw new Error(`ดึงคำเชิญไม่สำเร็จ: ${invitesRes.error.message}`);
    if (contestsRes.error) throw new Error(`ดึงรายการประกวดไม่สำเร็จ: ${contestsRes.error.message}`);

    // Map ข้อมูลให้มีโครงสร้างเหมือนเดิมที่ Frontend ต้องการ
    return {
      invitations: (invitesRes.data || []).map(i => ({ ...i, expert_status: i.contest_judges[0]?.status })),
      myContests: (contestsRes.data || []).map(c => ({ ...c, expert_status: c.contest_judges[0]?.status })),
    };
  }

  /**
   * ตอบรับ/ปฏิเสธ คำเชิญเป็นกรรมการ
   * @param {string} contestId - ID การประกวด
   * @param {string} expertId - UUID ของผู้เชี่ยวชาญ
   * @param {'accepted' | 'rejected'} response - การตอบรับ
   */
  async respondToJudgeInvitation(contestId, expertId, response) {
    const { data: contestInfo, error: contestError } = await supabase.from('contests').select('name, created_by').eq('id', contestId).single();
    if (contestError) throw new Error('ไม่พบข้อมูลการประกวด');

    const { error } = await supabaseAdmin.from('contest_judges').update({ status: response }).match({ contest_id: contestId, judge_id: expertId });
    if (error) throw new Error(`ตอบรับคำเชิญไม่สำเร็จ: ${error.message}`);

    const { data: expertProfile } = await supabase.from('profiles').select('first_name, last_name').eq('id', expertId).single();
    const expertName = `${expertProfile?.first_name || ''} ${expertProfile?.last_name || ''}`.trim() || 'ผู้เชี่ยวชาญ';
    const responseText = response === 'accepted' ? 'ตอบรับ' : 'ปฏิเสธ';
    const message = `กรรมการ "${expertName}" ได้ ${responseText} คำเชิญในการประกวด "${contestInfo.name}"`;
    await NotificationService.createNotification(contestInfo.created_by, message, `/manager/assign-judges`);

    return { success: true };
  }

  /**
   * ดึงรายชื่อปลาในแต่ละการประกวด (หลังจากตรวจสอบสิทธิ์แล้ว)
   * @param {string} contestId - ID การประกวด
   * @param {string} expertId - UUID ของผู้เชี่ยวชาญ
   */
  async getFishInContest(contestId, expertId) {
    const { count, error: checkError } = await supabase.from('contest_judges').select('*', { count: 'exact', head: true }).match({ contest_id: contestId, judge_id: expertId, status: 'accepted' });
    if (checkError || count === 0) throw new Error('คุณไม่มีสิทธิ์ดูรายชื่อผู้สมัครในการประกวดนี้');

    const { data, error } = await supabase.from('submissions').select(`*, owner:profiles(first_name, last_name)`).eq('contest_id', contestId).eq('status', 'approved');
    if (error) throw new Error(`ไม่สามารถดึงรายชื่อปลาได้: ${error.message}`);
    return data;
  }

  /**
   * ส่งคะแนนปลากัดในการแข่งขัน
   * @param {string} submissionId - ID ของ Submission
   * @param {string} expertId - UUID ของผู้เชี่ยวชาญ
   * @param {object} scoresData - ข้อมูลคะแนน { scores, totalScore }
   */
  async submitCompetitionScore(submissionId, expertId, scoresData) {
    const { error } = await supabaseAdmin.from('assignments').update({ 
      scores: scoresData.scores, 
      total_score: scoresData.totalScore, 
      status: 'evaluated', 
      evaluated_at: new Date().toISOString() 
    }).match({ submission_id: submissionId, evaluator_id: expertId });
    
    if (error) throw new Error(`เกิดข้อผิดพลาดในการส่งคะแนน: ${error.message}`);
    return { success: true };
  }

  /**
   * ดึงประวัติการทำงาน
   * @param {string} expertId - UUID ของผู้เชี่ยวชาญ
   * @param {'quality' | 'competition'} type - ประเภทของประวัติ
   */
  async getExpertHistory(expertId, type) {
    if (type === 'quality') {
      const { data, error } = await supabase.from('assignments').select(`id, evaluated_at, total_score, submission:submissions!inner(fish_name, fish_type)`).eq('evaluator_id', expertId).eq('status', 'evaluated').is('submission.contest_id', null).order('evaluated_at', { ascending: false });
      if (error) throw error;
      return data.map(item => ({ id: item.id, date: item.evaluated_at, name: item.submission.fish_name, type: item.submission.fish_type, score: item.total_score }));
    }
    if (type === 'competition') {
      const { data, error } = await supabase.from('assignments').select(`id, submission:submissions!inner(contest:contests!inner(id, name, end_date))`).eq('evaluator_id', expertId).eq('status', 'evaluated').not('submission.contest_id', 'is', null).order('evaluated_at', { ascending: false });
      if (error) throw error;
      const uniqueContests = Object.values(data.reduce((acc, item) => {
        const contest = item.submission.contest;
        acc[contest.id] = { id: contest.id, date: contest.end_date, name: contest.name, type: 'การแข่งขัน' };
        return acc;
      }, {}));
      return uniqueContests;
    }
    throw new Error('ประเภทประวัติที่ระบุไม่ถูกต้อง');
  }

  /**
   * ดึงเกณฑ์การให้คะแนนตามประเภทปลา
   * @param {string} bettaType - ชื่อประเภทปลา
   */
  async getScoringSchema(bettaType) {
    const scoringSchemas = require('../config/scoringSchemas');
    
    // แปลงตัวย่อเป็นชื่อเต็ม
    const fullTypeName = this.getFullFishTypeName(bettaType);
    
    const schema = scoringSchemas[fullTypeName] || scoringSchemas['default'];
    if (!schema) {
      throw new Error('ไม่พบเกณฑ์การให้คะแนนสำหรับประเภทปลานี้');
    }
    return schema;
  }

  // ============= Additional Methods สำหรับ Controller =============

  /**
   * ดึงรายการมอบหมายงานทั้งหมด
   */
  async getMyAssignments(expertId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id, status, assigned_at, evaluated_at, total_score,
          submission:submissions(id, fish_name, fish_type, fish_image_urls, submitted_at)
        `)
        .eq('evaluator_id', expertId)
        .order('assigned_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      throw new Error(`ไม่สามารถดึงรายการมอบหมายงานได้: ${error.message}`);
    }
  }

  /**
   * ดึงงานที่รอการประเมิน
   */
  async getPendingAssignments(expertId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id, assigned_at,
          submission:submissions(id, fish_name, fish_type, fish_image_urls, submitted_at, owner:profiles(first_name, last_name))
        `)
        .eq('evaluator_id', expertId)
        .eq('status', 'pending')
        .order('assigned_at', { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      throw new Error(`ไม่สามารถดึงงานที่รอการประเมินได้: ${error.message}`);
    }
  }

  /**
   * ดึงรายละเอียดงานประเมิน
   */
  async getAssignmentDetails(assignmentId, expertId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id, status, assigned_at, evaluated_at, scores, total_score, reject_reason,
          submission:submissions(*, owner:profiles(first_name, last_name, username))
        `)
        .eq('id', assignmentId)
        .eq('evaluator_id', expertId)
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(`ไม่สามารถดึงรายละเอียดงานได้: ${error.message}`);
    }
  }

  /**
   * ส่งผลการประเมิน
   */
  async submitEvaluation(assignmentId, expertId, evaluationData) {
    try {
      const { scores, total_score, comments } = evaluationData;

      const updateData = {
        status: 'evaluated',
        scores: scores || {},
        total_score: total_score || null,
        evaluated_at: new Date().toISOString()
      };

      if (comments) {
        updateData.scores.comments = comments;
      }

      const { data, error } = await supabaseAdmin
        .from('assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .eq('evaluator_id', expertId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(`ไม่สามารถส่งผลการประเมินได้: ${error.message}`);
    }
  }

  /**
   * อัปเดตคะแนน
   */
  async updateScores(assignmentId, expertId, scoresData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('assignments')
        .update({
          scores: scoresData.scores || {},
          total_score: scoresData.total_score || null
        })
        .eq('id', assignmentId)
        .eq('evaluator_id', expertId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(`ไม่สามารถอัปเดตคะแนนได้: ${error.message}`);
    }
  }

  /**
   * ปฏิเสธงาน
   */
  async rejectAssignment(assignmentId, expertId, reason) {
    try {
      const { data, error } = await supabaseAdmin
        .from('assignments')
        .update({
          status: 'rejected',
          reject_reason: reason || null,
          evaluated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .eq('evaluator_id', expertId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(`ไม่สามารถปฏิเสธงานได้: ${error.message}`);
    }
  }

  /**
   * ดึงงานประเมินถัดไป
   */
  async getNextEvaluation(expertId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id, assigned_at,
          submission:submissions(id, fish_name, fish_type, fish_image_urls)
        `)
        .eq('evaluator_id', expertId)
        .eq('status', 'pending')
        .order('assigned_at', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      return data || null;
    } catch (error) {
      if (error.message.includes('PGRST116')) {
        return null; // ไม่มีงานถัดไป
      }
      throw new Error(`ไม่สามารถดึงงานถัดไปได้: ${error.message}`);
    }
  }

  /**
   * รับงานประเมิน (claim)
   */
  async claimEvaluation(submissionId, expertId) {
    try {
      // ตรวจสอบว่ามี assignment สำหรับ submission นี้แล้วหรือไม่
      const { data: existingAssignment } = await supabase
        .from('assignments')
        .select('id')
        .eq('submission_id', submissionId)
        .eq('evaluator_id', expertId)
        .single();

      if (existingAssignment) {
        return existingAssignment;
      }

      // สร้าง assignment ใหม่
      const { data, error } = await supabaseAdmin
        .from('assignments')
        .insert({
          submission_id: submissionId,
          evaluator_id: expertId,
          status: 'pending',
          assigned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(`ไม่สามารถรับงานประเมินได้: ${error.message}`);
    }
  }

  /**
   * ตอบรับการเป็นกรรมการ
   */
  async acceptJudging(contestId, expertId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('contest_judges')
        .update({ status: 'accepted' })
        .eq('contest_id', contestId)
        .eq('judge_id', expertId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(`ไม่สามารถตอบรับการเป็นกรรมการได้: ${error.message}`);
    }
  }

  /**
   * ปฏิเสธการเป็นกรรมการ
   */
  async declineJudging(contestId, expertId, reason) {
    try {
      const { data, error } = await supabaseAdmin
        .from('contest_judges')
        .update({ 
          status: 'declined',
          // อาจเพิ่มฟิลด์ decline_reason ในอนาคต
        })
        .eq('contest_id', contestId)
        .eq('judge_id', expertId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(`ไม่สามารถปฏิเสธการเป็นกรรมการได้: ${error.message}`);
    }
  }

  /**
   * ดึงประวัติการประเมิน
   */
  async getEvaluationHistory(expertId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('assignments')
        .select(`
          id, status, assigned_at, evaluated_at, total_score, scores,
          submission:submissions(id, fish_name, fish_type, submitted_at, owner:profiles(first_name, last_name))
        `)
        .eq('evaluator_id', expertId)
        .in('status', ['evaluated', 'rejected'])
        .order('evaluated_at', { ascending: false });

      if (error) throw new Error(error.message);
      
      // แปลงข้อมูลให้แสดงผลชัดเจนขึ้น
      const formattedData = data.map(item => ({
        id: item.id,
        status: item.status,
        assigned_at: item.assigned_at,
        evaluated_at: item.evaluated_at,
        total_score: item.total_score,
        scores: item.scores,
        fish_name: item.submission.fish_name,
        fish_type: this.getFullFishTypeName(item.submission.fish_type),
        owner_name: `${item.submission.owner.first_name || ''} ${item.submission.owner.last_name || ''}`.trim(),
        submitted_at: item.submission.submitted_at
      }));
      
      return formattedData || [];
    } catch (error) {
      throw new Error(`ไม่สามารถดึงประวัติการประเมินได้: ${error.message}`);
    }
  }

  /**
   * ดึงประวัติการเป็นกรรมการ
   */
  async getJudgingHistory(expertId) {
    try {
      const { data, error } = await supabase
        .from('contest_judges')
        .select(`
          id, status, assigned_at,
          contest:contests(id, name, start_date, end_date, status)
        `)
        .eq('judge_id', expertId)
        .order('assigned_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      throw new Error(`ไม่สามารถดึงประวัติการเป็นกรรมการได้: ${error.message}`);
    }
  }

  /**
   * ดึงสถิติประสิทธิภาพ
   */
  async getPerformanceStats(expertId) {
    try {
      const { count: totalAssignments } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('evaluator_id', expertId);

      const { count: completedAssignments } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('evaluator_id', expertId)
        .eq('status', 'evaluated');

      const { count: pendingAssignments } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('evaluator_id', expertId)
        .eq('status', 'pending');

      return {
        totalAssignments: totalAssignments || 0,
        completedAssignments: completedAssignments || 0,
        pendingAssignments: pendingAssignments || 0,
        completionRate: totalAssignments > 0 ? ((completedAssignments / totalAssignments) * 100).toFixed(1) : 0
      };
    } catch (error) {
      throw new Error(`ไม่สามารถดึงสถิติประสิทธิภาพได้: ${error.message}`);
    }
  }

  /**
   * ดึงสถิติภาระงาน
   */
  async getWorkloadStats(expertId) {
    try {
      const stats = await this.getPerformanceStats(expertId);
      
      // เพิ่มข้อมูลเกี่ยวกับการกระจายงานตามเวลา
      const { data: recentAssignments } = await supabase
        .from('assignments')
        .select('assigned_at, status')
        .eq('evaluator_id', expertId)
        .gte('assigned_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 30 วันที่แล้ว
        .order('assigned_at', { ascending: false });

      return {
        ...stats,
        recentAssignments: recentAssignments?.length || 0,
        last30Days: recentAssignments || []
      };
    } catch (error) {
      throw new Error(`ไม่สามารถดึงสถิติภาระงานได้: ${error.message}`);
    }
  }

  /**
   * ดึงข้อมูล Analytics ครบถ้วนสำหรับ Dashboard
   */
  async getAnalyticsData(expertId, timeRangeDays = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate - timeRangeDays * 24 * 60 * 60 * 1000);

      // ดึงข้อมูลพื้นฐาน
      const [performanceStats, workloadStats] = await Promise.all([
        this.getPerformanceStats(expertId),
        this.getWorkloadStats(expertId)
      ]);

      // ดึงข้อมูลสำหรับกราฟ weekly performance
      const { data: weeklyData } = await supabase
        .from('assignments')
        .select('evaluated_at, quality_scores')
        .eq('evaluator_id', expertId)
        .eq('status', 'evaluated')
        .gte('evaluated_at', new Date(endDate - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('evaluated_at', { ascending: true });

      // ประมวลผลข้อมูลรายสัปดาห์
      const weeklyPerformance = this.processWeeklyData(weeklyData);

      // ดึงข้อมูลความเชี่ยวชาญ
      const specialtyStats = await this.getSpecialtyStats(expertId);

      // คำนวณอันดับ Expert
      const expertRank = await this.calculateExpertRank(expertId);

      return {
        overview: {
          totalEvaluations: performanceStats.completedAssignments,
          completionRate: parseFloat(performanceStats.completionRate),
          averageScore: await this.getAverageScore(expertId),
          expertRank: expertRank.rank,
          totalExperts: expertRank.total,
          streak: await this.calculateStreak(expertId),
          levelProgress: await this.calculateLevelProgress(expertId)
        },
        performance: {
          weeklyData: weeklyPerformance,
          monthlyGrowth: await this.calculateMonthlyGrowth(expertId),
          accuracyTrend: 'up', // TODO: implement actual calculation
          speedImprovement: await this.calculateSpeedImprovement(expertId)
        },
        specialties: specialtyStats,
        achievements: await this.getAchievements(expertId)
      };
    } catch (error) {
      throw new Error(`ไม่สามารถดึงข้อมูล Analytics ได้: ${error.message}`);
    }
  }

  /**
   * ประมวลผลข้อมูลรายสัปดาห์
   */
  processWeeklyData(rawData) {
    const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    const weekData = Array(7).fill(0).map((_, i) => ({
      day: days[i],
      evaluations: 0,
      avgScore: 0,
      totalScore: 0
    }));

    rawData?.forEach(item => {
      const dayIndex = new Date(item.evaluated_at).getDay();
      weekData[dayIndex].evaluations += 1;
      if (item.quality_scores?.total_score) {
        weekData[dayIndex].totalScore += item.quality_scores.total_score;
      }
    });

    // คำนวณคะแนนเฉลี่ย
    weekData.forEach(day => {
      if (day.evaluations > 0) {
        day.avgScore = parseFloat((day.totalScore / day.evaluations).toFixed(1));
      }
    });

    return weekData;
  }

  /**
   * ดึงสถิติตามความเชี่ยวชาญ
   */
  async getSpecialtyStats(expertId) {
    try {
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          quality_scores,
          submission:submissions!inner(
            fish_type
          )
        `)
        .eq('evaluator_id', expertId)
        .eq('status', 'evaluated');

      const specialtyMap = {};
      
      assignments?.forEach(assignment => {
        const fishType = assignment.submission?.fish_type;
        if (fishType) {
          if (!specialtyMap[fishType]) {
            specialtyMap[fishType] = {
              count: 0,
              totalScore: 0,
              scores: []
            };
          }
          specialtyMap[fishType].count += 1;
          if (assignment.quality_scores?.total_score) {
            specialtyMap[fishType].totalScore += assignment.quality_scores.total_score;
            specialtyMap[fishType].scores.push(assignment.quality_scores.total_score);
          }
        }
      });

      return Object.entries(specialtyMap).map(([fishType, stats]) => ({
        type: this.getFishTypeDisplayName(fishType),
        count: stats.count,
        avgScore: stats.count > 0 ? parseFloat((stats.totalScore / stats.count).toFixed(1)) : 0,
        expertise: this.calculateExpertiseLevel(stats.count, stats.scores),
        color: this.getFishTypeColor(fishType),
        icon: this.getFishTypeIcon(fishType)
      }));
    } catch (error) {
      throw new Error(`ไม่สามารถดึงสถิติความเชี่ยวชาญได้: ${error.message}`);
    }
  }

  /**
   * คำนวณอันดับ Expert
   */
  async calculateExpertRank(expertId) {
    try {
      const { data: allExperts } = await supabase
        .from('assignments')
        .select('evaluator_id, quality_scores')
        .eq('status', 'evaluated');

      const expertScores = {};
      allExperts?.forEach(assignment => {
        const id = assignment.evaluator_id;
        if (!expertScores[id]) {
          expertScores[id] = { total: 0, count: 0 };
        }
        if (assignment.quality_scores?.total_score) {
          expertScores[id].total += assignment.quality_scores.total_score;
          expertScores[id].count += 1;
        }
      });

      const rankings = Object.entries(expertScores)
        .map(([id, scores]) => ({
          expertId: id,
          avgScore: scores.count > 0 ? scores.total / scores.count : 0,
          totalEvaluations: scores.count
        }))
        .sort((a, b) => b.avgScore - a.avgScore || b.totalEvaluations - a.totalEvaluations);

      const rank = rankings.findIndex(r => r.expertId === expertId) + 1;
      
      return {
        rank: rank || rankings.length + 1,
        total: rankings.length
      };
    } catch (error) {
      return { rank: 1, total: 1 };
    }
  }

  /**
   * คำนวณ streak (วันทำงานติดต่อกัน)
   */
  async calculateStreak(expertId) {
    try {
      const { data: evaluations } = await supabase
        .from('assignments')
        .select('evaluated_at')
        .eq('evaluator_id', expertId)
        .eq('status', 'evaluated')
        .order('evaluated_at', { ascending: false })
        .limit(100);

      if (!evaluations || evaluations.length === 0) return 0;

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const workDays = evaluations.map(e => {
        const date = new Date(e.evaluated_at);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      });

      const uniqueDays = [...new Set(workDays)].sort((a, b) => b - a);

      for (let i = 0; i < uniqueDays.length; i++) {
        const expectedTime = currentDate.getTime() - (i * 24 * 60 * 60 * 1000);
        if (uniqueDays[i] === expectedTime) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      return 0;
    }
  }

  /**
   * คำนวณความก้าวหน้าของ Level
   */
  async calculateLevelProgress(expertId) {
    try {
      const stats = await this.getPerformanceStats(expertId);
      const totalEvals = stats.completedAssignments;
      
      // Level system: Level = floor(totalEvals / 50) + 1
      const currentLevel = Math.floor(totalEvals / 50) + 1;
      const progressInCurrentLevel = totalEvals % 50;
      const progressPercentage = (progressInCurrentLevel / 50) * 100;
      
      return Math.round(progressPercentage);
    } catch (error) {
      return 0;
    }
  }

  /**
   * คำนวณการเจริญเติบโตรายเดือน
   */
  async calculateMonthlyGrowth(expertId) {
    try {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [thisMonthCount, lastMonthCount] = await Promise.all([
        supabase.from('assignments').select('*', { count: 'exact', head: true })
          .eq('evaluator_id', expertId).eq('status', 'evaluated')
          .gte('evaluated_at', thisMonth.toISOString()),
        supabase.from('assignments').select('*', { count: 'exact', head: true })
          .eq('evaluator_id', expertId).eq('status', 'evaluated')
          .gte('evaluated_at', lastMonth.toISOString())
          .lt('evaluated_at', thisMonth.toISOString())
      ]);

      const thisCount = thisMonthCount.count || 0;
      const lastCount = lastMonthCount.count || 0;
      
      if (lastCount === 0) return thisCount > 0 ? 100 : 0;
      
      return parseFloat((((thisCount - lastCount) / lastCount) * 100).toFixed(1));
    } catch (error) {
      return 0;
    }
  }

  /**
   * คำนวณการปรับปรุงความเร็ว
   */
  async calculateSpeedImprovement(expertId) {
    // สำหรับตอนนี้ return ค่า mock
    // ในอนาคตจะคำนวณจากเวลาที่ใช้ในการประเมินแต่ละครั้ง
    return 18.3;
  }

  /**
   * ดึงคะแนนเฉลี่ยของ Expert
   */
  async getAverageScore(expertId) {
    try {
      const { data: scores } = await supabase
        .from('assignments')
        .select('quality_scores')
        .eq('evaluator_id', expertId)
        .eq('status', 'evaluated');

      if (!scores || scores.length === 0) return 0;

      const validScores = scores
        .filter(s => s.quality_scores?.total_score)
        .map(s => s.quality_scores.total_score);

      if (validScores.length === 0) return 0;

      const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
      return parseFloat(average.toFixed(1));
    } catch (error) {
      return 0;
    }
  }

  /**
   * ดึงข้อมูล Achievements
   */
  async getAchievements(expertId) {
    try {
      const stats = await this.getPerformanceStats(expertId);
      const avgScore = await this.getAverageScore(expertId);
      const streak = await this.calculateStreak(expertId);

      const achievements = [
        {
          id: 1,
          title: 'Master Evaluator',
          description: 'ประเมิน 100+ ปลากัด',
          icon: '🎯',
          earned: stats.completedAssignments >= 100,
          rarity: 'legendary'
        },
        {
          id: 2,
          title: 'Speed Demon',
          description: 'ประเมินเร็วที่สุด 10 ครั้ง',
          icon: '⚡',
          earned: stats.completedAssignments >= 50, // mock condition
          rarity: 'epic'
        },
        {
          id: 3,
          title: 'Accuracy Expert',
          description: 'ความแม่นยำ 95%+',
          icon: '🎯',
          earned: parseFloat(stats.completionRate) >= 95,
          rarity: 'rare'
        },
        {
          id: 4,
          title: 'Streak Keeper',
          description: 'ทำงาน 30 วันติดต่อกัน',
          icon: '🔥',
          earned: streak >= 30,
          rarity: 'legendary'
        },
        {
          id: 5,
          title: 'Community Helper',
          description: 'ช่วยเหลือ Expert อื่น',
          icon: '🤝',
          earned: stats.completedAssignments >= 25, // mock condition
          rarity: 'common'
        },
        {
          id: 6,
          title: 'Innovation Pioneer',
          description: 'ใช้ AI Analysis 50+ ครั้ง',
          icon: '🚀',
          earned: false, // TODO: implement AI usage tracking
          rarity: 'epic'
        }
      ];

      return achievements;
    } catch (error) {
      return [];
    }
  }

  // Helper methods
  calculateExpertiseLevel(count, scores) {
    if (count >= 50) return 'expert';
    if (count >= 20) return 'advanced';
    if (count >= 5) return 'intermediate';
    return 'beginner';
  }

  getFishTypeColor(fishType) {
    const colorMap = {
      'D': 'from-cyan-500 to-blue-500',
      'B': 'from-green-500 to-emerald-500',
      'A': 'from-amber-500 to-yellow-500',
      'C': 'from-teal-500 to-cyan-500'
    };
    return colorMap[fishType] || 'from-gray-500 to-gray-600';
  }

  getFishTypeIcon(fishType) {
    const iconMap = {
      'D': '🏆',
      'B': '🌾',
      'A': '🏛️',
      'C': '🏝️'
    };
    return iconMap[fishType] || '🐟';
  }
}

module.exports = new ExpertService();