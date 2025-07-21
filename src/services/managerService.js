// D:\ProJectFinal\Lasts\betta-fish-api\src\services\managerService.js (ฉบับสมบูรณ์)

// --- ส่วนที่ 1: การนำเข้า (Imports) ---

const { supabase } = require('../config/supabase');
// [อัปเดต] นำเข้า NotificationService ที่เราสร้างขึ้น เพื่อใช้ในการส่งการแจ้งเตือน
const NotificationService = require('./notificationService');


// --- ส่วนที่ 2: Service Class ---

class ManagerService {

    // ฟังก์ชัน Helper (private) สำหรับตรวจสอบว่า Manager เป็นเจ้าของ Contest หรือไม่
    async #isContestOwner(contestId, managerId) {
        const { data, error } = await supabase.from('contests').select('id').eq('id', contestId).eq('created_by', managerId).maybeSingle();
        if (error) throw error;
        return !!data;
    }

    // ดึงข้อมูลสรุปสำหรับหน้า Dashboard
    async getDashboardStats(managerId) {
        const { data, error } = await supabase.from('contests').select('status').eq('created_by', managerId);
        if (error) throw error;
        const stats = data.reduce((acc, curr) => { acc[curr.status] = (acc[curr.status] || 0) + 1; return acc; }, {});
        return { totalContests: data.length, draftContests: stats.draft || 0, ongoingContests: stats['กำลังดำเนินการ'] || 0, closedContests: stats['ปิดรับสมัคร'] || 0, judgingContests: stats['ตัดสิน'] || 0, finishedContests: stats['ประกาศผล'] || 0 };
    }

    // สร้าง Contest หรือ News ใหม่
    async createContestOrNews(managerId, contestData) {
        const { judge_ids, ...restOfContestData } = contestData;
        let dataToInsert = { ...restOfContestData };

        if (dataToInsert.category === 'การประกวด') {
            dataToInsert.status = dataToInsert.status || 'draft';
        } else {
            dataToInsert.status = 'published';
        }

        const { data: newContest, error } = await supabase.from('contests').insert([{ ...dataToInsert, created_by: managerId }]).select().single();
        if (error) throw error;
        return newContest;
    }

    // ดึง Contest ทั้งหมดที่ Manager คนนี้สร้าง
    async getMyContests(managerId) {
        const { data, error } = await supabase.from('contests').select(`*, contest_judges(status, profiles(id, first_name, last_name))`).eq('created_by', managerId).order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    // อัปเดตข้อมูล Contest
    async updateMyContest(contestId, managerId, data) {
        if (!await this.#isContestOwner(contestId, managerId)) throw new Error('ไม่ได้รับอนุญาตให้แก้ไข');
        const { data: updated, error } = await supabase.from('contests').update(data).eq('id', contestId).select().single();
        if (error) throw error;
        return updated;
    }

    // ลบ Contest
    async deleteMyContest(contestId, managerId) {
        if (!await this.#isContestOwner(contestId, managerId)) throw new Error('ไม่ได้รับอนุญาตให้ลบ');
        const { error } = await supabase.from('contests').delete().eq('id', contestId);
        if (error) throw error;
        return { message: 'ลบข้อมูลสำเร็จ' };
    }

    // ดึงรายชื่อผู้สมัครใน Contest
    async getContestSubmissions(contestId, managerId) {
        if (!await this.#isContestOwner(contestId, managerId)) throw new Error('ไม่ได้รับอนุญาตให้ดูผู้สมัคร');
        const { data, error } = await supabase.from('submissions').select(`*, owner:profiles(id, username, first_name, last_name)`).eq('contest_id', contestId).order('submitted_at');
        if (error) throw error;
        return data;
    }

    // อัปเดตสถานะของผู้สมัคร (เช่น pending -> approved)
    async updateSubmissionStatus(submissionId, newStatus, managerId) {
        const { data: sub, error: subError } = await supabase.from('submissions').select('contest_id').eq('id', submissionId).single();
        if (subError || !sub || !await this.#isContestOwner(sub.contest_id, managerId)) throw new Error('ไม่ได้รับอนุญาต');

        const { data: updatedSubmission, error: updateError } = await supabase.from('submissions').update({ status: newStatus }).eq('id', submissionId).select().single();
        if (updateError) throw updateError;

        if (newStatus === 'approved' && sub.contest_id) {
            const { data: judges, error: judgeError } = await supabase.from('contest_judges').select('judge_id').eq('contest_id', sub.contest_id).eq('status', 'accepted');
            if (judgeError) throw judgeError;

            if (judges && judges.length > 0) {
                const assignmentsToCreate = judges.map(j => ({ submission_id: updatedSubmission.id, evaluator_id: j.judge_id, status: 'pending' }));
                const { error: assignmentError } = await supabase.from('assignments').insert(assignmentsToCreate);
                if (assignmentError) console.error('Failed to create assignments:', assignmentError);
            }
        }
        return updatedSubmission;
    }

    // ดึงรายชื่อ Expert ทั้งหมด
    async getExpertList() {
        const { data, error } = await supabase.from('profiles').select('id, username, first_name, last_name, specialities').eq('role', 'expert');
        if (error) throw error;
        return data;
    }

    // มอบหมายกรรมการให้ Contest
    async assignJudgeToContest(contestId, judgeId, managerId) {
        if (!await this.#isContestOwner(contestId, managerId)) throw new Error('ไม่ได้รับอนุญาต');
        const { data: expert } = await supabase.from('profiles').select('id').eq('id', judgeId).eq('role', 'expert').single();
        if (!expert) throw new Error('ผู้ใช้ที่เลือกไม่ใช่ผู้เชี่ยวชาญ');
        
        const { data, error } = await supabase.from('contest_judges').insert([{ contest_id: contestId, judge_id: judgeId, status: 'pending' }]).select().single();
        if (error) {
            if (error.code === '23505') throw new Error('กรรมการคนนี้ถูกมอบหมายแล้ว');
            throw error;
        }
        return data;
    }
    
    // ปลดกรรมการออกจาก Contest
    async removeJudgeFromContest(contestId, judgeId, managerId) {
        if (!await this.#isContestOwner(contestId, managerId)) throw new Error('ไม่ได้รับอนุญาต');
        const { error } = await supabase.from('contest_judges').delete().match({ contest_id: contestId, judge_id: judgeId });
        if (error) throw new Error('ไม่สามารถปลดกรรมการได้: ' + error.message);
        return { message: 'ปลดกรรมการสำเร็จ' };
    }

    // ดึงประวัติ Contest ที่จบไปแล้ว
    async getContestHistory(managerId) {
        const { data, error } = await supabase.from('contests').select(`*, submissions(id,fish_name,final_score,owner:profiles(id,first_name,last_name))`).eq('created_by', managerId).in('status', ['ประกาศผล', 'ยกเลิก']).order('end_date', { ascending: false });
        if (error) throw error;
        data.forEach(c => { if (c.submissions) c.submissions.sort((a,b) => (b.final_score||0)-(a.final_score||0)) });
        return data;
    }

    // ดึงผลคะแนนทั้งหมดที่ Manager คนนี้ดูแล
    async getAllResults(managerId) {
        const { data, error } = await supabase.from('submissions').select(`*, owner:profiles(id,first_name,last_name), contest:contests!inner(id,name,created_by)`).eq('contest.created_by', managerId).eq('status', 'approved').not('final_score', 'is', null).order('final_score', { ascending: false });
        if (error) throw error;
        return data;
    }

    // อัปเดตสถานะของ Contest (เช่น ปิดรับสมัคร, เริ่มตัดสิน)
    async updateContestStatus(contestId, managerId, newStatus) {
        if (!await this.#isContestOwner(contestId, managerId)) throw new Error('ไม่ได้รับอนุญาต');
        const allowedStatuses = ['ปิดรับสมัคร', 'ตัดสิน', 'ประกาศผล', 'ยกเลิก'];
        if (!allowedStatuses.includes(newStatus)) throw new Error('สถานะที่ระบุไม่ถูกต้อง');

        const { data, error } = await supabase.from('contests').update({ status: newStatus }).eq('id', contestId).select().single();
        if (error) throw error;
        return data;
    }

    /**
     * ===================================================================
     * ▼▼▼ [ส่วนที่อัปเดต] ฟังก์ชันสำหรับคำนวณและประกาศผลการประกวด ▼▼▼
     * ===================================================================
     */
    async finalizeContest(contestId, managerId) {
        if (!await this.#isContestOwner(contestId, managerId)) {
            throw new Error('ไม่ได้รับอนุญาต');
        }

        const { data: submissions, error: subError } = await supabase
            .from('submissions')
            .select(`id, owner_id, assignments ( total_score )`)
            .eq('contest_id', contestId)
            .eq('status', 'approved');

        if (subError) throw subError;
        if (!submissions || submissions.length === 0) {
            throw new Error('ไม่พบผู้สมัครที่อนุมัติแล้วในการประกวดนี้');
        }

        // [อัปเดต] ใช้ Set เพื่อเก็บ ID เจ้าของที่ไม่ซ้ำกัน สำหรับส่ง Notification
        const ownerIds = new Set();

        for (const sub of submissions) {
            ownerIds.add(sub.owner_id); // เพิ่ม ID เจ้าของเข้าไปใน Set

            const scores = sub.assignments.map(a => a.total_score).filter(s => s !== null);
            if (scores.length === 0) continue;

            const finalScore = scores.reduce((sum, score) => sum + Number(score), 0) / scores.length;
            await supabase.from('submissions').update({ final_score: finalScore.toFixed(2) }).eq('id', sub.id);
        }

        const finalizedContest = await this.updateContestStatus(contestId, managerId, 'ประกาศผล');

        // [อัปเดต] สร้างการแจ้งเตือนส่งให้ผู้เข้าร่วมทุกคน
        if (finalizedContest) {
            for (const ownerId of ownerIds) {
                NotificationService.createNotification(
                    ownerId,
                    `การประกวด "${finalizedContest.name}" ได้ประกาศผลแล้ว!`,
                    `/history` // ลิงก์ไปหน้าประวัติ
                );
            }
        }

        return finalizedContest;
    }

    // ดึงข้อมูลสำหรับหน้าโปรไฟล์ของ Manager
    async getManagerProfileDashboard(managerId) {
        const { data: contests, error: contestError } = await supabase.from('contests').select('id, name, status, submissions(id, status), contest_judges(status)').eq('created_by', managerId);
        if (contestError) throw contestError;

        let activeContestsCount = 0;
        let pendingSubmissionsCount = 0;
        let finishedContestsCount = 0;
        const activeContestList = [];

        contests.forEach(contest => {
            const isActive = ['กำลังดำเนินการ', 'ปิดรับสมัคร', 'ตัดสิน'].includes(contest.status);
            if (isActive) {
                activeContestsCount++;
                pendingSubmissionsCount += contest.submissions.filter(s => s.status === 'pending').length;
                activeContestList.push({
                    id: contest.id,
                    name: contest.name,
                    status: contest.status,
                    submissionCount: contest.submissions.length,
                    acceptedJudges: contest.contest_judges.filter(j => j.status === 'accepted').length,
                });
            }
            if (contest.status === 'ประกาศผล') {
                finishedContestsCount++;
            }
        });

        return {
            stats: {
                activeContests: activeContestsCount,
                pendingSubmissions: pendingSubmissionsCount,
                finishedContests: finishedContestsCount,
            },
            activeContestList: activeContestList,
        };
    }
}

module.exports = new ManagerService();