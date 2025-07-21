const ManagerService = require('../services/managerService');
const { v4: uuidv4 } = require('uuid');
const { supabase, supabaseAdmin } = require('../config/supabase'); 
const path = require('path');

class ManagerController {

    async createContestOrNews(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'กรุณาอัปโหลดโปสเตอร์' });
            }
            
            const file = req.file;
            const fileExtension = path.extname(file.originalname);
            const safeFileName = `${uuidv4()}${fileExtension}`;
            const folderPath = 'ContestPosters';
            const fullPath = `${folderPath}/${safeFileName}`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('posters')
                .upload(fullPath, file.buffer, { contentType: file.mimetype });

            if (uploadError) {
                throw new Error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + uploadError.message);
            }

            const { data: urlData } = supabase.storage.from('posters').getPublicUrl(fullPath);

            const bodyData = { ...req.body };
            if (bodyData.allowed_subcategories) {
                bodyData.allowed_subcategories = JSON.parse(bodyData.allowed_subcategories);
            }
            if (bodyData.is_vote_open) {
                bodyData.is_vote_open = bodyData.is_vote_open === 'true';
            }
            
            const judgeIds = bodyData.judge_ids ? JSON.parse(bodyData.judge_ids) : [];
            
            const { judge_ids, ...contestPayload } = bodyData;
            const contestData = { ...contestPayload, poster_url: urlData.publicUrl };

            const newContest = await ManagerService.createContestOrNews(req.userId, contestData);

            if (newContest.category === 'การประกวด' && judgeIds.length > 0) {
                console.log(`Assigning ${judgeIds.length} judges to new contest ID: ${newContest.id}`);
                for (const judgeId of judgeIds) {
                    await ManagerService.assignJudgeToContest(newContest.id, judgeId, req.userId);
                }
            }

            res.status(201).json(newContest);

        } catch (error) {
            console.error("Error in createContestOrNews:", error);
            res.status(500).json({ error: error.message });
        }
    }

    async getAllMyContests(req, res) { try { const contests = await ManagerService.getMyContests(req.userId); res.status(200).json(contests); } catch (error) { res.status(500).json({ error: error.message }); } }
    async updateMyContest(req, res) { try { const contest = await ManagerService.updateMyContest(req.params.id, req.userId, req.body); res.status(200).json(contest); } catch (error) { res.status(500).json({ error: error.message }); } }
    async deleteMyContest(req, res) { try { await ManagerService.deleteMyContest(req.params.id, req.userId); res.status(204).send(); } catch (error) { res.status(500).json({ error: error.message }); } }
    async getExpertList(req, res) { try { const experts = await ManagerService.getExpertList(); res.status(200).json(experts); } catch (error) { res.status(500).json({ error: error.message }); } }
    async assignJudgeToContest(req, res) { try { const { judgeId } = req.body; const assignment = await ManagerService.assignJudgeToContest(req.params.id, judgeId, req.userId); res.status(201).json(assignment); } catch (error) { res.status(500).json({ error: error.message }); } }
    async removeJudgeFromContest(req, res) { try { const { contestId, judgeId } = req.params; await ManagerService.removeJudgeFromContest(contestId, judgeId, req.userId); res.status(200).json({ message: 'ปลดกรรมการสำเร็จ' }); } catch (error) { res.status(500).json({ error: error.message }); } }
    async getSubmissionsForContest(req, res) { try { const submissions = await ManagerService.getContestSubmissions(req.params.id, req.userId); res.status(200).json(submissions); } catch (error) { res.status(500).json({ error: error.message }); } }
    async updateSubmissionStatus(req, res) { try { const { status } = req.body; const submission = await ManagerService.updateSubmissionStatus(req.params.id, status, req.userId); res.status(200).json(submission); } catch (error) { res.status(500).json({ error: error.message }); } }
    async getDashboardStats(req, res) { try { const stats = await ManagerService.getDashboardStats(req.userId); res.status(200).json(stats); } catch (error) { res.status(500).json({ error: error.message }); } }
    async getContestHistory(req, res) { try { const history = await ManagerService.getContestHistory(req.userId); res.status(200).json(history); } catch (error) { res.status(500).json({ error: error.message }); } }
    async getAllResults(req, res) { try { const results = await ManagerService.getAllResults(req.userId); res.status(200).json(results); } catch (error) { res.status(500).json({ error: error.message }); } }

    async updateContestStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ error: 'กรุณาระบุสถานะที่ต้องการอัปเดต' });
            }
            const updatedContest = await ManagerService.updateContestStatus(id, req.userId, status);
            res.status(200).json(updatedContest);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async finalizeContest(req, res) {
        try {
            const { id } = req.params;
            const result = await ManagerService.finalizeContest(id, req.userId);
            res.status(200).json({ message: 'การประกวดสิ้นสุดและประกาศผลสำเร็จ', data: result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // ▼▼▼▼▼ ส่วนที่เพิ่มเข้ามาใหม่ ▼▼▼▼▼

    /**
     * [ใหม่] ดึงข้อมูลสำหรับหน้าโปรไฟล์ของผู้จัดการ
     */
    async getManagerProfileDashboard(req, res) {
        try {
            const data = await ManagerService.getManagerProfileDashboard(req.userId);
            res.status(200).json({ success: true, data: data });
        } catch (error) {
            console.error("Error in getManagerProfileDashboard:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ManagerController();