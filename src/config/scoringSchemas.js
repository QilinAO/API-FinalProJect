// D:\ProJectFinal\Lasts\betta-fish-api\src\config\scoringSchemas.js

const scoringSchemas = {
  // ภาคใต้
  'ปลากัดพื้นบ้านภาคใต้': [
    { key: 'head_body', label: 'ส่วนหัวและลำตัว', max: 10, desc: 'ลำตัวเข้มแข็ง ผิวหนังเรียบ สีเข้มตามชนิด' },
    { key: 'cheeks_scales', label: 'แก้มและเกล็ด', max: 15, desc: 'แก้มเต็ม เกล็ดแนบผิว สม่ำเสมอ' },
    { key: 'dorsal_fin', label: 'ครีบหลัง (Dorsal Fin) / กระโดง', max: 10, desc: 'รูปทรงครีบดี ไม่ฉีกขาด สัดส่วนเหมาะสม' },
    { key: 'anal_fin', label: 'ครีบก้น (Anal Fin)', max: 15, desc: 'แนบลำตัว สัดส่วนสมดุล เส้นครีบสวยงาม' },
    { key: 'pelvic_fin', label: 'ครีบท้อง/ตะเกียบ (Pelvic fin)', max: 5, desc: 'เส้นตรง รับกับลำตัว ไม่บิดงอ' },
    { key: 'caudal_fin', label: 'ครีบหาง (Caudal Fin)', max: 15, desc: 'ทรงหางดี แผ่เต็ม มีความสมบูรณ์' },
    { key: 'flaring_swimming', label: 'การพองสู้และการว่ายน้ำ', max: 10, desc: 'ว่ายน้ำทรงตัวดีและพองสู้ดี' },
    { key: 'overall', label: 'ภาพรวม', max: 20, desc: 'ความสมดุลโดยรวม ความสวยงาม ความสมบูรณ์' },
  ],

  // ภาคอีสาน
  'ปลากัดพื้นบ้านภาคอีสาน': [
    { key: 'head_body', label: 'ส่วนหัวและลำตัว', max: 10 },
    { key: 'cheeks_scales', label: 'แก้มและเกล็ด', max: 15 },
    { key: 'dorsal_fin', label: 'ครีบหลัง (Dorsal Fin)', max: 10 },
    { key: 'anal_fin', label: 'ครีบก้น (Anal Fin)', max: 10 },
    { key: 'pelvic_fin', label: 'ครีบท้อง/ตะเกียบ (Pelvic fin)', max: 10 },
    { key: 'caudal_fin', label: 'ครีบหาง (Caudal Fin)', max: 15 },
    { key: 'flaring_swimming', label: 'การพองสู้และการว่ายน้ำ', max: 10 },
    { key: 'overall', label: 'ภาพรวม', max: 20 },
  ],

  // มหาชัย
  'ปลากัดพื้นบ้านมหาชัย': [
    { key: 'head_body', label: 'ส่วนหัวและลำตัว', max: 10 },
    { key: 'cheeks_scales', label: 'แก้มและเกล็ด', max: 15 },
    { key: 'dorsal_fin', label: 'ครีบหลัง (Dorsal Fin)', max: 10 },
    { key: 'anal_fin', label: 'ครีบก้น (Anal Fin)', max: 10 },
    { key: 'pelvic_fin', label: 'ครีบท้อง/ตะเกียบ (Pelvic fin)', max: 10 },
    { key: 'caudal_fin', label: 'ครีบหาง (Caudal Fin)', max: 15 },
    { key: 'flaring_swimming', label: 'การพองสู้และการว่ายน้ำ', max: 10 },
    { key: 'overall', label: 'ภาพรวม', max: 20 },
  ],

  // อีสานหางลาย
  'ปลากัดพื้นบ้านอีสานหางลาย': [
    { key: 'head_body', label: 'ส่วนหัวและลำตัว', max: 10 },
    { key: 'cheeks_scales', label: 'แก้มและเกล็ด', max: 10 },
    { key: 'dorsal_fin', label: 'ครีบหลัง (Dorsal Fin)', max: 10 },
    { key: 'anal_fin', label: 'ครีบก้น (Anal Fin)', max: 10 },
    { key: 'pelvic_fin', label: 'ครีบท้อง/ตะเกียบ (Pelvic fin)', max: 10 },
    { key: 'caudal_fin', label: 'ครีบหาง (Caudal Fin)', max: 20 },
    { key: 'flaring_swimming', label: 'การพองสู้และการว่ายน้ำ', max: 10 },
    { key: 'overall', label: 'ภาพรวม', max: 20 },
  ],

  // ภาคตะวันออก
  'ปลากัดพื้นบ้านภาคตะวันออก': [
    { key: 'head_body', label: 'ส่วนหัวและลำตัว', max: 10 },
    { key: 'cheeks_scales', label: 'แก้มและเกล็ด', max: 15 },
    { key: 'dorsal_fin', label: 'ครีบหลัง (Dorsal Fin)', max: 10 },
    { key: 'anal_fin', label: 'ครีบก้น (Anal Fin)', max: 15 },
    { key: 'pelvic_fin', label: 'ครีบท้อง/ตะเกียบ (Pelvic fin)', max: 5 },
    { key: 'caudal_fin', label: 'ครีบหาง (Caudal Fin)', max: 15 },
    { key: 'flaring_swimming', label: 'การพองสู้และการว่ายน้ำ', max: 10 },
    { key: 'overall', label: 'ภาพรวม', max: 20 },
  ],

  // ภาคกลางและเหนือ
  'ปลากัดพื้นบ้านภาคกลางและเหนือ': [
    { key: 'head_body', label: 'ส่วนหัวและลำตัว', max: 10 },
    { key: 'cheeks_scales', label: 'แก้มและเกล็ด', max: 15 },
    { key: 'dorsal_fin', label: 'ครีบหลัง (Dorsal Fin)', max: 10 },
    { key: 'anal_fin', label: 'ครีบก้น (Anal Fin)', max: 15 },
    { key: 'pelvic_fin', label: 'ครีบท้อง/ตะเกียบ (Pelvic fin)', max: 5 },
    { key: 'caudal_fin', label: 'ครีบหาง (Caudal Fin)', max: 15 },
    { key: 'flaring_swimming', label: 'การพองสู้และการว่ายน้ำ', max: 10 },
    { key: 'overall', label: 'ภาพรวม', max: 20 },
  ],

  // สายพัฒนา (ตามตารางที่ 61)
  'ปลากัดสายพัฒนา': [
    { key: 'head_body', label: 'ส่วนหัวและลำตัว', max: 20 },
    { key: 'cheeks_scales', label: 'แก้มและเกล็ด/สี', max: 20 },
    { key: 'dorsal_fin', label: 'ครีบหลัง (Dorsal Fin)/กระโดง', max: 5 },
    { key: 'anal_fin', label: 'ครีบก้น (Anal Fin)', max: 5 },
    { key: 'pelvic_fin', label: 'ครีบท้อง/ตะเกียบ (Pelvic fin)', max: 10 },
    { key: 'caudal_fin', label: 'ครีบหาง (Caudal Fin)', max: 10 },
    { key: 'flaring_swimming', label: 'การพองสู้/การทรงตัว/ว่ายน้ำ', max: 10 },
    { key: 'overall', label: 'ภาพรวม', max: 20 },
  ],

  // Default เผื่อไม่ตรงกับประเภทใด
  default: [
    { key: 'body_shape', label: 'รูปร่างและลำตัว', max: 20 },
    { key: 'fins_tail', label: 'ครีบและหาง', max: 30 },
    { key: 'color', label: 'สีสันและลวดลาย', max: 25 },
    { key: 'flare_attitude', label: 'การพองสู้', max: 15 },
    { key: 'overall_impression', label: 'ความสมบูรณ์โดยรวม', max: 10 },
  ],
};

module.exports = scoringSchemas;
