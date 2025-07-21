// D:\ProJectFinal\Lasts\betta-fish-api\src\services\authService.js (ฉบับสมบูรณ์)

const { supabase } = require('../config/supabase');

class AuthService {

    /**
     * ===================================================================
     * ▼▼▼ [ส่วนที่อัปเดต] ฟังก์ชันสำหรับสมัครสมาชิก (Sign Up) ▼▼▼
     * ===================================================================
     * @param {object} userData - ข้อมูลผู้ใช้จากฟอร์ม { email, password, firstName, lastName, username }
     */
    async signUp(userData) {
        const { email, password, firstName, lastName, username } = userData;

        // ขั้นตอนที่ 1: เราจะสร้างผู้ใช้ในระบบ Authentication ของ Supabase เพียงขั้นตอนเดียว
        // โดยแนบข้อมูลโปรไฟล์ทั้งหมด (first_name, last_name, username, role) 
        // เข้าไปใน property `options.data`
        // เพื่อให้ Database Trigger ที่ชื่อว่า `handle_new_user` เป็นผู้จัดการนำข้อมูลนี้
        // ไปสร้างแถวใหม่ในตาราง `public.profiles` ให้เราโดยอัตโนมัติ
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    username: username,
                    role: 'user' // กำหนด role เริ่มต้นสำหรับผู้ใช้ใหม่ทุกคน
                }
            }
        });

        // ขั้นตอนที่ 2: ตรวจสอบ Error ที่อาจเกิดขึ้นจากการสร้างผู้ใช้ในระบบ Auth
        if (error) {
            // ดักจับ Error ที่พบบ่อยและแปลงเป็นข้อความภาษาไทยที่เข้าใจง่าย
            if (error.message.includes('User already registered')) {
                throw new Error('มีผู้ใช้อีเมลนี้ในระบบแล้ว');
            }
            // หากเป็น Error อื่นๆ ให้ส่งข้อความจาก Supabase ไปตรงๆ
            throw new Error('Supabase Auth Error: ' + error.message);
        }

        // [สำคัญ] เราจะไม่ใช้คำสั่ง `supabase.from('profiles').insert(...)` ในฝั่ง API อีกต่อไป
        // เพราะเราเชื่อมั่นใน Trigger ของฐานข้อมูล ซึ่งเป็นวิธีที่ปลอดภัยและป้องกัน
        // ปัญหา "ผู้ใช้กำพร้า" (มี Auth แต่ไม่มี Profile) ได้ 100%

        // ตรวจสอบเผื่อกรณีสุดวิสัยที่ Supabase ไม่ได้คืนข้อมูล user กลับมา
        if (!data.user) {
            throw new Error('ไม่สามารถสร้างผู้ใช้ได้ กรุณาลองอีกครั้ง');
        }

        // คืนข้อมูล user ที่สร้างสำเร็จกลับไปให้ Controller
        return data;
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับเข้าสู่ระบบ (Sign In) - (โค้ดเดิม สมบูรณ์ดีอยู่แล้ว)
     * ===================================================================
     */
    async signIn(email, password) {
        // 1. ใช้ email และ password เพื่อขอ Token จาก Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        // 2. จัดการ Error ที่อาจเกิดขึ้น
        if (error) {
            if (error.message.includes('Invalid login credentials'))
                throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            if (error.message.includes('Email not confirmed'))
                throw new Error('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
            throw new Error(error.message);
        }

        // 3. เมื่อเข้าสู่ระบบสำเร็จ จะได้ข้อมูล user และ session กลับมา
        const { user, session } = data;

        // 4. ใช้ user.id ที่ได้มา ไปค้นหาข้อมูลทั้งหมดจากตาราง `profiles` ของเรา
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // 5. หากหาโปรไฟล์ไม่เจอ (ซึ่งไม่ควรจะเกิดขึ้นถ้า Trigger ทำงานปกติ) ให้แจ้ง Error
        if (profileError) {
             throw new Error('ไม่พบข้อมูลโปรไฟล์ของผู้ใช้: ' + profileError.message);
        }

        // 6. คืนค่าทั้ง Token และข้อมูล Profile กลับไปให้ Controller
        return { token: session.access_token, profile: profile };
    }

    /**
     * ===================================================================
     * ฟังก์ชันสำหรับออกจากระบบ (Sign Out) - (โค้ดเดิม สมบูรณ์ดีอยู่แล้ว)
     * ===================================================================
     */
    async signOut() {
        // เรียกใช้ฟังก์ชัน signOut ของ Supabase เพื่อทำลาย Session
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            throw new Error('เกิดข้อผิดพลาดในการออกจากระบบ: ' + error.message);
        }

        // คืนข้อความยืนยันกลับไป
        return { message: 'ออกจากระบบสำเร็จ' };
    }
}

module.exports = new AuthService();