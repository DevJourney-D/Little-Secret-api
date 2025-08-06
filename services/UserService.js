// User Service - จัดการข้อมูลผู้ใช้งาน
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

class UserService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    // ============================================
    // CORE USER OPERATIONS - การจัดการผู้ใช้พื้นฐาน
    // ============================================

    // สร้างผู้ใช้ใหม่
    async createUser(userData) {
        try {
            console.log('Creating user with data:', userData);
            
            // ตรวจสอบ required fields
            if (!userData.email || !userData.username || !userData.password) {
                throw new Error('Email, username และ password เป็นข้อมูลที่จำเป็น');
            }
            
            // Hash password ก่อนบันทึก
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            const { data, error } = await this.supabase
                .from('users')
                .insert([{
                    email: userData.email,
                    username: userData.username,
                    password: hashedPassword,
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
                    language: userData.language || 'th',
                    status: 'active',
                    email_verified: false,
                    is_online: false,
                    theme_preference: 'default',
                    notification_settings: {
                        chat: true,
                        push: true,
                        diary: true,
                        email: true
                    },
                    privacy_settings: {
                        diary_default: "shared",
                        last_seen_visible: true,
                        profile_visibility: "partner"
                    }
                }])
                .select()
                .single();

            if (error) throw error;

            // สร้าง user preferences อัตโนมัติ
            await this.createUserPreferences(data.id);

            return { success: true, data: this._removePassword(data) };
        } catch (error) {
            console.error('createUser error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงข้อมูลผู้ใช้ตาม ID (แบบพื้นฐาน)
    async getUserById(userId) {
        try {
            const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (userError) throw userError;
            
            // ดึงข้อมูล partner (ถ้ามี)
            let partnerData = null;
            if (userData.partner_id) {
                const { data: partner } = await this.supabase
                    .from('users')
                    .select('id, first_name, last_name, display_name, avatar_url, is_online, last_seen')
                    .eq('id', userData.partner_id)
                    .single();
                
                partnerData = partner;
            }
            
            // ดึงข้อมูล preferences
            const { data: preferences } = await this.supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            const result = {
                ...this._removePassword(userData),
                partner: partnerData,
                user_preferences: preferences
            };

            return { success: true, data: result };
        } catch (error) {
            console.error('getUserById error:', error);
            return { success: false, error: error.message };
        }
    }

    // อัปเดตข้อมูลผู้ใช้ (แบบพื้นฐาน)
    async updateUser(userId, userData) {
        try {
            const updateData = { ...userData };
            // ลบข้อมูลที่ไม่ควรแก้ไข
            delete updateData.id;
            delete updateData.created_at;
            delete updateData.password;

            const { data, error } = await this.supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data: this._removePassword(data) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ลบผู้ใช้ (Soft delete)
    async deleteUser(userId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .update({ 
                    status: 'inactive',
                    deleted_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data: this._removePassword(data) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // USER LOOKUP METHODS - การค้นหาผู้ใช้
    // ============================================

    // ดึงข้อมูลผู้ใช้ตาม email
    async getUserByEmail(email) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;
            return { success: true, data: this._removePassword(data) };
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
            return { success: true, data: this._removePassword(data) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ค้นหาผู้ใช้แบบง่าย
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

    // ============================================
    // ADVANCED USER OPERATIONS - การจัดการผู้ใช้ขั้นสูง
    // ============================================

    // ดึงรายชื่อผู้ใช้แบบมี pagination และ filter
    async listUsers(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                status = null,
                isOnline = null,
                hasPartner = null,
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = options;

            let query = this.supabase
                .from('users')
                .select(`
                    id, email, username, first_name, last_name, display_name, nickname, gender,
                    avatar_url, status, is_online, partner_id, last_seen, created_at, updated_at,
                    theme_preference
                `, { count: 'exact' });

            // ใช้ helper function สำหรับ filter
            query = this._buildUserQuery(query, { search, status, isOnline, hasPartner, sortBy, sortOrder });

            // Pagination
            const offset = (page - 1) * limit;
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;
            if (error) throw error;

            return {
                success: true,
                data: {
                    users: this._removePasswordFromUsers(data),
                    pagination: this._buildPagination(page, limit, count)
                }
            };
        } catch (error) {
            console.error('listUsers error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงข้อมูลผู้ใช้แบบละเอียด พร้อมสถิติ
    async getUserInfo(userId) {
        try {
            // ดึงข้อมูลผู้ใช้พร้อมข้อมูลที่เกี่ยวข้อง
            const { data: user, error: userError } = await this.supabase
                .from('users')
                .select(`
                    *,
                    user_preferences(*),
                    relationships!relationships_user1_id_fkey(
                        id, status, created_at,
                        user2:user2_id(id, username, display_name, avatar_url, is_online, last_seen)
                    )
                `)
                .eq('id', userId)
                .single();

            if (userError) throw userError;

            // ดึงข้อมูลสถิติ
            const [diaryCount, chatCount, todoCount, activityLogs] = await Promise.all([
                this.supabase.from('diary_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
                this.supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId),
                this.supabase.from('todos').select('id', { count: 'exact', head: true }).eq('user_id', userId),
                this.supabase.from('user_activity_logs')
                    .select('action, created_at, details')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(10)
            ]);

            const userInfo = {
                ...this._removePassword(user),
                stats: {
                    diary_count: diaryCount.count || 0,
                    chat_count: chatCount.count || 0,
                    todo_count: todoCount.count || 0
                },
                recent_activities: activityLogs.data || []
            };

            return { success: true, data: userInfo };
        } catch (error) {
            console.error('getUserInfo error:', error);
            return { success: false, error: error.message };
        }
    }

    // อัปเดตข้อมูลผู้ใช้แบบครบถ้วน
    async updateUserInfo(userId, updateData, req = null) {
        try {
            const { user_preferences, ...userData } = updateData;
            
            // ลบข้อมูลที่ไม่ควรแก้ไข
            delete userData.id;
            delete userData.created_at;
            delete userData.password;

            // อัปเดตข้อมูลผู้ใช้หลัก
            const { data: updatedUser, error: userError } = await this.supabase
                .from('users')
                .update({ ...userData, updated_at: new Date().toISOString() })
                .eq('id', userId)
                .select()
                .single();

            if (userError) throw userError;

            // อัปเดต user preferences ถ้ามี
            if (user_preferences) {
                await this.updateUserPreferences(userId, user_preferences);
            }

            // บันทึก activity log
            await this.logActivity(userId, 'update_profile', 'user', userId, {
                fields_updated: Object.keys(userData)
            }, req);

            return { success: true, data: this._removePassword(updatedUser) };
        } catch (error) {
            console.error('updateUserInfo error:', error);
            return { success: false, error: error.message };
        }
    }

    // สร้างผู้ใช้แบบครบถ้วน
    async createUserComplete(userData, req = null) {
        try {
            // สร้างผู้ใช้ด้วย method เดิม
            const createResult = await this.createUser(userData);
            if (!createResult.success) return createResult;

            const newUser = createResult.data;

            // สร้างข้อมูลเพิ่มเติม
            if (userData.user_preferences) {
                await this.updateUserPreferences(newUser.id, userData.user_preferences);
            }

            // บันทึก activity log
            await this.logActivity(newUser.id, 'user_registered', 'user', newUser.id, {
                registration_method: userData.registration_method || 'manual',
                ip_address: req?.ip
            }, req);

            // ดึงข้อมูลผู้ใช้ครบถ้วน
            const userInfoResult = await this.getUserInfo(newUser.id);
            
            return {
                success: true,
                data: {
                    user: userInfoResult.success ? userInfoResult.data : newUser,
                    message: 'สร้างบัญชีผู้ใช้เรียบร้อยแล้ว'
                }
            };
        } catch (error) {
            console.error('createUserComplete error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // AUTHENTICATION & SESSION MANAGEMENT - การจัดการเข้าสู่ระบบ
    // ============================================

    // เข้าสู่ระบบ
    async loginUser(username, password) {
        try {
            console.log('Login attempt for:', username);
            
            // ค้นหาผู้ใช้ด้วย username
            const { data: user, error: userError } = await this.supabase
                .from('users')
                .select(`
                    *,
                    partner:partner_id(id, first_name, last_name, display_name, avatar_url, is_online, last_seen),
                    user_preferences(*)
                `)
                .eq('username', username)
                .single();

            if (userError || !user) {
                return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
            }

            // ตรวจสอบรหัสผ่าน
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
            }

            // สร้าง JWT Token
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                { userId: user.id, username: user.username, email: user.email },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );

            // อัพเดทสถานะออนไลน์
            await this.setOnlineStatus(user.id, true);

            return { 
                success: true, 
                data: { 
                    user: this._removePassword(user),
                    token,
                    login_time: new Date().toISOString()
                } 
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // ตั้งสถานะออนไลน์
    async setOnlineStatus(userId, isOnline) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .update({ 
                    is_online: isOnline,
                    last_seen: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // USER PREFERENCES MANAGEMENT - การจัดการค่าปรับแต่งผู้ใช้
    // ============================================

    // สร้าง User Preferences
    async createUserPreferences(userId) {
        try {
            const { data, error } = await this.supabase
                .from('user_preferences')
                .insert([{
                    user_id: userId,
                    notification_sound: 'default',
                    auto_save: true,
                    dark_mode: false,
                    font_size: 14,
                    language_preference: 'th',
                    time_format: '24h',
                    date_format: 'DD/MM/YYYY',
                    timezone: 'Asia/Bangkok',
                    privacy_diary_default: 'shared',
                    privacy_location_sharing: true,
                    privacy_last_seen: true
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

    // ============================================
    // PARTNER CONNECTION METHODS - การเชื่อมต่อคู่รัก
    // ============================================

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
                this.supabase.from('users').update({ partner_id: partner.id }).eq('id', userId),
                this.supabase.from('users').update({ partner_id: userId }).eq('id', partner.id)
            ]);

            // ตรวจสอบ errors
            if (updates[0].error || updates[1].error) {
                throw new Error('ไม่สามารถเชื่อมต่อกับคู่รักได้');
            }

            // สร้าง relationship record
            await this.supabase
                .from('relationships')
                .insert([{
                    user1_id: userId,
                    user2_id: partner.id,
                    status: 'active'
                }]);

            return { success: true, data: partner };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // ACTIVITY LOGGING & STATS - การบันทึกกิจกรรมและสถิติ
    // ============================================

    // บันทึก Activity Log
    async logActivity(userId, action, targetType = null, targetId = null, details = {}, req = null) {
        try {
            const logData = {
                user_id: userId,
                action: action,
                target_type: targetType,
                target_id: targetId,
                details: details
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

    // ดึง Activity Logs ของผู้ใช้
    async getActivityLogs(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 50,
                action = null,
                startDate = null,
                endDate = null
            } = options;

            let query = this.supabase
                .from('user_activity_logs')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);

            // กรองตาม action
            if (action) {
                query = query.eq('action', action);
            }

            // กรองตามวันที่
            if (startDate) {
                query = query.gte('created_at', startDate);
            }
            if (endDate) {
                query = query.lte('created_at', endDate);
            }

            // เรียงลำดับและ pagination
            const offset = (page - 1) * limit;
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: {
                    logs: data,
                    pagination: this._buildPagination(page, limit, count)
                }
            };
        } catch (error) {
            console.error('getActivityLogs error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // LEGACY SUPPORT - รองรับโค้ดเดิม (Deprecated)
    // ============================================

    // ดึงข้อมูลผู้ใช้ทั้งหมด (เก่า - ใช้ listUsers แทน)
    async getAllUsers(filters = {}) {
        console.warn('getAllUsers is deprecated, use listUsers instead');
        
        // แปลง filters เก่าเป็นรูปแบบใหม่
        const options = {
            page: 1,
            limit: filters.limit || 50,
            search: filters.search,
            status: filters.status,
            isOnline: filters.is_online,
            sortBy: filters.orderBy || 'created_at',
            sortOrder: filters.orderDirection || 'desc'
        };

        if (filters.offset) {
            options.page = Math.floor(filters.offset / options.limit) + 1;
        }

        const result = await this.listUsers(options);
        
        // ส่งผลลัพธ์ในรูปแบบเก่า
        if (result.success) {
            return { success: true, data: result.data.users };
        }
        return result;
    }

    // นับจำนวนผู้ใช้ทั้งหมด (เก่า)
    async getUserCount(filters = {}) {
        try {
            let query = this.supabase
                .from('users')
                .select('id', { count: 'exact', head: true });

            query = this._buildUserQuery(query, filters);

            const { count, error } = await query;
            if (error) throw error;

            return { success: true, data: { count } };
        } catch (error) {
            console.error('getUserCount error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // HELPER METHODS - ฟังก์ชันช่วยเหลือ
    // ============================================

    // ลบรหัสผ่านออกจาก user object
    _removePassword(user) {
        if (!user) return user;
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // ลบรหัสผ่านออกจาก array ของ users
    _removePasswordFromUsers(users) {
        if (!Array.isArray(users)) return users;
        return users.map(user => this._removePassword(user));
    }

    // สร้าง query สำหรับการกรองข้อมูลผู้ใช้
    _buildUserQuery(baseQuery, filters = {}) {
        let query = baseQuery;

        // กรองตามสถานะ
        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        // กรองตามสถานะออนไลน์
        if (filters.isOnline !== undefined || filters.is_online !== undefined) {
            const isOnline = filters.isOnline !== undefined ? filters.isOnline : filters.is_online;
            query = query.eq('is_online', isOnline);
        }

        // กรองตามการมีคู่รัก
        if (filters.hasPartner !== undefined) {
            if (filters.hasPartner) {
                query = query.not('partner_id', 'is', null);
            } else {
                query = query.is('partner_id', null);
            }
        }

        // ค้นหาตามคำค้นหา
        if (filters.search) {
            query = query.or(`username.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
        }

        // เรียงลำดับ
        const sortBy = filters.sortBy || filters.orderBy || 'created_at';
        const sortOrder = filters.sortOrder || filters.orderDirection || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        return query;
    }

    // สร้าง pagination
    _buildPagination(page = 1, limit = 20, total = 0) {
        return {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: (page * limit) < total
        };
    }

    // บันทึก Activity Log
    async logActivity(userId, action, targetType = null, targetId = null, details = {}, req = null) {
        try {
            const logData = {
                user_id: userId,
                action: action,
                target_type: targetType,
                target_id: targetId,
                details: details
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

    // ============================================
    // ลบฟังก์ชันที่ซ้ำ - ย้ายไปส่วนบน
    // ============================================    // ดึงข้อมูลผู้ใช้แบบละเอียด (User Info)
    async getUserInfo(userId) {
        try {
            // ดึงข้อมูลผู้ใช้พร้อมข้อมูลที่เกี่ยวข้อง
            const { data: user, error: userError } = await this.supabase
                .from('users')
                .select(`
                    *,
                    user_preferences(*),
                    relationships!relationships_user1_id_fkey(
                        id,
                        status,
                        created_at,
                        user2:user2_id(id, username, display_name, avatar_url, is_online, last_seen)
                    )
                `)
                .eq('id', userId)
                .single();

            if (userError) throw userError;

            // ดึงข้อมูลสถิติเพิ่มเติม
            const [diaryCount, chatCount, todoCount, activityLogs] = await Promise.all([
                // นับจำนวน diary entries
                this.supabase
                    .from('diary_entries')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId),
                
                // นับจำนวนข้อความ chat
                this.supabase
                    .from('chat_messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('sender_id', userId),
                
                // นับจำนวน todos
                this.supabase
                    .from('todos')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId),
                
                // ดึง activity logs ล่าสุด
                this.supabase
                    .from('user_activity_logs')
                    .select('action, created_at, details')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(10)
            ]);

            // รวมข้อมูลทั้งหมด
            const { password, ...userWithoutPassword } = user;
            
            const userInfo = {
                ...userWithoutPassword,
                stats: {
                    diary_count: diaryCount.count || 0,
                    chat_count: chatCount.count || 0,
                    todo_count: todoCount.count || 0
                },
                recent_activities: activityLogs.data || []
            };

            return { success: true, data: userInfo };
        } catch (error) {
            console.error('getUserInfo error:', error);
            return { success: false, error: error.message };
        }
    }

    // อัปเดตข้อมูลผู้ใช้แบบครบถ้วน
    async updateUserInfo(userId, updateData, req = null) {
        try {
            // แยกข้อมูลที่จะอัปเดต
            const { user_preferences, ...userData } = updateData;
            
            // ลบข้อมูลที่ไม่ควรแก้ไข
            delete userData.id;
            delete userData.created_at;
            delete userData.password; // ป้องกันการแก้ไข password ผ่าน function นี้

            // อัปเดตข้อมูลผู้ใช้หลัก
            const { data: updatedUser, error: userError } = await this.supabase
                .from('users')
                .update({
                    ...userData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (userError) throw userError;

            // อัปเดต user preferences ถ้ามี
            if (user_preferences) {
                await this.updateUserPreferences(userId, user_preferences);
            }

            // บันทึก activity log
            await this.logActivity(userId, 'update_profile', 'user', userId, {
                fields_updated: Object.keys(userData)
            }, req);

            // ลบรหัสผ่านออกจาก response
            const { password, ...userWithoutPassword } = updatedUser;

            return { success: true, data: userWithoutPassword };
        } catch (error) {
            console.error('updateUserInfo error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // USER DELETION METHODS - การลบผู้ใช้
    // ============================================

    // ลบผู้ใช้แบบ Soft Delete (แนะนำ)
    async deleteUserSoft(userId, reason = 'user_request', req = null) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .update({
                    status: 'deleted',
                    deleted_at: new Date().toISOString(),
                    deletion_reason: reason,
                    is_online: false
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            // บันทึก activity log
            await this.logActivity(userId, 'delete_user_soft', 'user', userId, {
                reason: reason,
                deleted_by: req?.user?.id || userId
            }, req);

            return { success: true, data: { message: 'ปิดใช้งานบัญชีเรียบร้อยแล้ว' } };
        } catch (error) {
            console.error('deleteUserSoft error:', error);
            return { success: false, error: error.message };
        }
    }

    // ลบผู้ใช้แบบถาวร (Hard Delete) - ใช้ระวัง!
    async deleteUserPermanently(userId, req = null) {
        try {
            // ลบข้อมูลที่เกี่ยวข้องก่อน
            await Promise.all([
                this.supabase.from('user_preferences').delete().eq('user_id', userId),
                this.supabase.from('user_activity_logs').delete().eq('user_id', userId),
                this.supabase.from('users').update({ partner_id: null }).eq('partner_id', userId),
                this.supabase.from('relationships').delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            ]);

            // ลบผู้ใช้
            const { data, error } = await this.supabase
                .from('users')
                .delete()
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data: { message: 'ลบผู้ใช้เรียบร้อยแล้ว' } };
        } catch (error) {
            console.error('deleteUserPermanently error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // AVAILABILITY CHECK METHODS - การตรวจสอบความพร้อมใช้งาน
    // ============================================

    // ตรวจสอบความพร้อมใช้งานของ email
    async checkEmailAvailability(email) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (error && error.code === 'PGRST116') {
                return { success: true, data: { available: true } };
            } else if (error) {
                throw error;
            }

            return { success: true, data: { available: false } };
        } catch (error) {
            console.error('checkEmailAvailability error:', error);
            return { success: false, error: error.message };
        }
    }

    // ตรวจสอบความพร้อมใช้งานของ username
    async checkUsernameAvailability(username) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('id')
                .eq('username', username)
                .single();

            if (error && error.code === 'PGRST116') {
                return { success: true, data: { available: true } };
            } else if (error) {
                throw error;
            }

            return { success: true, data: { available: false } };
        } catch (error) {
            console.error('checkUsernameAvailability error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึง Activity Logs ของผู้ใช้
    async getActivityLogs(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 50,
                action = null,
                startDate = null,
                endDate = null
            } = options;

            let query = this.supabase
                .from('user_activity_logs')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);

            // กรองตาม action
            if (action) {
                query = query.eq('action', action);
            }

            // กรองตามวันที่
            if (startDate) {
                query = query.gte('created_at', startDate);
            }
            if (endDate) {
                query = query.lte('created_at', endDate);
            }

            // เรียงลำดับและ pagination
            const offset = (page - 1) * limit;
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: {
                    logs: data,
                    pagination: {
                        page,
                        limit,
                        total: count,
                        totalPages: Math.ceil(count / limit)
                    }
                }
            };
        } catch (error) {
            console.error('getActivityLogs error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = UserService;
