# 🚀 Backend API Deployment Guide

## 📋 การเตรียมตัวก่อน Deploy

### 1. Environment Variables ที่จำเป็น:
```bash
NODE_ENV=production
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
FRONTEND_URLS=https://your-frontend-domain.vercel.app,https://your-frontend-domain.netlify.app
```

---

## 🔥 **Railway (แนะนำ - ฟรี $5/เดือน)**

### ขั้นตอน Deploy:

1. **สมัครสมาชิก Railway:**
   - ไปที่ https://railway.app
   - เข้าสู่ระบบด้วย GitHub (QilinAO)

2. **สร้าง Project ใหม่:**
   - กด "New Project"
   - เลือก "Deploy from GitHub repo"
   - เลือก Repository: `API-FinalProJect`

3. **ตั้งค่า Environment Variables:**
   ```bash
   NODE_ENV=production
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
   JWT_SECRET=your-secret-key-here
   FRONTEND_URLS=https://your-frontend.vercel.app
   ```

4. **Deploy:**
   - Railway จะ auto-deploy จาก GitHub
   - URL จะเป็น: `https://your-project-name.up.railway.app`

---

## 🌐 **Render (ฟรี แต่มี sleep mode)**

### ขั้นตอน Deploy:

1. **สมัครสมาชิก Render:**
   - ไปที่ https://render.com
   - เข้าสู่ระบบด้วย GitHub (QilinAO)

2. **สร้าง Web Service:**
   - กด "New +" → "Web Service"
   - เลือก Repository: `API-FinalProJect`
   - ตั้งค่า:
     ```
     Name: bettafish-api
     Environment: Node
     Build Command: npm install
     Start Command: npm start
     ```

3. **ตั้งค่า Environment Variables:**
   - เหมือนกับ Railway ข้างต้น

4. **Deploy:**
   - URL จะเป็น: `https://bettafish-api.onrender.com`

---

## ☁️ **Heroku (มีค่าใช้จ่าย)**

### ขั้นตอน Deploy:

1. **ติดตั้ง Heroku CLI:**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login และสร้าง App:**
   ```bash
   heroku login
   heroku create bettafish-api
   ```

3. **ตั้งค่า Environment Variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SUPABASE_URL=your_url
   heroku config:set SUPABASE_ANON_KEY=your_key
   # ... ตัวแปรอื่นๆ
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

---

## 🏃‍♂️ **วิธีการ Deploy แบบง่าย (แนะนำ Railway)**

### ขั้นตอนสั้น ๆ:

1. **ไปที่ https://railway.app**
2. **เข้าสู่ระบบด้วย GitHub**
3. **New Project → Deploy from GitHub → เลือก API-FinalProJect**
4. **ตั้งค่า Environment Variables ใน Settings**
5. **Deploy จะทำอัตโนมัติ**

### Environment Variables สำคัญ:
```bash
NODE_ENV=production
SUPABASE_URL=https://xxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=super-secret-jwt-key-here
FRONTEND_URLS=https://bettafish.vercel.app
```

---

## ✅ **ตรวจสอบหลัง Deploy**

### 1. Health Check:
```bash
curl https://your-api-domain.com/api/health
```

**ผลลัพธ์ที่ควรได้:**
```json
{
  "success": true,
  "status": "OK",
  "service": "betta-fish-api"
}
```

### 2. ทดสอบ API Endpoints:
```bash
# Test public endpoint
curl https://your-api-domain.com/api/public/content/all

# Test auth endpoint (จะได้ 401 ถ้าไม่มี token - ถือว่าปกติ)
curl https://your-api-domain.com/api/auth/profile
```

---

## 🔧 **Troubleshooting**

### ปัญหาที่พบบ่อย:

1. **Port Error:**
   - ใช้ `process.env.PORT` ในโค้ด ✅ (มีแล้ว)

2. **CORS Error:**
   - ตั้งค่า `FRONTEND_URLS` ให้ถูกต้อง

3. **Database Connection Error:**
   - ตรวจสอบ Supabase credentials

4. **Build Error:**
   - ตรวจสอบ `package.json` dependencies

---

## 📊 **เปรียบเทียบ Platforms**

| Platform | ฟรี | Speed | คุณสมบัติ | แนะนำ |
|----------|-----|-------|----------|-------|
| **Railway** | $5/เดือน | ⭐⭐⭐⭐⭐ | Auto-deploy, No sleep | ✅ |
| **Render** | ฟรี | ⭐⭐⭐ | Sleep mode | ⚠️ |
| **Heroku** | ชั่วโมงฟรี | ⭐⭐⭐⭐ | มีประสบการณ์ | 💰 |

---

## 🎯 **แนะนำ: Railway**

**ทำไมเลือก Railway:**
- ✅ ไม่มี sleep mode
- ✅ Deploy รวดเร็ว
- ✅ GitHub integration ดี
- ✅ Environment variables ง่าย
- ✅ ราคาไม่แพง ($5/เดือน)

---

## 🔗 **Next Steps**

หลังจาก Deploy Backend แล้ว:

1. **จดบันทึก API URL:** `https://your-project.up.railway.app`
2. **ไปตั้งค่า Frontend** ในขั้นตอนต่อไป
3. **ทดสอบการเชื่อมต่อ** ระหว่าง Frontend-Backend
