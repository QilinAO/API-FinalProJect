// ======================================================================
// File: src/services/api.js
// หน้าที่: Service กลางสำหรับจัดการการสื่อสารกับ API ทั้งหมด
// ======================================================================

import { getAccessToken, signoutUser } from './authService';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

/**
 * Custom Error class สำหรับข้อผิดพลาดที่เกิดจากการเรียก API
 */
export class ApiHttpError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status || 0;
    this.payload = payload ?? null;
  }
}

/**
 * สร้าง URL ที่สมบูรณ์พร้อม Query Parameters
 */
function buildUrl(endpoint, query) {
  const url = new URL(endpoint.replace(/^\/+/, ''), `${API_BASE_URL}/`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

class ApiService {
  constructor() {
    this._onUnauthorized = null;
  }

  /**
   * กำหนดฟังก์ชันที่จะถูกเรียกเมื่อ API ตอบกลับด้วยสถานะ 401/403
   * (AuthContext จะใช้ฟังก์ชันนี้เพื่อตั้งค่าการ Logout อัตโนมัติ)
   */
  setOnUnauthorized(handler) {
    this._onUnauthorized = typeof handler === 'function' ? handler : null;
  }

  /**
   * สร้าง Headers สำหรับ Request
   */
  _getHeaders(body) {
    const headers = { Accept: 'application/json' };
    const isFormData = body instanceof FormData;

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * เมธอดหลักสำหรับส่ง Request ไปยัง API
   */
  async request(method, endpoint, body = null, options = {}) {
    const { query, signal, timeoutMs = 15000 } = options;
    const url = buildUrl(endpoint, query);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const fetchOptions = {
      method,
      headers: this._getHeaders(body),
      signal: signal || controller.signal,
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : null,
    };

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (response.status === 204) {
        return null;
      }

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        // [สำคัญ] จัดการ 401/403 Unauthorized
        if (response.status === 401 || response.status === 403) {
          this._onUnauthorized?.(); // เรียก Handler ที่ AuthContext ตั้งไว้
          signoutUser(); // Logout ทันทีเป็น Fallback
        }
        
        const errorMessage = responseData?.error || responseData?.message || `HTTP Error ${response.status}`;
        throw new ApiHttpError(errorMessage, response.status, responseData);
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiHttpError('การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง', 408, null);
      }
      if (error instanceof ApiHttpError) {
        throw error;
      }
      throw new ApiHttpError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 0, { cause: error });
    }
  }

  get(endpoint, query, options) {
    return this.request('GET', endpoint, null, { ...options, query });
  }

  post(endpoint, body, options) {
    return this.request('POST', endpoint, body, options);
  }

  put(endpoint, body, options) {
    return this.request('PUT', endpoint, body, options);
  }

  patch(endpoint, body, options) {
    return this.request('PATCH', endpoint, body, options);
  }

  delete(endpoint, options) {
    return this.request('DELETE', endpoint, null, options);
  }
}

const apiService = new ApiService();
export default apiService;