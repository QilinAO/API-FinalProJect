// ======================================================================
// File: src/services/submissionService.js
// โหมด: ใช้ supabaseAdmin.rpc เพื่อ bypass RLS (สูตร B)
// มีทั้ง createSubmission (compat) และ createSubmissionAdmin
// ======================================================================

'use strict';

const { supabaseAdmin } = require('../config/supabase');

function toStringArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return s.split(',').map((x) => x.trim()).filter(Boolean);
    }
  }
  return [];
}

function isUuidLike(s) {
  return typeof s === 'string' && /^[0-9a-fA-F-]{36}$/.test(s);
}

class SubmissionService {
  #sanitize(params = {}) {
    const {
      p_owner_id,
      p_contest_id,
      p_fish_name,
      p_fish_type,
      p_fish_age_months,
      p_fish_image_urls,
      p_fish_video_url,
    } = params;

    const ownerId = isUuidLike(p_owner_id) ? p_owner_id : null;
    const contestId = p_contest_id || null;

    const ageNum = parseInt(p_fish_age_months, 10);
    const age = Number.isFinite(ageNum) ? ageNum : null;

    const images = Array.from(
      new Set(
        toStringArray(p_fish_image_urls)
          .map((u) => String(u).trim())
          .filter(Boolean)
      )
    );

    const videoUrl =
      typeof p_fish_video_url === 'string' && p_fish_video_url.trim()
        ? p_fish_video_url.trim()
        : null;

    return {
      p_owner_id: ownerId,
      p_contest_id: contestId,
      p_fish_name: p_fish_name || null,
      p_fish_type: p_fish_type || null,
      p_fish_age_months: age,
      p_fish_image_urls: images, // ส่งเป็น JS array ของ string
      p_fish_video_url: videoUrl,
    };
  }

  async #rpcCreate(payload) {
    const { data, error } = await supabaseAdmin.rpc('create_full_submission', payload);
    if (error) throw new Error(`RPC create_full_submission: ${error.message}`);
    if (!data) throw new Error('RPC ไม่ได้คืนค่า submission ID');
    return data; // UUID
  }

  /**
   * ใช้โดย controller เดิม (compatible)
   * คาดว่า controller ได้ตรวจ req.userId แล้วตั้ง p_owner_id มาให้แล้ว
   */
  async createSubmission(params) {
    const payload = this.#sanitize(params);
    if (!payload.p_owner_id) throw new Error('p_owner_id ไม่ถูกต้อง');
    return this.#rpcCreate(payload);
  }

  /**
   * เวอร์ชันเข้มงวด: ตรวจ owner ฝั่งเซิร์ฟเวอร์ด้วย
   * @param {object} params - พารามิเตอร์ RPC
   * @param {string} currentUserId - UUID ผู้ใช้จาก middleware
   */
  async createSubmissionAdmin(params, currentUserId) {
    const payload = this.#sanitize(params);
    if (!payload.p_owner_id) throw new Error('p_owner_id ไม่ถูกต้อง');
    if (!isUuidLike(currentUserId)) throw new Error('currentUserId ไม่ถูกต้อง');
    if (payload.p_owner_id !== currentUserId) {
      throw new Error('forbidden: owner mismatch (server check)');
    }
    return this.#rpcCreate(payload);
  }
}

module.exports = new SubmissionService();
