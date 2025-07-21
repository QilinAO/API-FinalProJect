// D:\ProJectFinal\Lasts\betta-fish-api\src\services\expertService.js (ฉบับสมบูรณ์)

// --- ส่วนที่ 1: การนำเข้า (Imports) ---

const { supabase } = require('../config/supabase');
const NotificationService = require('./notificationService');
const scoringSchemas = require('../config/scoringSchemas');


// --- ส่วนที่ 2: Service Class ---

class ExpertService {

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับหน้า Dashboard
     * ===================================================================
     */
    async getDashboardStats(expertId) {
        const { count: pendingEvaluations } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('evaluator_id', expertId).eq('status', 'pending').is('submission.contest_id', null);
        const { count: acceptedEvaluations } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('evaluator_id', expertId).eq('status', 'accepted').is('submission.contest_id', null);
        const { count: pendingInvitations } = await supabase.from('contest_judges').select('*', { count: 'exact', head: true }).eq('judge_id', expertId).eq('status', 'pending');
        const { count: completedTasks } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('evaluator_id', expertId).eq('status', 'evaluated');

        return {
            pendingEvaluations: pendingEvaluations || 0,
            acceptedEvaluations: acceptedEvaluations || 0,
            pendingInvitations: pendingInvitations || 0,
            completedTasks: completedTasks || 0,
        };
    }

    /**
     * ===================================================================
     * ▼▼▼ [ส่วนที่อัปเดต] ฟังก์ชันสำหรับหน้า Queue งานประเมิน ▼▼▼
     * ===================================================================
     */
    async getEvaluationQueue(expertId) {
        const { data, error } = await supabase
            .from('assignments')
            // [อัปเดต] เพิ่ม `fish_video_url` เข้าไปในคำสั่ง select
            .select(`
                id, 
                status, 
                submission:submissions!inner(
                    id, 
                    fish_name, 
                    fish_type, 
                    fish_image_urls, 
                    fish_video_url, 
                    owner:profiles(first_name, last_name)
                )
            `)
            .eq('evaluator_id', expertId)
            .in('status', ['pending', 'accepted'])
            .is('submission.contest_id', null);

        if (error) throw new Error('ไม่สามารถดึงคิวงานประเมินได้: ' + error.message);
        
        const formattedData = data.map(item => ({
            assignment_id: item.id,
            status: item.status,
            submission_id: item.submission.id,
            fish_name: item.submission.fish_name,
            fish_type: item.submission.fish_type,
            owner_name: `${item.submission.owner.first_name || ''} ${item.submission.owner.last_name || ''}`.trim(),
            
            // [อัปเดต] ส่ง Array รูปภาพทั้งหมดและ URL วิดีโอไปตรงๆ
            fish_image_urls: item.submission.fish_image_urls,
            fish_video_url: item.submission.fish_video_url
        }));

        return {
            pending: formattedData.filter(item => item.status === 'pending'),
            accepted: formattedData.filter(item => item.status === 'accepted'),
        };
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับตอบรับ/ปฏิเสธ งานประเมินคุณภาพ
     * ===================================================================
     */
    async respondToEvaluation(assignmentId, expertId, status, reason = null) {
        const { data: check, error: checkError } = await supabase.from('assignments').select('id').eq('id', assignmentId).eq('evaluator_id', expertId).eq('status', 'pending').single();
        if (checkError || !check) throw new Error('ไม่พบ Assignment หรือคุณไม่มีสิทธิ์ในการดำเนินการ');
        
        const { data, error } = await supabase.from('assignments').update({ status: status, reject_reason: reason }).eq('id', assignmentId).select().single();
        if (error) throw error;
        return data;
    }
    
    /**
     * ===================================================================
     * ฟังก์ชันสำหรับส่งคะแนนการประเมินคุณภาพ
     * ===================================================================
     */
    async submitQualityScores(assignmentId, expertId, scoresData) {
        const { data: check, error: checkError } = await supabase.from('assignments').select('id, submission_id, submission:submissions(owner_id, fish_name)').eq('id', assignmentId).eq('evaluator_id', expertId).eq('status', 'accepted').single();
        if (checkError || !check) throw new Error('ไม่สามารถให้คะแนนได้ งานนี้อาจยังไม่ถูกตอบรับหรือไม่มีสิทธิ์');
        
        const { data, error } = await supabase.from('assignments').update({ status: 'evaluated', scores: scoresData.scores, total_score: scoresData.totalScore, evaluated_at: new Date().toISOString() }).eq('id', assignmentId).select().single();
        if (error) throw error;
        
        await supabase.from('submissions').update({ final_score: scoresData.totalScore, status: 'evaluated' }).eq('id', check.submission_id);

        const ownerId = check.submission?.owner_id;
        const fishName = check.submission?.fish_name || 'ของคุณ';
        if (ownerId) {
            NotificationService.createNotification(ownerId, `ผลการประเมินคุณภาพปลากัด "${fishName}" ออกแล้ว! ได้รับคะแนน ${scoresData.totalScore}`, `/history`);
        }
        return data;
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับหน้า Judging (ดึงทั้งคำเชิญและรายการที่รับแล้ว)
     * ===================================================================
     */
    async getJudgingContests(expertId) {
        const { data: invitations, error: invitesError } = await supabase.from('contest_judges').select(`status, contest:contests!inner(id, name, start_date, end_date)`).eq('judge_id', expertId).eq('status', 'pending');
        if (invitesError) throw invitesError;

        const { data: myContests, error: contestsError } = await supabase.from('contest_judges').select(`status, contest:contests!inner(id, name, start_date, end_date, status)`).eq('judge_id', expertId).eq('status', 'accepted').in('contest.status', ['กำลังดำเนินการ', 'ตัดสิน']);
        if (contestsError) throw contestsError;

        return {
            invitations: invitations.map(i => ({ ...i.contest, expert_status: i.status })),
            myContests: myContests.map(c => ({ ...c.contest, expert_status: c.status })),
        };
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับตอบรับ/ปฏิเสธ คำเชิญเป็นกรรมการ
     * ===================================================================
     */
    async respondToJudgeInvitation(contestId, expertId, response) {
        const { data: expertProfile, error: expertError } = await supabase.from('profiles').select('first_name, last_name').eq('id', expertId).single();
        const { data: contestInfo, error: contestError } = await supabase.from('contests').select('name, created_by').eq('id', contestId).single();
        if (expertError || contestError) throw new Error('ไม่สามารถดึงข้อมูลที่จำเป็นได้');

        const { data, error } = await supabase.from('contest_judges').update({ status: response }).match({ contest_id: contestId, judge_id: expertId });
        if (error) throw new Error('เกิดข้อผิดพลาดในการตอบรับคำเชิญ: ' + error.message);

        const managerId = contestInfo.created_by;
        const expertName = `${expertProfile.first_name || ''} ${expertProfile.last_name || ''}`.trim();
        const responseText = response === 'accepted' ? 'ตอบรับ' : 'ปฏิเสธ';
        const message = `กรรมการ "${expertName}" ได้ ${responseText} คำเชิญในการประกวด "${contestInfo.name}"`;
        await NotificationService.createNotification(managerId, message, `/manager/assign-judges`);

        return data;
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับดึงรายชื่อปลาในแต่ละการประกวด
     * ===================================================================
     */
    async getFishInContest(contestId, expertId) {
        const { data, error } = await supabase.from('submissions').select(`*, owner:profiles(first_name, last_name)`).eq('contest_id', contestId).eq('status', 'approved');
        if (error) throw new Error('ไม่สามารถดึงรายชื่อปลาได้: ' + error.message);
        return data;
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับส่งคะแนนปลากัดในการแข่งขัน
     * ===================================================================
     */
    async submitCompetitionScore(submissionId, expertId, scoresData) {
        const { data, error } = await supabase.from('assignments').update({ scores: scoresData.scores, total_score: scoresData.totalScore, status: 'evaluated', evaluated_at: new Date().toISOString() }).match({ submission_id: submissionId, evaluator_id: expertId });
        if (error) throw new Error('เกิดข้อผิดพลาดในการส่งคะแนน: ' + error.message);
        return data;
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับดึงประวัติการทำงาน
     * ===================================================================
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
            const uniqueContests = data.reduce((acc, item) => {
                const contest = item.submission.contest;
                if (!acc[contest.id]) {
                    acc[contest.id] = { id: contest.id, date: contest.end_date, name: contest.name, type: 'การแข่งขัน' };
                }
                return acc;
            }, {});
            return Object.values(uniqueContests);
        }
        throw new Error('Invalid history type specified');
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับดึงเกณฑ์การให้คะแนนตามประเภทปลา
     * ===================================================================
     */
    async getScoringSchema(bettaType) {
        const schema = scoringSchemas[bettaType] || scoringSchemas['default'];
        if (!schema) {
            throw new Error('ไม่พบเกณฑ์การให้คะแนนสำหรับประเภทปลานี้');
        }
        return schema;
    }
}

module.exports = new ExpertService();