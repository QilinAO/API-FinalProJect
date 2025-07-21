// D:\ProJectFinal\Lasts\betta-fish-api\src\controllers\expertController.js (ฉบับสมบูรณ์)

// --- ส่วนที่ 1: การนำเข้า (Imports) ---

const ExpertService = require('../services/expertService');


// --- ส่วนที่ 2: Controller Class ---

class ExpertController {

    /**
     * ===================================================================
     * Controller สำหรับหน้า Dashboard
     * ===================================================================
     */
    async getDashboardStats(req, res) {
        try {
            const stats = await ExpertService.getDashboardStats(req.userId);
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับหน้า Queue งานประเมิน
     * ===================================================================
     */
    async getEvaluationQueue(req, res) {
        try {
            const queue = await ExpertService.getEvaluationQueue(req.userId);
            res.json({ success: true, data: queue });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับตอบรับ/ปฏิเสธ งานประเมินคุณภาพ
     * ===================================================================
     */
    async respondToEvaluation(req, res) {
        try {
            const { assignmentId } = req.params;
            const { status, reason } = req.body;
            const result = await ExpertService.respondToEvaluation(assignmentId, req.userId, status, reason);
            res.json({ success: true, data: result });
        } catch (error) {
            // [อัปเดต] เปลี่ยนจาก 403 เป็น 400 (Bad Request)
            // เพื่อบ่งบอกว่าเป็นข้อผิดพลาดจากคำขอของผู้ใช้ (เช่น งานไม่มีอยู่แล้ว)
            // และป้องกันการ Logout อัตโนมัติ
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับส่งคะแนนการประเมินคุณภาพ
     * ===================================================================
     */
    async submitQualityScores(req, res) {
        try {
            const { assignmentId } = req.params;
            const scoresData = req.body;
            const result = await ExpertService.submitQualityScores(assignmentId, req.userId, scoresData);
            res.json({ success: true, data: result });
        } catch (error) {
            // [อัปเดต] เปลี่ยนจาก 403 เป็น 400 (Bad Request)
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับหน้า Judging
     * ===================================================================
     */
    async getJudgingContests(req, res) {
        try {
            const contests = await ExpertService.getJudgingContests(req.userId);
            res.json({ success: true, data: contests });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับตอบรับ/ปฏิเสธ คำเชิญเป็นกรรมการ
     * ===================================================================
     */
    async respondToJudgeInvitation(req, res) {
        try {
            const { contestId } = req.params;
            const { response } = req.body;
            const result = await ExpertService.respondToJudgeInvitation(contestId, req.userId, response);
            res.json({ success: true, data: result });
        } catch (error) {
            // [อัปเดต] เปลี่ยนจาก 403 เป็น 400 (Bad Request)
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับดึงรายชื่อปลาในแต่ละการประกวด
     * ===================================================================
     */
    async getFishInContest(req, res) {
        try {
            const { contestId } = req.params;
            const submissions = await ExpertService.getFishInContest(contestId, req.userId);
            res.json({ success: true, data: submissions });
        } catch (error) {
            // [อัปเดต] เปลี่ยนจาก 403 เป็น 400 (Bad Request)
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับส่งคะแนนปลากัดในการแข่งขัน
     * ===================================================================
     */
    async submitCompetitionScore(req, res) {
        try {
            const { submissionId } = req.params;
            const scoresData = req.body;
            const result = await ExpertService.submitCompetitionScore(submissionId, req.userId, scoresData);
            res.json({ success: true, data: result });
        } catch (error) {
            // [อัปเดต] เปลี่ยนจาก 403 เป็น 400 (Bad Request)
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับดึงประวัติการทำงาน
     * ===================================================================
     */
    async getExpertHistory(req, res) {
        try {
            const { type } = req.query;
            if (!type) return res.status(400).json({ success: false, error: 'กรุณาระบุประเภทของประวัติ' });
            const history = await ExpertService.getExpertHistory(req.userId, type);
            res.json({ success: true, data: history });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * ===================================================================
     * Controller สำหรับดึงเกณฑ์การให้คะแนน
     * ===================================================================
     */
    async getScoringSchema(req, res) {
        try {
            const { bettaType } = req.params;
            const schema = await ExpertService.getScoringSchema(bettaType);
            res.json({ success: true, data: schema });
        } catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ExpertController();