// Diary Service - จัดการไดอารี่
const { createClient } = require('@supabase/supabase-js');

class DiaryService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    // ============================================
    // HELPER METHODS - ฟังก์ชันช่วยเหลือ
    // ============================================

    // สร้าง pagination object
    _buildPagination(page = 1, limit = 10, total = 0) {
        return {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: (page * limit) < total
        };
    }

    // ตรวจสอบสิทธิ์การเข้าถึงไดอารี่
    async _checkDiaryAccess(diaryId, userId) {
        try {
            const { data: diary } = await this.supabase
                .from('diary_entries')
                .select('user_id, visibility')
                .eq('id', diaryId)
                .single();

            if (!diary) {
                throw new Error('ไม่พบไดอารี่');
            }

            // ถ้าเป็นเจ้าของ มีสิทธิ์เต็ม
            if (diary.user_id === userId) {
                return { hasAccess: true, isOwner: true, diary };
            }

            // ถ้าไม่ใช่เจ้าของ ตรวจสอบว่าเป็นคู่รักและไดอารี่เป็น shared หรือไม่
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            const isPartner = diary.user_id === user?.partner_id;
            const isShared = diary.visibility === 'shared';
            
            if (isPartner && isShared) {
                return { hasAccess: true, isOwner: false, diary };
            }

            return { hasAccess: false, isOwner: false, diary };
        } catch (error) {
            throw error;
        }
    }

    // สร้าง query สำหรับกรองไดอารี่
    _buildDiaryQuery(baseQuery, filters = {}) {
        let query = baseQuery;

        // กรองตามหมวดหมู่
        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        // กรองตามอารมณ์
        if (filters.mood) {
            query = query.eq('mood', filters.mood);
        }

        // กรองตามความเป็นส่วนตัว
        if (filters.visibility) {
            query = query.eq('visibility', filters.visibility);
        }

        // กรองตามวันที่
        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
        }

        // กรองตาม tags
        if (filters.tags && filters.tags.length > 0) {
            query = query.overlaps('tags', filters.tags);
        }

        // ค้นหาในเนื้อหา
        if (filters.search) {
            query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
        }

        // เรียงลำดับ
        const sortBy = filters.sortBy || 'created_at';
        const sortOrder = filters.sortOrder || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        return query;
    }

    // ============================================
    // CORE DIARY OPERATIONS - การจัดการไดอารี่พื้นฐาน
    // ============================================

    // สร้างไดอารี่ใหม่
    async createDiary(diaryData) {
        try {
            const { data, error } = await this.supabase
                .from('diary_entries')
                .insert([{
                    user_id: diaryData.user_id,
                    title: diaryData.title,
                    content: diaryData.content,
                    mood: diaryData.mood,
                    category: diaryData.category || 'daily',
                    visibility: diaryData.visibility || 'shared',
                    image_url: diaryData.image_url,
                    tags: diaryData.tags || [],
                    location: diaryData.location,
                    weather: diaryData.weather,
                    reactions: {}
                }])
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('createDiary error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงไดอารี่ตาม ID
    async getDiaryById(diaryId, userId) {
        try {
            const accessCheck = await this._checkDiaryAccess(diaryId, userId);
            
            if (!accessCheck.hasAccess) {
                throw new Error('ไม่มีสิทธิ์เข้าถึงไดอารี่นี้');
            }

            const { data, error } = await this.supabase
                .from('diary_entries')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('id', diaryId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('getDiaryById error:', error);
            return { success: false, error: error.message };
        }
    }

    // อัปเดตไดอารี่
    async updateDiary(diaryId, userId, updateData) {
        try {
            const accessCheck = await this._checkDiaryAccess(diaryId, userId);
            
            if (!accessCheck.isOwner) {
                throw new Error('ไม่มีสิทธิ์แก้ไขไดอารี่นี้');
            }

            // ลบข้อมูลที่ไม่ควรแก้ไข
            const cleanData = { ...updateData };
            delete cleanData.id;
            delete cleanData.user_id;
            delete cleanData.created_at;

            const { data, error } = await this.supabase
                .from('diary_entries')
                .update({
                    ...cleanData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', diaryId)
                .eq('user_id', userId)
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('updateDiary error:', error);
            return { success: false, error: error.message };
        }
    }

    // ลบไดอารี่
    async deleteDiary(diaryId, userId) {
        try {
            const accessCheck = await this._checkDiaryAccess(diaryId, userId);
            
            if (!accessCheck.isOwner) {
                throw new Error('ไม่มีสิทธิ์ลบไดอารี่นี้');
            }

            const { error } = await this.supabase
                .from('diary_entries')
                .delete()
                .eq('id', diaryId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true, data: { message: 'ลบไดอารี่เรียบร้อยแล้ว' } };
        } catch (error) {
            console.error('deleteDiary error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // DIARY LISTING & FILTERING - การดึงรายการไดอารี่
    // ============================================

    // ดึงไดอารี่ทั้งหมดของผู้ใช้
    async getUserDiaries(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                category = null,
                mood = null,
                visibility = null,
                search = '',
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = options;

            const offset = (page - 1) * limit;

            let query = this.supabase
                .from('diary_entries')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `, { count: 'exact' })
                .eq('user_id', userId);

            // ใช้ helper function สำหรับ filter
            query = this._buildDiaryQuery(query, { category, mood, visibility, search, sortBy, sortOrder });
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;
            if (error) throw error;

            return { 
                success: true, 
                data: {
                    diaries: data,
                    pagination: this._buildPagination(page, limit, count)
                }
            };
        } catch (error) {
            console.error('getUserDiaries error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงไดอารี่ที่แชร์กับคู่รัก
    async getSharedDiaries(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = options;

            const offset = (page - 1) * limit;

            // หา partner_id ก่อน
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            if (!user?.partner_id) {
                return { 
                    success: true, 
                    data: {
                        diaries: [],
                        pagination: this._buildPagination(page, limit, 0)
                    }
                };
            }

            let query = this.supabase
                .from('diary_entries')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `, { count: 'exact' })
                .in('user_id', [userId, user.partner_id])
                .eq('visibility', 'shared');

            // ใช้ helper function สำหรับ filter
            query = this._buildDiaryQuery(query, { search, sortBy, sortOrder });
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;
            if (error) throw error;

            return { 
                success: true, 
                data: {
                    diaries: data,
                    pagination: this._buildPagination(page, limit, count)
                }
            };
        } catch (error) {
            console.error('getSharedDiaries error:', error);
            return { success: false, error: error.message };
        }
    }

    // ค้นหาไดอารี่
    async searchDiaries(userId, searchTerm, filters = {}) {
        try {
            let query = this.supabase
                .from('diary_entries')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `);

            // หา partner_id สำหรับการค้นหาในไดอารี่ที่แชร์
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            // สิทธิ์การเข้าถึง: เจ้าของ หรือ คู่รักที่ดูไดอารี่ shared
            const partnerCondition = user?.partner_id ? 
                `and(user_id.eq.${user.partner_id},visibility.eq.shared)` : 
                'user_id.eq.null';
            
            query = query.or(`user_id.eq.${userId},${partnerCondition}`);

            // ใช้ helper function สำหรับ filter
            query = this._buildDiaryQuery(query, { ...filters, search: searchTerm });
            query = query.limit(50);

            const { data, error } = await query;
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('searchDiaries error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงไดอารี่ตามหมวดหมู่
    async getDiariesByCategory(userId, category, options = {}) {
        return this.getUserDiaries(userId, { ...options, category });
    }

    // ดึงไดอารี่ตามอารมณ์
    async getDiariesByMood(userId, mood, options = {}) {
        return this.getUserDiaries(userId, { ...options, mood });
    }

    // ดึงไดอารี่ล่าสุด
    async getRecentDiaries(userId, limit = 5) {
        try {
            // หา partner_id
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            const userIds = user?.partner_id ? [userId, user.partner_id] : [userId];

            const { data, error } = await this.supabase
                .from('diary_entries')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .in('user_id', userIds)
                .eq('visibility', 'shared')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('getRecentDiaries error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // DIARY INTERACTIONS - การโต้ตอบกับไดอารี่
    // ============================================

    // เพิ่มรีแอคชั่นในไดอารี่
    async addReaction(diaryId, userId, reaction) {
        try {
            const accessCheck = await this._checkDiaryAccess(diaryId, userId);
            
            if (!accessCheck.hasAccess) {
                throw new Error('ไม่มีสิทธิ์ให้รีแอคชั่นไดอารี่นี้');
            }

            // ดึงรีแอคชั่นปัจจุบัน
            const { data: diary } = await this.supabase
                .from('diary_entries')
                .select('reactions')
                .eq('id', diaryId)
                .single();

            // อัปเดตรีแอคชั่น
            const reactions = diary.reactions || {};
            reactions[userId] = reaction;

            const { data, error } = await this.supabase
                .from('diary_entries')
                .update({ reactions })
                .eq('id', diaryId)
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('addReaction error:', error);
            return { success: false, error: error.message };
        }
    }

    // ลบรีแอคชั่น
    async removeReaction(diaryId, userId) {
        try {
            const accessCheck = await this._checkDiaryAccess(diaryId, userId);
            
            if (!accessCheck.hasAccess) {
                throw new Error('ไม่มีสิทธิ์แก้ไขรีแอคชั่นไดอารี่นี้');
            }

            // ดึงรีแอคชั่นปัจจุบัน
            const { data: diary } = await this.supabase
                .from('diary_entries')
                .select('reactions')
                .eq('id', diaryId)
                .single();

            // ลบรีแอคชั่น
            const reactions = diary.reactions || {};
            delete reactions[userId];

            const { data, error } = await this.supabase
                .from('diary_entries')
                .update({ reactions })
                .eq('id', diaryId)
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('removeReaction error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // DIARY STATISTICS & ANALYTICS - สถิติและการวิเคราะห์
    // ============================================

    // ดึงสถิติไดอารี่
    async getDiaryStats(userId) {
        try {
            // หา partner_id
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            const stats = {};

            // สถิติของตัวเอง
            const [myDiariesResult, categoryStatsResult, moodStatsResult] = await Promise.all([
                // นับไดอารี่ของตัวเอง
                this.supabase
                    .from('diary_entries')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId),
                
                // สถิติตามหมวดหมู่
                this.supabase
                    .from('diary_entries')
                    .select('category')
                    .eq('user_id', userId),
                
                // สถิติตามอารมณ์
                this.supabase
                    .from('diary_entries')
                    .select('mood')
                    .eq('user_id', userId)
                    .not('mood', 'is', null)
            ]);

            stats.myDiaries = myDiariesResult.count || 0;

            // ประมวลผลสถิติหมวดหมู่
            const categories = {};
            categoryStatsResult.data?.forEach(entry => {
                categories[entry.category] = (categories[entry.category] || 0) + 1;
            });
            stats.categories = categories;

            // ประมวลผลสถิติอารมณ์
            const moods = {};
            moodStatsResult.data?.forEach(entry => {
                moods[entry.mood] = (moods[entry.mood] || 0) + 1;
            });
            stats.moods = moods;

            // สถิติของคู่รัก (ถ้ามี)
            if (user?.partner_id) {
                const [sharedDiariesResult, partnerDiariesResult] = await Promise.all([
                    // นับไดอารี่ที่แชร์ทั้งหมด
                    this.supabase
                        .from('diary_entries')
                        .select('*', { count: 'exact', head: true })
                        .in('user_id', [userId, user.partner_id])
                        .eq('visibility', 'shared'),
                    
                    // นับไดอารี่ของคู่รัก
                    this.supabase
                        .from('diary_entries')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user.partner_id)
                ]);

                stats.sharedDiaries = sharedDiariesResult.count || 0;
                stats.partnerDiaries = partnerDiariesResult.count || 0;
            }

            // สถิติรายเดือน
            const { data: monthlyData } = await this.supabase
                .from('diary_entries')
                .select('created_at')
                .eq('user_id', userId)
                .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString());

            const monthlyStats = {};
            monthlyData?.forEach(entry => {
                const month = new Date(entry.created_at).toISOString().slice(0, 7);
                monthlyStats[month] = (monthlyStats[month] || 0) + 1;
            });
            stats.monthlyDiaries = monthlyStats;

            return { success: true, data: stats };
        } catch (error) {
            console.error('getDiaryStats error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // EXPORT & BACKUP - การส่งออกและสำรองข้อมูล
    // ============================================

    // ส่งออกไดอารี่
    async exportDiaries(userId, format = 'json') {
        try {
            const { data: diaries } = await this.supabase
                .from('diary_entries')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (format === 'csv') {
                // แปลงเป็น CSV format
                const csvData = diaries.map(diary => ({
                    วันที่: new Date(diary.created_at).toLocaleDateString('th-TH'),
                    หัวข้อ: diary.title || '',
                    เนื้อหา: diary.content || '',
                    อารมณ์: diary.mood || '',
                    หมวดหมู่: diary.category || '',
                    ความเป็นส่วนตัว: diary.visibility || '',
                    แท็ก: (diary.tags || []).join(', ')
                }));
                
                return { success: true, data: csvData, format: 'csv' };
            }

            return { success: true, data: diaries, format: 'json' };
        } catch (error) {
            console.error('exportDiaries error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // LEGACY SUPPORT - รองรับโค้ดเดิม  
    // ============================================
}

module.exports = DiaryService;
