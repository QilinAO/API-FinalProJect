# HuggingFace Migration Guide

## การเปลี่ยนแปลง

โปรเจกต์นี้ได้เปลี่ยนจากการใช้โมเดล AI แบบ self-hosted มาเป็นการใช้ **HuggingFace Inference API** แทน

## การตั้งค่าที่จำเป็น

### 1. สร้าง HuggingFace Account และ API Token

1. สร้างบัญชีที่ [HuggingFace.co](https://huggingface.co)
2. ไปที่ Settings > Access Tokens
3. สร้าง New Token (ประเภท Read)
4. คัดลอก token เก็บไว้

### 2. อัปโหลดโมเดลไปยัง HuggingFace

1. สร้าง Repository ใหม่บน HuggingFace Hub
2. อัปโหลดไฟล์โมเดลของคุณ
3. ตั้งค่า model card และ labels ให้ถูกต้อง

### 3. ตั้งค่า Environment Variables

ในไฟล์ `.env` ของ Backend:

```env
# HuggingFace Configuration
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxx
HUGGINGFACE_MODEL_NAME=your-username/your-betta-fish-model-name
```

## รูปแบบ Response ที่เปลี่ยนแปลง

### เดิม (Self-hosted model):
```json
{
  "final_label": {
    "code": "A",
    "confidence": 0.95
  },
  "top1": {
    "prob": 0.95,
    "label": "Type_A"
  }
}
```

### ใหม่ (HuggingFace):
```json
{
  "final_label": {
    "code": "A",
    "confidence": 0.95,
    "label": "LABEL_A"
  },
  "top1": {
    "prob": 0.95,
    "label": "LABEL_A"  
  },
  "predictions": [
    {
      "label": "LABEL_A",
      "score": 0.95,
      "code": "A"
    }
  ]
}
```

## การทดสอบ

### ทดสอบสถานะ Model API:
```bash
cd scripts
node testAIValidation.js
```

### ทดสอบการ predict:
```bash
cd scripts  
node testAIValidationWithToken.js
```

## การปรับแต่ง Label Extraction

ใน `modelApiService.js`, method `extractBettaTypeFromLabel()` จะแปลง label จาก HuggingFace ให้เป็นประเภทปลากัด (A-H)

ปรับแต่งตามรูปแบบ label ของโมเดลคุณ:

```javascript
extractBettaTypeFromLabel(label) {
  // ตัวอย่าง: "LABEL_A" -> "A"
  // ตัวอย่าง: "betta_type_B" -> "B"  
  // ตัวอย่าง: "Type_C" -> "C"
  
  const match = label.match(/[A-H]/i);
  return match ? match[0].toUpperCase() : 'UNKNOWN';
}
```

## ข้อจำกัดของ HuggingFace Inference API

1. **Rate Limiting**: มีการจำกัดจำนวน request ต่อชั่วโมง
2. **Cold Start**: โมเดลอาจใช้เวลาในการ load ครั้งแรก
3. **Batch Processing**: ไม่รองรับ batch โดยตรง (ใช้ Promise.all แทน)

## การ Troubleshooting

### ปัญหาที่พบบ่อย:

1. **"HuggingFace API token is required"**
   - ตรวจสอบ environment variable `HUGGINGFACE_API_TOKEN`

2. **"Invalid response from HuggingFace model"**
   - ตรวจสอบว่าโมเดลส่ง response ในรูปแบบ array of predictions
   - ตรวจสอบว่าโมเดลพร้อมใช้งาน (ไม่ใช่ private หรือ loading)

3. **"Model status check failed"**
   - ตรวจสอบชื่อโมเดลใน `HUGGINGFACE_MODEL_NAME`
   - ตรวจสอบว่าโมเดลเป็น public หรือคุณมีสิทธิ์เข้าถึง

## การย้อนกลับ (Rollback)

หากต้องการใช้โมเดลเดิม:

1. เปลี่ยน environment variables กลับไปใช้:
   ```env
   MODEL_API_URL=http://localhost:8000
   MODEL_API_TIMEOUT=30000
   ```

2. ใช้ git เพื่อ revert การเปลี่ยนแปลงใน `modelApiService.js`

## สรุป

การเปลี่ยนแปลงนี้จะทำให้:
- ✅ ไม่ต้องจัดการ infrastructure สำหรับโมเดล
- ✅ ใช้ computational resources ของ HuggingFace
- ✅ อัปเดตโมเดลได้ง่ายขึ้น
- ⚠️ ขึ้นกับ internet connection
- ⚠️ มี rate limiting และ cost (สำหรับ usage สูง)
