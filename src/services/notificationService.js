// D:\ProJectFinal\Lasts\betta-fish-api\src\services\notificationService.js
const { supabaseAdmin } = require('../config/supabase');

class NotificationService {
  // ---------------- Utils ----------------
  #isNonEmptyString(v) {
    return typeof v === 'string' && v.trim() !== '';
  }

  #sanitizeRow(row = {}) {
    const user_id = String(row.user_id || '').trim();
    const message = String(row.message || '').trim();
    const link_to = this.#isNonEmptyString(row.link_to) ? String(row.link_to).trim() : null;
    const type = this.#isNonEmptyString(row.type) ? String(row.type).trim() : null;
    const meta = row.meta && typeof row.meta === 'object' ? row.meta : {};

    if (!this.#isNonEmptyString(user_id)) throw new Error('user_id ไม่ถูกต้อง');
    if (!this.#isNonEmptyString(message)) throw new Error('message ไม่ถูกต้อง');

    return { user_id, message, link_to, type, meta };
  }

  #isMissingTypeOrMetaErr(error) {
    const msg = String(error?.message || '').toLowerCase();
    return msg.includes('column "type" does not exist') || 
           msg.includes('column "meta" does not exist') ||
           msg.includes('column "title" does not exist');
  }

  // ---------------- Create (object style) ----------------
  /**
   * สร้างแจ้งเตือน 1 รายการ
   * @param {Object} p
   * @param {string} p.user_id
   * @param {string} p.message
   * @param {string|null} [p.link_to]
   * @param {string|null} [p.type]  // contest_submission | assignment_request | assignment_evaluated | contest_result | ...
   * @param {Object} [p.meta]       // payload เพิ่มเติม
   */
  async create(p = {}) {
    const row = this.#sanitizeRow(p);

    // พยายาม insert พร้อม type/meta ก่อน
    let q = supabaseAdmin.from('notifications').insert([row]).select().single();
    let { data, error } = await q;

    // ถ้าตารางยังไม่มีคอลัมน์ type/meta/title → fallback
    if (error && this.#isMissingTypeOrMetaErr(error)) {
      const fallback = { user_id: row.user_id, message: row.message, link_to: row.link_to };
      const result = await supabaseAdmin.from('notifications').insert([fallback]).select().single();
      if (result.error) throw new Error('สร้าง Notification ไม่สำเร็จ: ' + result.error.message);
      return result.data;
    }

    if (error) {
      console.error('create error:', error);
      throw new Error('สร้าง Notification ไม่สำเร็จ: ' + error.message);
    }

    return data;
  }

  // ---------------- Backward compatible API ----------------
  /**
   * เข้ากันได้กับโค้ดเดิม: createNotification(userId, message, linkTo)
   */
  async createNotification(userId, message, linkTo = null) {
    return this.create({ user_id: userId, message, link_to: linkTo });
  }

  // ---------------- Bulk create ----------------
  /**
   * สร้างแจ้งเตือนหลายรายการพร้อมกัน
   * @param {Array<{user_id:string,message:string,link_to?:string,type?:string,meta?:object}>} rows
   */
  async bulkCreate(rows = []) {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const payload = rows.map((r) => this.#sanitizeRow(r));
    let { data, error } = await supabaseAdmin.from('notifications').insert(payload).select();

    if (error && this.#isMissingTypeOrMetaErr(error)) {
      // ถ้า schema ไม่มี type/meta ให้ fallback ตัดสองคอลัมน์นี้ทิ้งแล้วลองอีกครั้ง
      const fallbackPayload = payload.map(({ user_id, message, link_to }) => ({ user_id, message, link_to }));
      const result = await supabaseAdmin.from('notifications').insert(fallbackPayload).select();
      if (result.error) throw new Error('สร้าง Notification แบบกลุ่มไม่สำเร็จ: ' + result.error.message);
      return result.data || [];
    }

    if (error) {
      console.error('bulkCreate error:', error);
      throw new Error('สร้าง Notification แบบกลุ่มไม่สำเร็จ: ' + error.message);
    }

    return data || [];
  }

  // ---------------- List / Get ----------------
  /**
   * ดึงการแจ้งเตือนของผู้ใช้
   * @param {string} userId
   * @param {Object} [opt]
   * @param {boolean} [opt.unreadOnly=false]
   * @param {number}  [opt.limit=50]
   * @param {string[]}[opt.types]  // ถ้าระบุ จะแสดงเฉพาะ type ตามที่กำหนด
   */
  async getNotifications(userId, { unreadOnly = false, limit = 50, types } = {}) {
    if (!this.#isNonEmptyString(userId)) throw new Error('userId ไม่ถูกต้อง');
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Number(limit), 200) : 50;

    let query = supabaseAdmin
      .from('notifications')
      .select('id, created_at, message, link_to, is_read, type, meta')
      .eq('user_id', userId.trim())
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (unreadOnly) query = query.eq('is_read', false);
    if (Array.isArray(types) && types.length) query = query.in('type', types);

    const { data, error } = await query;
    if (error) {
      console.error('getNotifications error:', error);
      throw new Error('ไม่สามารถดึงการแจ้งเตือนได้: ' + error.message);
    }
    return Array.isArray(data) ? data : [];
  }

  // ---------------- Read / Mark read ----------------
  /**
   * ทำรายการเดียวเป็นอ่านแล้ว
   */
  async markAsRead(notificationId, userId) {
    if (!this.#isNonEmptyString(userId)) throw new Error('userId ไม่ถูกต้อง');
    const idNum = typeof notificationId === 'number'
      ? notificationId
      : Number(String(notificationId).trim());
    if (!Number.isFinite(idNum)) throw new Error('notificationId ไม่ถูกต้อง');

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .match({ id: idNum, user_id: String(userId).trim() })
      .select()
      .single();

    if (error) {
      console.error('markAsRead error:', error);
      throw new Error('ไม่สามารถอัปเดตสถานะการแจ้งเตือนได้: ' + error.message);
    }
    return data;
  }

  /**
   * ทำทั้งหมดของผู้ใช้เป็นอ่านแล้ว
   */
  async markAllAsRead(userId) {
    if (!this.#isNonEmptyString(userId)) throw new Error('userId ไม่ถูกต้อง');

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', String(userId).trim())
      .eq('is_read', false)
      .select();

    if (error) {
      console.error('markAllAsRead error:', error);
      throw new Error('ไม่สามารถอัปเดตการแจ้งเตือนทั้งหมด: ' + error.message);
    }
    return Array.isArray(data) ? data.length : 0;
  }
}

module.exports = new NotificationService();
