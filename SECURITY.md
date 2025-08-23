# Security Guidelines - Betta Fish Evaluation System

## 🔒 การรักษาความปลอดภัย

### Environment Variables
- **ห้าม** commit ไฟล์ `.env` เข้า Git
- ใช้ `.env.example` เป็นแม่แบบและจัดเก็บค่าจริงแยกต่างหาก
- ตรวจสอบให้แน่ใจว่า Supabase keys ถูกต้องและปลอดภัย

### Authentication & Authorization
- ใช้ Supabase JWT tokens เท่านั้น
- ตรวจสอบ role-based permissions อย่างเข้มงวด
- Dev override (`x-user-id`) ทำงานเฉพาะใน development mode เท่านั้น

### API Security
- Rate limiting ทุก endpoints
- Input validation ด้วย Joi schemas
- CORS configuration ที่เหมาะสม
- Security headers (CSP, HSTS, etc.)

### Database Security
- ใช้ Supabase RLS (Row Level Security)
- Admin operations ใช้ Service Role Key เท่าที่จำเป็น
- ไม่ expose sensitive data ใน API responses

### Error Handling
- ไม่ leak sensitive information ใน error messages
- Error reporting แบบ sanitized
- Log security events อย่างเหมาะสม

## 🚨 Security Checklist

### Pre-deployment
- [ ] Environment variables ตั้งค่าครบถ้วน
- [ ] CORS origins กำหนดถูกต้อง
- [ ] Rate limits เหมาะสมกับ production load
- [ ] SSL/TLS certificates ถูกต้อง
- [ ] Database RLS policies เปิดใช้งาน

### Runtime Monitoring
- [ ] Monitor failed authentication attempts
- [ ] Track API rate limit violations
- [ ] Monitor database query patterns
- [ ] Check error report frequencies

### Regular Maintenance
- [ ] Update dependencies ทุกเดือน
- [ ] Review security logs รายสัปดาห์
- [ ] Audit user permissions รายไตรมาส
- [ ] Backup database data ตามกำหนด

## 🔍 Security Reporting

หากพบช่องโหว่ด้านความปลอดภัย:
1. **ห้าม** เปิดเผยใน public repositories
2. ติดต่อทีมพัฒนาโดยตรง
3. รวมรายละเอียดการทำซ้ำ (reproduction steps)
4. แนบหลักฐานที่เกี่ยวข้อง (ถ้ามี)

## 📋 Security Headers Reference

```javascript
// ตัวอย่าง Security Headers ที่ควรมี
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 🛡️ Best Practices

### Code Review
- ตรวจสอบ security implications ทุก PR
- Validate input sanitization
- Review authentication logic
- Check authorization boundaries

### Testing
- Unit tests สำหรับ security functions
- Integration tests สำหรับ authentication flows
- Load testing สำหรับ rate limiting
- Penetration testing แบบจำกัด

### Documentation
- อัพเดต security documentation เมื่อมีการเปลี่ยนแปลง
- Document security decisions และ trade-offs
- Maintain incident response procedures
