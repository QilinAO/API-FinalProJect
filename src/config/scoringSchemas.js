// D:\ProJectFinal\Lasts\betta-fish-api\src\config\scoringSchemas.js

const scoringSchemas = {
    'ปลากัดพื้นบ้านภาคใต้': [
        { key: "head_body", label: "หัวและลำตัว", max: 10 },
        { key: "cheeks_scales", label: "แก้มและเกล็ด", max: 15 },
        { key: "dorsal_fin", label: "ครีบหลังหรือกระโดง", max: 10 },
        { key: "caudal_fin", label: "ครีบหาง", max: 15 },
        { key: "pelvic_fin", label: "ครีบท้องหรือตะเกียบ", max: 5 },
        { key: "anal_fin", label: "ครีบก้นหรือชายน้ำ", max: 15 },
        { key: "flaring_swimming", label: "การพองสู้และว่ายน้ำ", max: 10 },
        { key: "overall", label: "ภาพรวม", max: 20 },
    ],
    'ปลากัดพื้นบ้านภาคอีสาน': [
        { key: "head_body", label: "หัวและลำตัว", max: 10 },
        { key: "cheeks_scales", label: "แก้มและเกล็ด", max: 15 },
        { key: "dorsal_fin", label: "ครีบหลังหรือกระโดง", max: 10 },
        { key: "caudal_fin", label: "ครีบหาง", max: 15 },
        { key: "pelvic_fin", label: "ครีบท้องหรือตะเกียบ", max: 10 },
        { key: "anal_fin", label: "ครีบก้นหรือชายน้ำ", max: 10 },
        { key: "flaring_swimming", label: "การพองสู้และว่ายน้ำ", max: 10 },
        { key: "overall", label: "ภาพรวม", max: 20 },
    ],
    'ปลากัดพื้นบ้านมหาชัย': [ // (คุณมีข้อมูลนี้ซ้ำ 2 ครั้ง ผมขอรวมเป็นอันเดียวนะครับ)
        { key: "head_body", label: "หัวและลำตัว", max: 10 },
        { key: "cheeks_scales", label: "แก้มและเกล็ด", max: 15 },
        { key: "dorsal_fin", label: "ครีบหลังหรือกระโดง", max: 10 },
        { key: "caudal_fin", label: "ครีบหาง", max: 15 },
        { key: "pelvic_fin", label: "ครีบท้องหรือตะเกียบ", max: 10 },
        { key: "anal_fin", label: "ครีบก้นหรือชายน้ำ", max: 10 },
        { key: "flaring_swimming", label: "การพองสู้และว่ายน้ำ", max: 10 },
        { key: "overall", label: "ภาพรวม", max: 20 },
    ],
    'ปลากัดพื้นบ้านอีสานหางลาย': [
        { key: "head_body", label: "หัวและลำตัว", max: 10 },
        { key: "cheeks_scales", label: "แก้มและเกล็ด", max: 10 },
        { key: "dorsal_fin", label: "ครีบหลังหรือกระโดง", max: 10 },
        { key: "caudal_fin", label: "ครีบหาง", max: 20 },
        { key: "pelvic_fin", label: "ครีบท้องหรือตะเกียบ", max: 10 },
        { key: "anal_fin", label: "ครีบก้นหรือชายน้ำ", max: 10 },
        { key: "flaring_swimming", label: "การพองสู้และว่ายน้ำ", max: 10 },
        { key: "overall", label: "ภาพรวม", max: 20 },
    ],
    'ปลากัดพื้นบ้านภาคตะวันออก': [
        { key: "head_body", label: "หัวและลำตัว", max: 10 },
        { key: "cheeks_scales", label: "แก้มและเกล็ด", max: 15 },
        { key: "dorsal_fin", label: "ครีบหลังหรือกระโดง", max: 10 },
        { key: "caudal_fin", label: "ครีบหาง", max: 15 },
        { key: "pelvic_fin", label: "ครีบท้องหรือตะเกียบ", max: 5 },
        { key: "anal_fin", label: "ครีบก้นหรือชายน้ำ", max: 15 },
        { key: "flaring_swimming", label: "การพองสู้และว่ายน้ำ", max: 10 },
        { key: "overall", label: "ภาพรวม", max: 20 },
    ],
    'ปลากัดพื้นบ้านภาคกลางและเหนือ': [
        { key: "head_body", label: "หัวและลำตัว", max: 10 },
        { key: "cheeks_scales", label: "แก้มและเกล็ด", max: 15 },
        { key: "dorsal_fin", label: "ครีบหลังหรือกระโดง", max: 10 },
        { key: "caudal_fin", label: "ครีบหาง", max: 15 },
        { key: "pelvic_fin", label: "ครีบท้องหรือตะเกียบ", max: 5 },
        { key: "anal_fin", label: "ครีบก้นหรือชายน้ำ", max: 15 },
        { key: "flaring_swimming", label: "การพองสู้และว่ายน้ำ", max: 10 },
        { key: "overall", label: "ภาพรวม", max: 20 },
    ],
    // เพิ่ม Default Schema เผื่อกรณีที่ไม่ตรงกับประเภทไหนเลย
    'default': [
        { key: 'body_shape', label: 'รูปร่างและลำตัว', max: 20 },
        { key: 'fins_tail', label: 'ครีบและหาง', max: 30 },
        { key: 'color', label: 'สีสันและลวดลาย', max: 25 },
        { key: 'flare_attitude', label: 'การพองสู้', max: 15 },
        { key: 'overall_impression', label: 'ความสมบูรณ์โดยรวม', max: 10 },
    ]
};

module.exports = scoringSchemas;