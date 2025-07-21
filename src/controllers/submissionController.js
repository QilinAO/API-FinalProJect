// =======================================================================
// File: betta-fish-api/src/controllers/submissionController.js (ฉบับแก้ไข)
// =======================================================================
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin, supabase } = require('../config/supabase');
const submissionService = require('../services/submissionService');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });

exports.uploadSubmissionFiles = upload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'video', maxCount: 1 }
]);

exports.createEvaluationSubmission = async (req, res) => {
    try {
        const userId = req.userId;
        // [แก้ไข] ดึง contest_id จาก body ด้วย
        // [EDIT] Also retrieve contest_id from the request body.
        const { betta_name, betta_type, betta_age_months, contest_id } = req.body;
        const files = req.files;

        if (!userId) return res.status(401).json({ error: 'ไม่สามารถระบุตัวตนผู้ใช้ได้' });
        if (!files.images || files.images.length === 0) return res.status(400).json({ error: 'กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป' });

        const imageUploadPromises = files.images.map(file => {
            const filePath = `Fish/Picture/${uuidv4()}${path.extname(file.originalname)}`;
            return supabaseAdmin.storage.from('posters').upload(filePath, file.buffer, { contentType: file.mimetype });
        });

        const imageResults = await Promise.all(imageUploadPromises);
        const imageUrls = imageResults.map(result => {
            if (result.error) throw new Error(`อัปโหลดรูปล้มเหลว: ${result.error.message}`);
            const { data } = supabase.storage.from('posters').getPublicUrl(result.data.path);
            return data.publicUrl;
        });

        let videoUrl = null;
        if (files.video && files.video.length > 0) {
            const videoFile = files.video[0];
            const videoPath = `Fish/Video/${uuidv4()}${path.extname(videoFile.originalname)}`;
            const { error, data } = await supabaseAdmin.storage.from('posters').upload(videoPath, videoFile.buffer, { contentType: videoFile.mimetype });
            if (error) throw new Error(`อัปโหลดวิดีโอล้มเหลว: ${error.message}`);
            const { data: urlData } = supabase.storage.from('posters').getPublicUrl(data.path);
            videoUrl = urlData.publicUrl;
        }
        
        const submissionPayload = {
            owner_id: userId,
            fish_name: betta_name,
            fish_type: betta_type,
            fish_age_months: betta_age_months ? parseInt(betta_age_months, 10) : null,
            fish_image_urls: imageUrls,
            fish_video_url: videoUrl,
            // [แก้ไข] ส่ง contest_id ไปด้วย (ถ้ามีค่าจะเป็น ID, ถ้าไม่มีจะเป็น undefined ซึ่ง Service จะจัดการต่อ)
            // [EDIT] Pass contest_id along (it will be the ID or undefined, which the service handles).
            contest_id: contest_id 
        };

        const newSubmission = await submissionService.createSubmissionAndAssignments(submissionPayload);

        res.status(201).json({ 
            success: true, 
            message: 'ส่งแบบฟอร์มสำเร็จ!',
            data: newSubmission
        });

    } catch (error) {
        console.error("Error creating submission:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};