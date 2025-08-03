// User Service - จัดการข้อมูลผู้ใช้งาน
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class UserService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    // สร้างผู้ใช้ใหม่
    async createUser(userData) {
        try {
            console.log('Creating user with data:', userData);
            
            // ตรวจสอบ required fields
            if (!userData.email || !userData.username || !userData.password) {
                throw new Error('Email, username และ password เป็นข้อมูลที่จำเป็น');
            }

            // สร้าง UUID สำหรับ user ID
            const userId = uuidv4();
            
            // Hash password ก่อนบันทึก
            let hashedPassword = null;
            if (userData.password) {
                const saltRounds = 10;
                hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            }

            console.log('Attempting to insert user with ID:', userId);

            const { data, error } = await this.supabase
                .from('users')
                .insert([{
                    id: userId, // ใช้ UUID
                    email: userData.email,
                    username: userData.username,
                    password: hashedPassword, // บันทึก hashed password
                    first_name: userData.first_name || userData.firstName || userData.displayName?.split(' ')[0] || userData.username,
                    last_name: userData.last_name || userData.lastName || userData.displayName?.split(' ')[1] || '',
                    display_name: userData.display_name || userData.displayName || userData.username,
                    nickname: userData.nickname,
                    gender: userData.gender,
                    phone: userData.phone,
                    birth_date: userData.birth_date || userData.birthDate,
                    bio: userData.bio,
                    avatar_url: userData.avatar_url || userData.avatarUrl,
                    timezone: userData.timezone || 'Asia/Bangkok',
                    language: userData.language || 'th'
                }])
                .select()
                .single();

            console.log('Insert result:', { data, error });

            if (error) throw error;

            // TODO: สร้าง user preferences อัตโนมัติ (ปิดไว้ก่อนเพื่อ debug)
            // await this.createUserPreferences(data.id);

            // ลบรหัสผ่านออกจาก response
            const { password: _, ...userWithoutPassword } = data;
            return { success: true, data: userWithoutPassword };
        } catch (error) {
            console.error('createUser error:', error);
            console.error('Error details:', error.message);
            console.error('Error code:', error.code);
            return { success: false, error: error.message };
        }
    }

    // ดึงข้อมูลผู้ใช้ตาม ID
    async getUserById(userId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select(`
                    *,
                    partner:partner_id(id, first_name, last_name, display_name, avatar_url, is_online, last_seen),
                    user_preferences(*),
                    user_stats(*)
                `)
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงข้อมูลผู้ใช้ตาม email
    async getUserByEmail(email) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงข้อมูลผู้ใช้ตาม username
    async getUserByUsername(username) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // เข้าสู่ระบบด้วย username และ password
    async loginUser(username, password) {
        try {
            console.log('Login attempt for:', username);
            console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
            console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
            
            // ค้นหาผู้ใช้ด้วย username (รวมข้อมูลเพิ่มเติม)
            const { data: user, error: userError } = await this.supabase
                .from('users')
                .select(`
                    *,
                    partner:partner_id(id, first_name, last_name, display_name, avatar_url, is_online, last_seen),
                    user_preferences(*)
                `)
                .eq('username', username)
                .single();

            console.log('User query result:', { user, userError });

            if (userError || !user) {
                return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', debug: { userError } };
            }

            // ตรวจสอบรหัสผ่านด้วย bcrypt
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
            }

            // สร้าง JWT Token
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    username: user.username,
                    email: user.email 
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );

            // อัพเดทสถานะออนไลน์
            await this.setOnlineStatus(user.id, true);

            // ลบรหัสผ่านออกจาก response และส่งข้อมูลผู้ใช้ครบถ้วน
            const { password: _, ...userWithoutPassword } = user;

            return { 
                success: true, 
                data: { 
                    user: userWithoutPassword,
                    token,
                    login_time: new Date().toISOString()
                } 
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message, debug: error };
        }
    }

    // อัปเดตข้อมูลผู้ใช้
    async updateUser(userId, userData) {
        try {
            const updateData = { ...userData };
            delete updateData.id; // ป้องกันการแก้ไข ID
            delete updateData.created_at; // ป้องกันการแก้ไข created_at

            const { data, error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ลบผู้ใช้ (Soft delete)
    async deleteUser(userId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .update({ status: 'inactive' })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ตั้งสถานะออนไลน์
    async setOnlineStatus(userId, isOnline) {
        try {
            const updateData = { 
                is_online: isOnline,
                last_seen: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', userId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ค้นหาผู้ใช้
    async searchUsers(searchTerm, currentUserId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('id, username, first_name, last_name, display_name, avatar_url, email')
                .or(`username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
                .neq('id', currentUserId)
                .eq('status', 'active')
                .limit(10);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // สร้าง User Preferences
    async createUserPreferences(userId) {
        try {
            const { data, error } = await this.supabase
                .from('user_preferences')
                .insert([{
                    id: uuidv4(), // ใช้ UUID สำหรับ preferences ID
                    user_id: userId,
                    notification_enabled: true,
                    daily_greeting_enabled: true,
                    theme: 'default',
                    language: 'th',
                    timezone: 'Asia/Bangkok',
                    dark_mode: false,
                    font_size: 'normal',
                    auto_save: true,
                    privacy_mode: false,
                    email_notifications: true,
                    push_notifications: true,
                    diary_auto_backup: true,
                    location_sharing: false
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // อัปเดต User Preferences
    async updateUserPreferences(userId, preferences) {
        try {
            const { data, error } = await this.supabase
                .from('user_preferences')
                .update(preferences)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // สร้าง Partner Code
    async generatePartnerCode(userId) {
        try {
            const partnerCode = Math.random().toString(36).substr(2, 8).toUpperCase();
            
            const { data, error } = await this.supabase
                .from('users')
                .update({ partner_code: partnerCode })
                .eq('id', userId)
                .select('partner_code')
                .single();

            if (error) throw error;
            return { success: true, data: { partner_code: partnerCode } };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // เชื่อมต่อกับคู่รักผ่าน Partner Code
    async connectWithPartner(userId, partnerCode) {
        try {
            // หาผู้ใช้จาก partner code
            const { data: partner, error: partnerError } = await this.supabase
                .from('users')
                .select('id, first_name, last_name, display_name')
                .eq('partner_code', partnerCode)
                .neq('id', userId)
                .single();

            if (partnerError || !partner) {
                throw new Error('รหัสคู่รักไม่ถูกต้องหรือไม่พบ');
            }

            // อัปเดต partner_id สำหรับทั้งคู่
            const updates = await Promise.all([
                this.supabase
                    .from('users')
                    .update({ partner_id: partner.id })
                    .eq('id', userId),
                this.supabase
                    .from('users')
                    .update({ partner_id: userId })
                    .eq('id', partner.id)
            ]);

            // ตรวจสอบ errors
            if (updates[0].error || updates[1].error) {
                throw new Error('ไม่สามารถเชื่อมต่อกับคู่รักได้');
            }

            // สร้าง relationship record
            await this.supabase
                .from('relationships')
                .insert([{
                    id: uuidv4(), // ใช้ UUID สำหรับ relationship ID
                    user1_id: userId,
                    user2_id: partner.id,
                    status: 'active'
                }]);

            return { success: true, data: partner };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // บันทึก Activity Log
    async logActivity(userId, activityType, activityData = {}, req = null) {
        try {
            const logData = {
                id: uuidv4(), // ใช้ UUID สำหรับ activity log ID
                user_id: userId,
                activity_type: activityType,
                activity_data: activityData
            };

            if (req) {
                logData.ip_address = req.ip || req.connection?.remoteAddress;
                logData.user_agent = req.get('User-Agent');
            }

            const { error } = await this.supabase
                .from('user_activity_logs')
                .insert([logData]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Failed to log activity:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = UserService;
