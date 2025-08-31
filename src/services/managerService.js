// ======================================================================
// File: src/services/managerService.js (ฉบับแก้ไขล่าสุด)
// ======================================================================

const { supabase, supabaseAdmin } = require('../config/supabase');
const NotificationService = require('./notificationService');

class ManagerService {
  /**
   * [แก้ไข] ดึงรายการกิจกรรมทั้งหมดที่ Manager สร้าง
   */
  async getMyContests(managerId) {
    // ✅✅✅ โค้ดที่ถูกต้อง (ลบคอมเมนต์ออกจาก String แล้ว) ✅✅✅
    const { data, error } = await supabaseAdmin
      .from('contests')
      .select(`
        id, 
        name, 
        category, 
        status, 
        start_date, 
        end_date, 
        short_description, 
        poster_url,
        allowed_subcategories,
        contest_judges (
          status,
          judge:profiles (
            id, first_name, last_name
          )
        )
      `)
      .eq('created_by', managerId)
      .order('created_at', { ascending: false });
  
    if (error) {
      // Error ที่คุณเจอก็จะถูกโยนมาจากบรรทัดนี้
      throw new Error(`ไม่สามารถดึงรายการกิจกรรมได้: ${error.message}`);
    }
    return data || [];
  }

  // ... (ฟังก์ชันอื่นๆ ทั้งหมดเหมือนเดิม) ...
  async #isContestOwner(contestId, managerId) {
    const { count, error } = await supabase.from('contests').select('*', { count: 'exact', head: true }).match({ id: contestId, created_by: managerId });
    if (error) throw new Error(error.message);
    return (count || 0) > 0;
  }

  async getDashboardStats(managerId) {
    const { data, error } = await supabase.from('contests').select('status').eq('created_by', managerId).eq('category', 'การประกวด');
    if (error) throw new Error(error.message);
    const byStatus = (data || []).reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return {
      totalContests: data.length,
      draftContests: byStatus['draft'] || 0,
      ongoingContests: byStatus['กำลังดำเนินการ'] || 0,
      closedContests: byStatus['ปิดรับสมัคร'] || 0,
      judgingContests: byStatus['ตัดสิน'] || 0,
      finishedContests: byStatus['ประกาศผล'] || 0,
    };
  }

  async createContestOrNews(managerId, contestData) {
    const { name, short_description, full_description, category, status, start_date, end_date, is_vote_open, allowed_subcategories, poster_url, fish_type } = contestData;
    const isCompetition = category === 'การประกวด';
    const defaultStatus = isCompetition ? 'draft' : 'published';
    const allowedStatuses = isCompetition ? ['draft', 'กำลังดำเนินการ', 'ปิดรับสมัคร', 'ตัดสิน', 'ประกาศผล', 'ยกเลิก'] : ['draft', 'published', 'archived'];
    const row = {
      name, short_description, full_description, category,
      status: allowedStatuses.includes(status) ? status : defaultStatus,
      start_date: isCompetition ? (start_date || null) : null,
      end_date: isCompetition ? (end_date || null) : null,
      is_vote_open: isCompetition ? !!is_vote_open : false,
      allowed_subcategories: isCompetition && Array.isArray(allowed_subcategories) ? allowed_subcategories : [],
      poster_url,
      fish_type: isCompetition ? (fish_type || null) : null,
      created_by: managerId,
    };
    const { data, error } = await supabaseAdmin.from('contests').insert(row).select().single();
    if (error) throw new Error(`ไม่สามารถสร้างกิจกรรมได้: ${error.message}`);
    return data;
  }

  async updateMyContest(contestId, managerId, updateData) {
    if (!(await this.#isContestOwner(contestId, managerId))) {
      throw new Error('ไม่ได้รับอนุญาตให้แก้ไข');
    }
    const allowedFields = ['name', 'short_description', 'full_description', 'poster_url', 'category', 'start_date', 'end_date', 'status', 'is_vote_open', 'allowed_subcategories', 'fish_type'];
    const dataToUpdate = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        dataToUpdate[key] = updateData[key];
      }
    }
    if (Object.keys(dataToUpdate).length === 0) {
      const { data: currentData } = await supabase.from('contests').select('*').eq('id', contestId).single();
      return currentData;
    }
    const { data: updated, error } = await supabaseAdmin.from('contests').update(dataToUpdate).eq('id', contestId).select().single();
    if (error) throw new Error(`ไม่สามารถอัปเดตกิจกรรมได้: ${error.message}`);
    return updated;
  }

  async deleteMyContest(contestId, managerId) {
    if (!(await this.#isContestOwner(contestId, managerId))) throw new Error('ไม่ได้รับอนุญาตให้ลบ');
    const { error } = await supabaseAdmin.from('contests').delete().eq('id', contestId);
    if (error) throw new Error(error.message);
    return { message: 'ลบข้อมูลสำเร็จ' };
  }

  async getContestSubmissions(contestId, managerId) {
    if (!(await this.#isContestOwner(contestId, managerId))) throw new Error('ไม่ได้รับอนุญาตให้ดูผู้สมัคร');
    const { data, error } = await supabase.from('submissions').select('*, owner:profiles(id, username, first_name, last_name)').eq('contest_id', contestId).order('submitted_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async updateSubmissionStatus(submissionId, newStatus, managerId) {
    if (!['pending', 'approved', 'rejected'].includes(newStatus)) throw new Error('สถานะไม่ถูกต้อง');
    const { data: sub, error: subErr } = await supabase.from('submissions').select('id, contest_id, owner_id, fish_name, contest:contests(name)').eq('id', submissionId).single();
    if (subErr || !sub) throw new Error('ไม่พบข้อมูลผู้สมัคร');
    if (!(await this.#isContestOwner(sub.contest_id, managerId))) throw new Error('ไม่ได้รับอนุญาต');
    const { data: updated, error: updErr } = await supabaseAdmin.from('submissions').update({ status: newStatus }).eq('id', submissionId).select().single();
    if (updErr) throw new Error(updErr.message);
    if (newStatus === 'approved' && sub.contest_id) {
      const { data: judges } = await supabase.from('contest_judges').select('judge_id').match({ contest_id: sub.contest_id, status: 'accepted' });
      if (judges?.length > 0) {
        const rows = judges.map(j => ({ submission_id: updated.id, evaluator_id: j.judge_id, status: 'pending' }));
        await supabaseAdmin.from('assignments').insert(rows);
      }
    }
    const contestName = sub.contest?.name || 'การประกวด';
    const message = newStatus === 'approved' ? `การสมัครเข้าร่วม "${contestName}" ของคุณได้รับการอนุมัติแล้ว` : `การสมัครเข้าร่วม "${contestName}" ของคุณถูกปฏิเสธ`;
    await NotificationService.createNotification(sub.owner_id, message, '/history');
    return updated;
  }

  async getExpertList(contestId = null) {
    // ดึงผู้เชี่ยวชาญทั้งหมด
    const { data, error } = await supabase.from('profiles').select('id, username, first_name, last_name, specialities').eq('role', 'expert');
    if (error) throw new Error(error.message);
    return data;
  }

  async assignJudgeToContest(contestId, judgeId, managerId) {
    if (!(await this.#isContestOwner(contestId, managerId))) throw new Error('ไม่ได้รับอนุญาต');
    const { data: expert, error: exErr } = await supabase.from('profiles').select('id').match({ id: judgeId, role: 'expert' }).single();
    if (exErr || !expert) throw new Error('ผู้ใช้ที่เลือกไม่ใช่ผู้เชี่ยวชาญ');
    const { data, error } = await supabaseAdmin.from('contest_judges').insert({ contest_id: contestId, judge_id: judgeId, status: 'pending' }).select().single();
    if (error) {
      if (error.code === '23505') throw new Error('กรรมการคนนี้ถูกมอบหมายแล้ว');
      throw new Error(error.message);
    }
    const { data: contest } = await supabase.from('contests').select('name').eq('id', contestId).single();
    await NotificationService.createNotification(judgeId, `คุณได้รับเชิญให้เป็นกรรมการในการประกวด "${contest.name}"`, '/expert/judging');
    return data;
  }

  async removeJudgeFromContest(contestId, judgeId, managerId) {
    if (!(await this.#isContestOwner(contestId, managerId))) throw new Error('ไม่ได้รับอนุญาต');
    const { error } = await supabaseAdmin.from('contest_judges').delete().match({ contest_id: contestId, judge_id: judgeId });
    if (error) throw new Error(`ไม่สามารถปลดกรรมการได้: ${error.message}`);
    return { message: 'ปลดกรรมการสำเร็จ' };
  }

  async getContestHistory(managerId) {
    const { data, error } = await supabase.from('contests').select('*, submissions(id, fish_name, final_score, owner:profiles(id, first_name, last_name))').eq('created_by', managerId).in('status', ['ประกาศผล', 'ยกเลิก']).order('end_date', { ascending: false });
    if (error) throw new Error(error.message);
    (data || []).forEach(c => {
      if (Array.isArray(c.submissions)) {
        c.submissions.sort((a, b) => (Number(b.final_score) || 0) - (Number(a.final_score) || 0));
      }
    });
    return data;
  }

  async getAllResults(managerId) {
    const { data, error } = await supabase.from('submissions').select('*, owner:profiles(id, first_name, last_name), contest:contests!inner(id, name, created_by)').eq('contest.created_by', managerId).eq('status', 'approved').not('final_score', 'is', null).order('final_score', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async updateContestStatus(contestId, managerId, newStatus) {
    if (!(await this.#isContestOwner(contestId, managerId))) throw new Error('ไม่ได้รับอนุญาต');
    const { data: current } = await supabase.from('contests').select('category').eq('id', contestId).single();
    if (current?.category !== 'การประกวด') throw new Error('ฟังก์ชันนี้ใช้ได้กับการแข่งขันเท่านั้น');
    if (!['ปิดรับสมัคร', 'ตัดสิน', 'ประกาศผล', 'ยกเลิก'].includes(newStatus)) throw new Error('สถานะที่ระบุไม่ถูกต้อง');
    const { data, error } = await supabaseAdmin.from('contests').update({ status: newStatus }).eq('id', contestId).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async finalizeContest(contestId, managerId) {
    if (!(await this.#isContestOwner(contestId, managerId))) throw new Error('ไม่ได้รับอนุญาต');
    const { data: contest } = await supabase.from('contests').select('name').eq('id', contestId).single();
    if (!contest) throw new Error('ไม่พบข้อมูลกิจกรรม');
    const { data: subs, error: sErr } = await supabase.from('submissions').select('id, owner_id, assignments(total_score)').eq('contest_id', contestId).eq('status', 'approved');
    if (sErr) throw new Error(sErr.message);
    if (!subs?.length) throw new Error('ไม่พบผู้สมัครที่อนุมัติแล้วในการประกวดนี้');
    const ownerIds = new Set();
    const updates = subs.map(sub => {
      ownerIds.add(sub.owner_id);
      const scores = (sub.assignments || []).map(a => Number(a.total_score)).filter(Number.isFinite);
      if (scores.length === 0) return null;
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return supabaseAdmin.from('submissions').update({ final_score: Math.round(avg * 100) / 100 }).eq('id', sub.id);
    }).filter(Boolean);
    await Promise.all(updates);
    const finalized = await this.updateContestStatus(contestId, managerId, 'ประกาศผล');
    if (finalized) {
      const notifications = Array.from(ownerIds).map(oid => ({ user_id: oid, message: `การประกวด "${contest.name}" ได้ประกาศผลแล้ว!`, link_to: `/history` }));
      await NotificationService.bulkCreate(notifications);
    }
    return finalized;
  }

  async getManagerProfileDashboard(managerId) {
    const { data, error } = await supabase.from('contests').select('id, name, status, category, submissions(id, status), contest_judges(status)').eq('created_by', managerId);
    if (error) throw new Error(error.message);
    let activeContests = 0, pendingSubmissions = 0, finishedContests = 0;
    const activeContestList = [];
    for (const c of data) {
      const isCompetition = c.category === 'การประกวด';
      if (isCompetition) {
        if (['กำลังดำเนินการ', 'ปิดรับสมัคร', 'ตัดสิน'].includes(c.status)) {
          activeContests++;
          pendingSubmissions += (c.submissions || []).filter(s => s.status === 'pending').length;
          activeContestList.push({
            id: c.id,
            name: c.name,
            status: c.status,
            submissionCount: (c.submissions || []).length,
            acceptedJudges: (c.contest_judges || []).filter(j => j.status === 'accepted').length,
          });
        } else if (c.status === 'ประกาศผล') {
          finishedContests++;
        }
      }
    }
    return { stats: { activeContests, pendingSubmissions, finishedContests }, activeContestList };
  }
}

module.exports = new ManagerService();