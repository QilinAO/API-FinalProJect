const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ตรวจสอบว่ามี environment variables หรือไม่
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('Please check your .env file for:');
    console.error('- SUPABASE_URL');
    console.error('- SUPABASE_ANON_KEY');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Client สำหรับ user operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client สำหรับ server-side operations (ถ้ามี service key)
const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// ทดสอบการเชื่อมต่อ
async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Database connection failed:', error.message);
        } else {
            console.log('✅ Database connected successfully');
        }
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
    }
}

// เรียกทดสอบเมื่อ module ถูก load
testConnection();

module.exports = {
    supabase,
    supabaseAdmin
};