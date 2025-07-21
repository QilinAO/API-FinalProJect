const { supabase } = require('../config/supabase');
const NotificationService = require('./notificationService');

class SubmissionService {

    async #getRandomExpertBySpeciality(bettaType) {
        let { data: experts, error } = await supabase
            .from('profiles')
            .select('id, specialities')
            .eq('role', 'expert')
            .not('specialities', 'is', null);

        if (error) {
            console.error("Error fetching experts:", error);
            throw error;
        }
        if (!experts || experts.length === 0) {
            console.warn("No experts with specialities found.");
            return null;
        }
        let primaryMatches = experts.filter(e => Array.isArray(e.specialities) && e.specialities[0] === bettaType);
        if (primaryMatches.length > 0) {
            const selectedExpert = primaryMatches[Math.floor(Math.random() * primaryMatches.length)];
            return selectedExpert.id;
        }
        let secondaryMatches = experts.filter(e => Array.isArray(e.specialities) && e.specialities[1] === bettaType);
        if (secondaryMatches.length > 0) {
            const selectedExpert = secondaryMatches[Math.floor(Math.random() * secondaryMatches.length)];
            return selectedExpert.id;
        }
        const anyExpert = experts[Math.floor(Math.random() * experts.length)];
        return anyExpert.id;
    }

    async createSubmissionAndAssignments(submissionData) {
        const { contest_id, ...restOfData } = submissionData;

        const { data: newSubmission, error: submissionError } = await supabase
            .from('submissions')
            .insert({ ...restOfData, contest_id: contest_id || null, status: 'pending' })
            .select()
            .single();

        if (submissionError) {
            throw new Error('ไม่สามารถสร้าง Submission ได้: ' + submissionError.message);
        }

        if (contest_id) {
            // --- Logic สำหรับการส่งเข้าประกวด ---
            const { data: judges, error: judgeError } = await supabase
                .from('contest_judges')
                .select('judge_id')
                .eq('contest_id', contest_id)
                .eq('status', 'accepted');

            if (judgeError) throw new Error('ไม่สามารถดึงรายชื่อกรรมการได้: ' + judgeError.message);

            if (judges && judges.length > 0) {
                const assignmentsToCreate = judges.map(j => ({
                    submission_id: newSubmission.id,
                    evaluator_id: j.judge_id,
                    status: 'pending'
                }));
                const { error: assignmentError } = await supabase.from('assignments').insert(assignmentsToCreate);
                if (assignmentError) {
                    console.error(`สร้าง Submission สำเร็จ (ID: ${newSubmission.id}) แต่สร้าง Assignment สำหรับการประกวดไม่สำเร็จ:`, assignmentError.message);
                }
                console.log(`Successfully created submission ${newSubmission.id} for contest ${contest_id} and assigned to ${judges.length} judges.`);
            } else {
                console.warn(`Contest ID ${contest_id} has no accepted judges. Submission created without assignments.`);
            }

        } else {
            // --- Logic สำหรับการประเมินคุณภาพ ---
            const expertId = await this.#getRandomExpertBySpeciality(restOfData.fish_type);
            if (!expertId) {
                console.warn(`ไม่พบผู้เชี่ยวชาญในระบบเพื่อมอบหมายงานให้กับ Submission ID: ${newSubmission.id}`);
                return newSubmission;
            }
            const { error: assignmentError } = await supabase
                .from('assignments')
                .insert({
                    submission_id: newSubmission.id,
                    evaluator_id: expertId,
                    status: 'pending'
                });

            if (assignmentError) {
                console.error(`สร้าง Submission สำเร็จ (ID: ${newSubmission.id}) แต่สร้าง Assignment ไม่สำเร็จ:`, assignmentError.message);
                throw new Error('สร้าง Submission สำเร็จ แต่ไม่สามารถมอบหมายงานให้ผู้เชี่ยวชาญได้');
            }
            
            // ▼▼▼▼▼ [ส่วนที่เพิ่มเข้ามา] สร้างการแจ้งเตือนส่งให้ Expert ▼▼▼▼▼
            const message = `คุณได้รับมอบหมายให้ประเมินคุณภาพปลากัด: "${newSubmission.fish_name}"`;
            const linkTo = `/expert/evaluations`;
            await NotificationService.createNotification(expertId, message, linkTo);
            // ▲▲▲▲▲ [จบส่วนที่เพิ่ม] ▲▲▲▲▲

            console.log(`Successfully created quality evaluation submission ${newSubmission.id} and assigned to expert ${expertId}`);
        }

        return newSubmission;
    }
}

module.exports = new SubmissionService();