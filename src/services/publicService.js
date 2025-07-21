const { supabase } = require('../config/supabase');

class PublicService {

    /**
     * ดึงข้อมูลสำหรับ Carousel ในหน้าแรก
     * โดยจะดึงเฉพาะ 'การประกวด' ที่มีสถานะ 'กำลังดำเนินการ' เท่านั้น
     */
    async getCarouselContent() {
        const { data, error } = await supabase
            .from('contests')
            .select('id, name, poster_url, category')
            .eq('category', 'การประกวด')
            .eq('status', 'กำลังดำเนินการ')
            .order('created_at', { ascending: false })
            .limit(8);

        if (error) {
            throw new Error('ไม่สามารถดึงข้อมูลสำหรับ Carousel ได้: ' + error.message);
        }
        return data;
    }

    /**
     * ดึงข้อมูลข่าวสารแนะนำสำหรับ Grid ในหน้าแรก
     * โดยจะดึงเฉพาะ 'ข่าวสาร' ที่มีสถานะ 'published'
     */
    async getRecommendedNews() {
        const { data, error } = await supabase
            .from('contests')
            .select('*')
            .in('category', ['ข่าวสารทั่วไป', 'ข่าวสารประชาสัมพันธ์'])
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(8);

        if (error) {
            throw new Error('ไม่สามารถดึงข้อมูลข่าวสารแนะนำได้: ' + error.message);
        }
        return data;
    }

    /**
     * [อัปเกรด] ดึง Content ทั้งหมดตาม category ที่ระบุ
     * ใช้สำหรับหน้า AllNewsPage และ ContestPage
     * @param {string} category - 'news' หรือ 'contest'
     */
    async getAllContent(category) {
        let query = supabase.from('contests').select('*');

        if (category === 'news') {
            // สำหรับข่าวสาร: ดึงเฉพาะที่มีสถานะ 'published'
            query = query.in('category', ['ข่าวสารทั่วไป', 'ข่าวสารประชาสัมพันธ์'])
                         .eq('status', 'published');
        } else if (category === 'contest') {
            // สำหรับการประกวด: ดึงเฉพาะที่มีสถานะ 'กำลังดำเนินการ'
            query = query.eq('category', 'การประกวด')
                         .eq('status', 'กำลังดำเนินการ');
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            throw new Error(`ไม่สามารถดึงข้อมูลประเภท ${category} ได้: ` + error.message);
        }
        return data;
    }

    /**
     * ดึง Content ชิ้นเดียวตาม ID
     * ใช้สำหรับหน้ารายละเอียด (SingleNewsPage)
     * @param {number} id - ID ของ content
     */
    async getContentById(id) {
        const { data, error } = await supabase
            .from('contests')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                return null;
            }
            throw new Error('ไม่สามารถดึงข้อมูลตาม ID ได้: ' + error.message);
        }
        return data;
    }
}

module.exports = new PublicService();