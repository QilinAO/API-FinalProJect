// ======================================================================
// File: src/services/autoAssignmentService.js
// หน้าที่: ระบบมอบหมายงานอัตโนมัติให้ผู้เชี่ยวชาญตาม specialities
// ======================================================================

const { supabaseAdmin } = require('../config/supabase');
const NotificationService = require('./notificationService');

// แปลงรหัสประเภทปลากัดเป็นชื่อไทย
function getFishTypeDisplayName(fishType) {
  const typeMap = {
    'A': 'ปลากัดพื้นบ้านภาคกลาง-ภาคเหนือ',
    'B': 'ปลากัดพื้นบ้านอีสาน', 
    'C': 'ปลากัดพื้นบ้านภาคใต้',
    'D': 'ปลากัดพื้นบ้านมหาชัย',
    'ปลากัดพื้นบ้าน': 'ปลากัดพื้นบ้าน',
    'ปลากัดพื้นบ้านมหาชัย': 'ปลากัดพื้นบ้านมหาชัย',
    'ปลากัดพื้นบ้านอีสาน': 'ปลากัดพื้นบ้านอีสาน',
    'ปลากัดพื้นบ้านภาคใต้': 'ปลากัดพื้นบ้านภาคใต้',
    'ปลากัดพื้นบ้านภาคกลาง-ภาคเหนือ': 'ปลากัดพื้นบ้านภาคกลาง-ภาคเหนือ'
  };
  
  return typeMap[fishType] || fishType;
}

class AutoAssignmentService {
  /**
   * หาผู้เชี่ยวชาญที่เหมาะสมตามประเภทปลากัด
   * @param {string} fishType - ประเภทปลากัด
   * @returns {Promise<Array>} รายการผู้เชี่ยวชาญที่เหมาะสม
   */
  async findMatchingExperts(fishType) {
    if (!fishType) return [];

    try {
      // ดึงผู้เชี่ยวชาญทั้งหมดที่มี specialities
      const { data: experts, error } = await supabaseAdmin
        .from('profiles')
        .select('id, username, first_name, last_name, specialities')
        .eq('role', 'expert');

      if (error) {
        console.error('[AutoAssignment] Error fetching experts:', error);
        return [];
      }

      if (!experts || experts.length === 0) {
        console.warn('[AutoAssignment] No experts found in system');
        return [];
      }

      // แปลงประเภทปลาให้เป็น lowercase สำหรับการเปรียบเทียบ
      const normalizedFishType = fishType.toLowerCase().trim();
      
      // หาผู้เชี่ยวชาญที่มี specialities ตรงกับประเภทปลา
      const matchingExperts = experts.filter(expert => {
        if (!expert.specialities || !Array.isArray(expert.specialities)) {
          return false;
        }

        // ตรวจสอบว่ามี speciality ที่ตรงกับประเภทปลาหรือไม่
        return expert.specialities.some(specialty => {
          const normalizedSpecialty = specialty.toLowerCase().trim();
          
          // ตรวจสอบการตรงกันแบบต่างๆ
          return (
            normalizedSpecialty === normalizedFishType || // ตรงทุกตัวอักษร
            normalizedSpecialty.includes(normalizedFishType) || // ประเภทปลาเป็นส่วนหนึ่งของ specialty
            normalizedFishType.includes(normalizedSpecialty) || // specialty เป็นส่วนหนึ่งของประเภทปลา
            this.isSimilarType(normalizedSpecialty, normalizedFishType) // ความคล้ายคลึงกัน
          );
        });
      });

      // ถ้าไม่มีผู้เชี่ยวชาญที่ตรงกัน ให้คืนผู้เชี่ยวชาญทั้งหมด (random assignment)
      if (matchingExperts.length === 0) {
        console.warn(`[AutoAssignment] No matching experts for fish type: ${fishType}, using all experts`);
        return experts;
      }

      console.log(`[AutoAssignment] Found ${matchingExperts.length} matching experts for fish type: ${fishType}`);
      return matchingExperts;

    } catch (error) {
      console.error('[AutoAssignment] Error in findMatchingExperts:', error);
      return [];
    }
  }

  /**
   * ตรวจสอบความคล้ายคลึงกันของประเภทปลา
   * @param {string} specialty - ความเชี่ยวชาญ
   * @param {string} fishType - ประเภทปลา
   * @returns {boolean}
   */
  isSimilarType(specialty, fishType) {
    // กลุ่มประเภทปลากัดที่คล้ายกัน
    const similarGroups = [
      ['halfmoon', 'hm', 'ฮาล์ฟมูน'],
      ['plakat', 'pk', 'ปลากัด', 'พลากัด'],
      ['crowntail', 'ct', 'คราวน์เทล'],
      ['veiltail', 'vt', 'เวลเทล'],
      ['doubletail', 'dt', 'ดับเบิลเทล'],
      ['betta splendens', 'splendens', 'สเปลนเดนส์'],
      ['fancy', 'แฟนซี', 'สวยงาม'],
      ['fighting', 'ชก', 'สู้']
    ];

    // ตรวจสอบว่าอยู่ในกลุ่มเดียวกันหรือไม่
    for (const group of similarGroups) {
      const hasSpecialty = group.some(term => specialty.includes(term));
      const hasFishType = group.some(term => fishType.includes(term));
      
      if (hasSpecialty && hasFishType) {
        return true;
      }
    }

    return false;
  }

  /**
   * ตรวจสอบภาระงานของผู้เชี่ยวชาญ
   * @param {string} expertId - ID ผู้เชี่ยวชาญ
   * @returns {Promise<number>} จำนวนงานที่ยังไม่เสร็จ
   */
  async getExpertWorkload(expertId) {
    try {
      const { count, error } = await supabaseAdmin
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('evaluator_id', expertId)
        .eq('status', 'pending');

      if (error) {
        console.error('[AutoAssignment] Error getting workload:', error);
        return 999; // ให้ workload สูงถ้าเกิด error เพื่อไม่ให้ได้รับงานเพิ่ม
      }

      return count || 0;
    } catch (error) {
      console.error('[AutoAssignment] Error in getExpertWorkload:', error);
      return 999;
    }
  }

  /**
   * เลือกผู้เชี่ยวชาญที่เหมาะสมที่สุด
   * @param {Array} experts - รายการผู้เชี่ยวชาญ
   * @returns {Promise<Object|null>} ผู้เชี่ยวชาญที่เลือก
   */
  async selectBestExpert(experts) {
    if (!experts || experts.length === 0) return null;

    try {
      // คำนวณภาระงานของแต่ละคน
      const expertsWithWorkload = await Promise.all(
        experts.map(async (expert) => ({
          ...expert,
          workload: await this.getExpertWorkload(expert.id)
        }))
      );

      // เรียงลำดับตามภาระงาน (น้อยที่สุดก่อน)
      expertsWithWorkload.sort((a, b) => a.workload - b.workload);

      // เลือกคนที่มีภาระงานน้อยที่สุด
      const selectedExpert = expertsWithWorkload[0];
      
      console.log(`[AutoAssignment] Selected expert: ${selectedExpert.username} (workload: ${selectedExpert.workload})`);
      
      return selectedExpert;
    } catch (error) {
      console.error('[AutoAssignment] Error in selectBestExpert:', error);
      // ถ้าเกิด error ให้เลือกแบบ random
      return experts[Math.floor(Math.random() * experts.length)];
    }
  }

  /**
   * สร้าง assignment อัตโนมัติสำหรับ submission ที่ approved
   * @param {string} submissionId - ID ของ submission
   * @param {string} fishType - ประเภทปลากัด
   * @returns {Promise<Object|null>} assignment ที่สร้าง
   */
  async createAutoAssignment(submissionId, fishType) {
    if (!submissionId) {
      console.error('[AutoAssignment] Missing submissionId');
      return null;
    }

    try {
      console.log(`[AutoAssignment] Creating assignment for submission: ${submissionId}, fish type: ${fishType}`);

      // 1. หาผู้เชี่ยวชาญที่เหมาะสม
      const matchingExperts = await this.findMatchingExperts(fishType);
      
      if (matchingExperts.length === 0) {
        console.error('[AutoAssignment] No experts available for assignment');
        return null;
      }

      // 2. เลือกผู้เชี่ยวชาญที่เหมาะสมที่สุด
      const selectedExpert = await this.selectBestExpert(matchingExperts);
      
      if (!selectedExpert) {
        console.error('[AutoAssignment] Failed to select expert');
        return null;
      }

      // 3. ตรวจสอบว่ามี assignment อยู่แล้วหรือไม่
      const { data: existingAssignment } = await supabaseAdmin
        .from('assignments')
        .select('id')
        .eq('submission_id', submissionId)
        .eq('evaluator_id', selectedExpert.id)
        .single();

      if (existingAssignment) {
        console.log('[AutoAssignment] Assignment already exists');
        return existingAssignment;
      }

      // 4. สร้าง assignment ใหม่
      const { data: newAssignment, error } = await supabaseAdmin
        .from('assignments')
        .insert({
          submission_id: submissionId,
          evaluator_id: selectedExpert.id,
          status: 'pending',
          assigned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[AutoAssignment] Error creating assignment:', error);
        return null;
      }

      // 5. ส่งการแจ้งเตือนให้ผู้เชี่ยวชาญ (รูปแบบพื้นฐาน)
      try {
        const displayName = getFishTypeDisplayName(fishType);
        await NotificationService.createNotification(
          selectedExpert.id,
          `🔔 มีงานประเมินใหม่: คุณได้รับมอบหมายให้ประเมิน${displayName}`,
          '/expert/queue'
        );
        console.log(`[AutoAssignment] Notification sent to expert: ${selectedExpert.email} (${displayName})`);
      } catch (notifyError) {
        console.warn('[AutoAssignment] Failed to send notification:', notifyError);
        // ไม่ให้ error การแจ้งเตือนทำให้การมอบหมายงานล้มเหลว
      }

      console.log(`[AutoAssignment] Assignment created successfully: ${newAssignment.id}`);
      return newAssignment;

    } catch (error) {
      console.error('[AutoAssignment] Error in createAutoAssignment:', error);
      return null;
    }
  }

  /**
   * มอบหมายงานให้ผู้เชี่ยวชาญสำหรับ submissions ที่ approved แล้วแต่ยังไม่มี assignment
   * @returns {Promise<number>} จำนวน assignments ที่สร้าง
   */
  async processUnassignedSubmissions() {
    try {
      console.log('[AutoAssignment] Processing unassigned submissions...');

      // หา submissions ที่ pending หรือ approved แล้วแต่ยังไม่มี assignment
      const { data: unassignedSubmissions, error } = await supabaseAdmin
        .from('submissions')
        .select('id, fish_type, fish_name, status')
        .in('status', ['pending', 'approved'])
        .is('contest_id', null); // เฉพาะการประเมินคุณภาพ ไม่ใช่การประกวด

      if (error) {
        console.error('[AutoAssignment] Error fetching submissions:', error);
        return 0;
      }

      if (!unassignedSubmissions || unassignedSubmissions.length === 0) {
        console.log('[AutoAssignment] No unassigned submissions found');
        return 0;
      }

      // กรองเฉพาะที่ยังไม่มี assignment
      const submissionsToProcess = [];
      for (const submission of unassignedSubmissions) {
        const { count } = await supabaseAdmin
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('submission_id', submission.id);

        if (count === 0) {
          submissionsToProcess.push(submission);
        }
      }

      console.log(`[AutoAssignment] Found ${submissionsToProcess.length} submissions to process`);

      // สร้าง assignments
      let createdCount = 0;
      for (const submission of submissionsToProcess) {
        const assignment = await this.createAutoAssignment(submission.id, submission.fish_type);
        if (assignment) {
          createdCount++;
        }
        
        // หน่วงเวลาเล็กน้อยเพื่อไม่ให้ระบบรัน
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`[AutoAssignment] Created ${createdCount} assignments`);
      return createdCount;

    } catch (error) {
      console.error('[AutoAssignment] Error in processUnassignedSubmissions:', error);
      return 0;
    }
  }
}

module.exports = new AutoAssignmentService();
