// ======================================================================
// File: src/services/modelApiService.js
// หน้าที่: จัดการการเรียกใช้ AI Model API สำหรับตรวจสอบประเภทปลากัด
// ======================================================================

const axios = require('axios');
const FormData = require('form-data');

class ModelApiService {
  constructor() {
    this.timeout = 30000; // 30 วินาที
    const envUrl = (process.env.MODEL_API_URL || '').trim();
    // ลำดับ host ที่จะลองเชื่อมต่ออัตโนมัติ (รองรับรันนอก Docker และใน Docker)
    this.candidates = [
      envUrl,
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://host.docker.internal:8000',
      'http://web-infer:8000',
    ].filter(Boolean);
    this.baseURL = null; // ค่าใช้งานจริง จะกำหนดหลังตรวจสอบ
  }

  async ensureBaseURL() {
    if (this.baseURL) return this.baseURL;
    for (const url of this.candidates) {
      try {
        const res = await axios.get(url + '/', { timeout: 2000 });
        if (res?.data && (res.data.status === 'ok' || res.status === 200)) {
          this.baseURL = url;
          return this.baseURL;
        }
      } catch (_) { /* ลองตัวถัดไป */ }
    }
    throw new Error('ไม่สามารถเชื่อมต่อ Model API ได้จาก hosts ที่กำหนด');
  }

  /**
   * ตรวจสอบประเภทปลากัดจากรูปภาพ
   * @param {Buffer} imageBuffer - รูปภาพในรูปแบบ Buffer
   * @param {number} threshold - ความเชื่อมั่นขั้นต่ำ (default: 0.90)
   * @returns {Promise<Object>} ผลการตรวจสอบ
   */
  async predictBettaType(imageBuffer, threshold = 0.90) {
    try {
      const base = await this.ensureBaseURL();
      const formData = new FormData();
      formData.append('file', imageBuffer, { filename: 'betta.jpg', contentType: 'image/jpeg' });

      const response = await axios.post(`${base}/predict`, formData, {
        params: {
          threshold: threshold,
          topk: 3
        },
        headers: {
          ...formData.getHeaders(),
        },
        timeout: this.timeout
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Model API Error:', error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * ตรวจสอบประเภทปลากัดจากหลายรูปภาพ
   * @param {Array<Buffer>} imageBuffers - รูปภาพหลายรูปในรูปแบบ Buffer
   * @param {number} threshold - ความเชื่อมั่นขั้นต่ำ (default: 0.90)
   * @returns {Promise<Object>} ผลการตรวจสอบ
   */
  async predictBettaTypeBatch(imageBuffers, threshold = 0.90) {
    try {
      const base = await this.ensureBaseURL();
      const formData = new FormData();
      
      imageBuffers.forEach((buffer, index) => {
        formData.append('files', buffer, { 
          filename: `betta_${index}.jpg`, 
          contentType: 'image/jpeg' 
        });
      });

      const response = await axios.post(`${base}/predict/batch`, formData, {
        params: {
          threshold: threshold,
          topk: 3
        },
        headers: {
          ...formData.getHeaders(),
        },
        timeout: this.timeout
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Model API Batch Error:', error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * ตรวจสอบว่าโมเดล API พร้อมใช้งานหรือไม่
   * @returns {Promise<boolean>}
   */
  async isModelReady() {
    try {
      const base = await this.ensureBaseURL();
      const response = await axios.get(`${base}/`, {
        timeout: 5000
      });
      return response.data.status === 'ok';
    } catch (error) {
      console.error('Model API Health Check Error:', error.message);
      return false;
    }
  }

  /**
   * ดึงข้อมูล taxonomy ของโมเดล
   * @returns {Promise<Object>}
   */
  async getModelTaxonomy() {
    try {
      const base = await this.ensureBaseURL();
      const response = await axios.get(`${base}/meta`, {
        timeout: 5000
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Model API Taxonomy Error:', error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * ตรวจสอบความสอดคล้องของประเภทปลากัด
   * @param {string} userSelectedType - ประเภทที่ผู้ใช้เลือก (A, B, C, D, E, F, G, H)
   * @param {Array<string>} allowedTypes - ประเภทที่การประกวดอนุญาต
   * @param {string} aiPredictedType - ประเภทที่ AI ตรวจพบ
   * @param {number} confidence - ความเชื่อมั่นของ AI (0-1)
   * @returns {Object} ผลการตรวจสอบ
   */
  validateBettaType(userSelectedType, allowedTypes, aiPredictedType, confidence = 0) {
    const isUserTypeAllowed = allowedTypes.includes(userSelectedType);
    const isAiTypeAllowed = allowedTypes.includes(aiPredictedType);
    const isAiConfident = confidence >= 0.90;
    const isTypeMatch = userSelectedType === aiPredictedType;

    let warning = null;
    let severity = 'info';

    // กรณีที่ AI ไม่มั่นใจ
    if (!isAiConfident) {
      warning = {
        message: 'AI ไม่สามารถระบุประเภทปลากัดได้อย่างชัดเจน (ความเชื่อมั่นต่ำ)',
        severity: 'warning',
        type: 'low_confidence'
      };
    }
    // กรณีที่ประเภทที่ผู้ใช้เลือกไม่ตรงกับที่ AI ตรวจพบ
    else if (!isTypeMatch) {
      warning = {
        message: `AI ตรวจพบว่าเป็นปลากัดประเภท "${aiPredictedType}" แต่คุณเลือกประเภท "${userSelectedType}"`,
        severity: 'warning',
        type: 'type_mismatch',
        aiPrediction: aiPredictedType,
        userSelection: userSelectedType
      };
    }
    // กรณีที่ AI ตรวจพบประเภทที่ไม่ได้รับอนุญาต
    else if (!isAiTypeAllowed) {
      warning = {
        message: `AI ตรวจพบว่าเป็นปลากัดประเภท "${aiPredictedType}" ซึ่งไม่ได้รับอนุญาตในการประกวดนี้`,
        severity: 'error',
        type: 'unauthorized_type',
        aiPrediction: aiPredictedType
      };
    }

    return {
      isValid: isUserTypeAllowed && (isAiConfident ? isAiTypeAllowed : true),
      isUserTypeAllowed,
      isAiTypeAllowed,
      isAiConfident,
      isTypeMatch,
      warning,
      confidence,
      userSelectedType,
      aiPredictedType
    };
  }
}

module.exports = new ModelApiService();
