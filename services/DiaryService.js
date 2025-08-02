// Diary Service - จัดการไดอารี่
const { createClient } = require('@supabase/supabase-js');

class DiaryService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

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
                    weather: diaryData.weather
                }])
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงไดอารี่ทั้งหมดของผู้ใช้
    async getUserDiaries(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const { data, error, count } = await this.supabase
                .from('diary_entries')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `, { count: 'exact' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return { 
                success: true, 
                data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงไดอารี่ที่แชร์กับคู่รัก
    async getSharedDiaries(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            // หา partner_id ก่อน
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            if (!user?.partner_id) {
                return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
            }

            const { data, error, count } = await this.supabase
                .from('diary_entries')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `, { count: 'exact' })
                .in('user_id', [userId, user.partner_id])
                .eq('visibility', 'shared')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return { 
                success: true, 
                data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงไดอารี่ตาม ID
    async getDiaryById(diaryId, userId) {
        try {
            const { data, error } = await this.supabase
                .from('diary_entries')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('id', diaryId)
                .single();

            if (error) throw error;

            // ตรวจสอบสิทธิ์การเข้าถึง
            if (data.user_id !== userId) {
                // ถ้าไม่ใช่เจ้าของ ต้องเป็นคู่รักและไดอารี่ต้องเป็น shared
                const { data: user } = await this.supabase
                    .from('users')
                    .select('partner_id')
                    .eq('id', userId)
                    .single();

                if (data.user_id !== user?.partner_id || data.visibility !== 'shared') {
                    throw new Error('ไม่มีสิทธิ์เข้าถึงไดอารี่นี้');
                }
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // อัปเดตไดอารี่
    async updateDiary(diaryId, userId, updateData) {
        try {
            // ตรวจสอบว่าเป็นเจ้าของไดอารี่หรือไม่
            const { data: existingDiary } = await this.supabase
                .from('diary_entries')
                .select('user_id')
                .eq('id', diaryId)
                .single();

            if (!existingDiary || existingDiary.user_id !== userId) {
                throw new Error('ไม่มีสิทธิ์แก้ไขไดอารี่นี้');
            }

            // ลบข้อมูลที่ไม่ควรแก้ไข
            delete updateData.id;
            delete updateData.user_id;
            delete updateData.created_at;

            const { data, error } = await this.supabase
                .from('diary_entries')
                .update(updateData)
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
            return { success: false, error: error.message };
        }
    }

    // ลบไดอารี่
    async deleteDiary(diaryId, userId) {
        try {
            // ตรวจสอบว่าเป็นเจ้าของไดอารี่หรือไม่
            const { data: existingDiary } = await this.supabase
                .from('diary_entries')
                .select('user_id')
                .eq('id', diaryId)
                .single();

            if (!existingDiary || existingDiary.user_id !== userId) {
                throw new Error('ไม่มีสิทธิ์ลบไดอารี่นี้');
            }

            const { error } = await this.supabase
                .from('diary_entries')
                .delete()
                .eq('id', diaryId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // เพิ่มรีแอคชั่นในไดอารี่
    async addReaction(diaryId, userId, reaction) {
        try {
            // ดึงไดอารี่ปัจจุบัน
            const { data: diary } = await this.supabase
                .from('diary_entries')
                .select('reactions, user_id')
                .eq('id', diaryId)
                .single();

            if (!diary) {
                throw new Error('ไม่พบไดอารี่');
            }

            // ตรวจสอบสิทธิ์ (ต้องเป็นคู่รักหรือเจ้าของ)
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            if (diary.user_id !== userId && diary.user_id !== user?.partner_id) {
                throw new Error('ไม่มีสิทธิ์ให้รีแอคชั่นไดอารี่นี้');
            }

            // อัปเดตรีแอคชั่น
            const reactions = diary.reactions || {};
            reactions[userId] = reaction;

            const { data, error } = await this.supabase
                .from('diary_entries')
                .update({ reactions })
                .eq('id', diaryId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
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
            query = query.or(`user_id.eq.${userId},and(user_id.eq.${user.partner_id || 'null'},visibility.eq.shared)`);

            // ค้นหาในเนื้อหาและหัวข้อ
            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
            }

            // กรองตามหมวดหมู่
            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            // กรองตามอารมณ์
            if (filters.mood) {
                query = query.eq('mood', filters.mood);
            }

            // กรองตามวันที่
            if (filters.date_from) {
                query = query.gte('created_at', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('created_at', filters.date_to);
            }

            // กรองตาม tags
            if (filters.tags && filters.tags.length > 0) {
                query = query.overlaps('tags', filters.tags);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

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

            // นับไดอารี่ของตัวเอง
            const { count: myDiaries } = await this.supabase
                .from('diary_entries')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            stats.myDiaries = myDiaries || 0;

            // นับไดอารี่ที่แชร์ทั้งหมด
            if (user?.partner_id) {
                const { count: sharedDiaries } = await this.supabase
                    .from('diary_entries')
                    .select('*', { count: 'exact', head: true })
                    .in('user_id', [userId, user.partner_id])
                    .eq('visibility', 'shared');

                stats.sharedDiaries = sharedDiaries || 0;

                // นับไดอารี่ของคู่รัก
                const { count: partnerDiaries } = await this.supabase
                    .from('diary_entries')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.partner_id);

                stats.partnerDiaries = partnerDiaries || 0;
            }

            // สถิติตามหมวดหมู่
            const { data: categoryStats } = await this.supabase
                .from('diary_entries')
                .select('category')
                .eq('user_id', userId);

            const categories = {};
            categoryStats?.forEach(entry => {
                categories[entry.category] = (categories[entry.category] || 0) + 1;
            });
            stats.categories = categories;

            // สถิติตามอารมณ์
            const { data: moodStats } = await this.supabase
                .from('diary_entries')
                .select('mood')
                .eq('user_id', userId)
                .not('mood', 'is', null);

            const moods = {};
            moodStats?.forEach(entry => {
                moods[entry.mood] = (moods[entry.mood] || 0) + 1;
            });
            stats.moods = moods;

            return { success: true, data: stats };
        } catch (error) {
            return { success: false, error: error.message };
        }
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
            return { success: false, error: error.message };
        }
    }
}

module.exports = DiaryService;
