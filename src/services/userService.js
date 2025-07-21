const { supabase } = require('../config/supabase');
const path = require('path');

class UserService {

    async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้: ' + error.message);
        }
        return data;
    }

    async updateProfile(userId, profileData) {
        const { firstName, lastName, ...rest } = profileData;
        const dataToUpdate = { ...rest, updated_at: new Date().toISOString() };
        if (firstName !== undefined) dataToUpdate.first_name = firstName;
        if (lastName !== undefined) dataToUpdate.last_name = lastName;

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

        const { data, error } = await supabase
            .from('profiles')
            .update(dataToUpdate)
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            throw new Error('ไม่สามารถอัพเดทโปรไฟล์ได้: ' + error.message);
        }
        return data;
    }

    async uploadProfilePicture(userId, fileBuffer, originalFileName) {
        const fileExtension = path.extname(originalFileName);
        const newFileName = `${userId}${fileExtension}`;
        const filePath = `Profile/${newFileName}`;

        const { error: uploadError } = await supabase.storage
            .from('posters')
            .upload(filePath, fileBuffer, { upsert: true });
        if (uploadError) {
            throw new Error('Supabase Storage Error: ' + uploadError.message);
        }

        const { data: urlData } = supabase.storage
            .from('posters')
            .getPublicUrl(filePath);
        return await this.updateProfile(userId, { avatar_url: urlData.publicUrl });
    }

    async getAllUsers() {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data;
    }

    async getEvaluationHistory(userId) {
        const { data, error } = await supabase
            .from('submissions')
            .select(`id, fish_name, fish_type, fish_age_months, fish_image_urls, fish_video_url, submitted_at, status, final_score, assignments ( status, total_score, evaluator:profiles(first_name) )`)
            .eq('owner_id', userId)
            .is('contest_id', null)
            .order('submitted_at', { ascending: false });

        if (error) {
            throw new Error('ไม่สามารถดึงประวัติการประเมินได้: ' + error.message);
        }

        const processedData = data.map(sub => {
            let displayStatus = 'รอการตรวจสอบ';
            let detail = '';
            if (sub.status === 'rejected') {
                displayStatus = 'ถูกปฏิเสธ';
            } else if (sub.status === 'approved') {
                if (sub.assignments && sub.assignments.length > 0 && sub.assignments[0].status === 'evaluated') {
                    displayStatus = 'ประเมินเสร็จสิ้น';
                    detail = `คะแนน: ${sub.assignments[0].total_score || 'N/A'}`;
                } else {
                    displayStatus = 'รอผู้เชี่ยวชาญประเมิน';
                    detail = `มอบหมายให้: ${sub.assignments[0]?.evaluator?.first_name || 'ผู้เชี่ยวชาญ'}`;
                }
            }
            return {
                id: sub.id,
                betta_name: sub.fish_name,
                evaluationDate: sub.submitted_at,
                status: displayStatus,
                detail: detail,
                images: sub.fish_image_urls,
                video: sub.fish_video_url,
                fish_type: sub.fish_type,
                fish_age_months: sub.fish_age_months,
                raw_assignments: sub.assignments
            };
        });
        return processedData;
    }

    /**
     * [ฟังก์ชันใหม่] ดึงประวัติการเข้าร่วมประกวดของผู้ใช้
     * @param {string} userId - UUID ของผู้ใช้
     */
    async getCompetitionHistory(userId) {
        const { data, error } = await supabase
            .from('submissions')
            .select(`
                id,
                fish_name,
                submitted_at,
                status,
                final_score,
                contest:contests ( name, status )
            `)
            .eq('owner_id', userId)
            .not('contest_id', 'is', null) // ดึงเฉพาะรายการที่มี contest_id
            .order('submitted_at', { ascending: false });

        if (error) {
            throw new Error('ไม่สามารถดึงประวัติการแข่งขันได้: ' + error.message);
        }
        return data;
    }
}

module.exports = new UserService();