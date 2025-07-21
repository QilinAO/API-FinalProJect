// D:\ProJectFinal\Lasts\my-project\src\services\api.js (ฉบับแก้ไขที่ถูกต้อง 100%)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // [แก้ไข] เปลี่ยนชื่อ Key ที่ใช้ดึง Token ให้ถูกต้องเป็น 'authToken'
    const token = localStorage.getItem('authToken');

    const headers = { ...options.headers };
    
    // แนบ Token ที่ถูกต้องไปกับ Header (ถ้ามี)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { ...options, headers };

    // จัดการ body และ content-type สำหรับ FormData และ JSON โดยอัตโนมัติ
    if (options.body && !(options.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 204) return null;
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: data });
  }

  put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: data });
  }
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default new ApiService();