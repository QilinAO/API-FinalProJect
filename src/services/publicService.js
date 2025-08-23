// ======================================================================
// File: src/services/publicService.js
// หน้าที่: จัดการ Logic การดึงข้อมูลสำหรับส่วนสาธารณะ (Public-facing)
// ======================================================================

const { supabase } = require('../config/supabase');

class PublicService {
  /**
   * สร้าง Query พื้นฐานสำหรับดึงข้อมูลสาธารณะ (ข่าวสาร + การประกวดที่ Active)
   * @private
   * @returns {PostgrestQueryBuilder}
   */
  #getBasePublicContentQuery() {
    return supabase
      .from('contests')
      .select('*')
      .or(
        'and(category.in.("ข่าวสารทั่วไป","ข่าวสารประชาสัมพันธ์"),status.eq.published),' +
        'and(category.eq.การประกวด,status.eq.กำลังดำเนินการ)'
      );
  }

  /**
   * ดึงข้อมูลสำหรับ Carousel ในหน้าแรก (เฉพาะการประกวดที่กำลังดำเนินการ)
   * @returns {Promise<Array>}
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
      throw new Error(`ไม่สามารถดึงข้อมูลสำหรับ Carousel ได้: ${error.message}`);
    }
    return data || [];
  }

  /**
   * ดึงข้อมูลแนะนำสำหรับ Grid ในหน้าแรก (ข่าวสาร + การประกวดที่ Active)
   * @returns {Promise<Array>}
   */
  async getRecommendedNews() {
    const { data, error } = await this.#getBasePublicContentQuery()
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      throw new Error(`ไม่สามารถดึงข้อมูลแนะนำได้: ${error.message}`);
    }
    return data || [];
  }

  /**
   * ดึงข้อมูล Content ทั้งหมดตาม category ที่ระบุ
   * @param {'news' | 'contest'} category - ประเภทของเนื้อหาที่ต้องการ
   * @returns {Promise<Array>}
   */
  async getAllContent(category) {
    let query;

    if (category === 'news') {
      query = this.#getBasePublicContentQuery();
    } else if (category === 'contest') {
      query = supabase
        .from('contests')
        .select('*')
        .eq('category', 'การประกวด')
        .eq('status', 'กำลังดำเนินการ');
    } else {
      // กรณีมีการส่ง category ที่ไม่รู้จักเข้ามา ให้คืนค่าเป็น Array ว่าง
      return [];
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`ไม่สามารถดึงข้อมูลประเภท ${category} ได้: ${error.message}`);
    }
    return data || [];
  }

  /**
   * ดึง Content ชิ้นเดียวตาม ID
   * @param {string} id - UUID ของ Content
   * @returns {Promise<object|null>}
   */
  async getContentById(id) {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // หากไม่พบข้อมูล (PGRST116) ให้คืนค่า null ซึ่งเป็นพฤติกรรมที่คาดหวัง
      if (error.code === 'PGRST116') {
        return null;
      }
      // หากเป็น Error อื่นๆ ให้ throw
      throw new Error(`ไม่สามารถดึงข้อมูล ID ${id} ได้: ${error.message}`);
    }
    return data;
  }

  /**
   * ดึงรายการประกวดที่กำลังเปิดรับสมัคร (สำหรับฟอร์มส่งประกวด)
   * @returns {Promise<Array>}
   */
  async getActiveContests() {
    const { data, error } = await supabase
      .from('contests')
      .select('id, name, allowed_subcategories')
      .eq('category', 'การประกวด')
      .eq('status', 'กำลังดำเนินการ')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`ไม่สามารถดึงข้อมูลการประกวดที่กำลังดำเนินการได้: ${error.message}`);
    }
    return data || [];
  }
}

module.exports = new PublicService();