// Pomodoro Service - จัดการ Pomodoro Timer
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

class PomodoroService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    // เริ่มเซสชั่น Pomodoro ใหม่
    async startSession(sessionData) {
        try {
            const { data, error } = await this.supabase
                .from('pomodoro_sessions')
                .insert([{
                    id: uuidv4(), // ใช้ UUID
                    user_id: sessionData.user_id,
                    task_name: sessionData.task_name,
                    task_description: sessionData.task_description,
                    duration_minutes: sessionData.duration_minutes || 25,
                    session_type: sessionData.session_type || 'work',
                    started_at: new Date().toISOString()
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

    // เสร็จสิ้นเซสชั่น
    async completeSession(sessionId, userId, sessionData = {}) {
        try {
            // ตรวจสอบว่าเป็นเจ้าของเซสชั่นหรือไม่
            const { data: existingSession } = await this.supabase
                .from('pomodoro_sessions')
                .select('user_id, started_at')
                .eq('id', sessionId)
                .single();

            if (!existingSession || existingSession.user_id !== userId) {
                throw new Error('ไม่มีสิทธิ์แก้ไขเซสชั่นนี้');
            }

            const updateData = {
                completed: true,
                completed_at: new Date().toISOString(),
                interruptions: sessionData.interruptions || 0,
                focus_rating: sessionData.focus_rating,
                productivity_notes: sessionData.productivity_notes
            };

            const { data, error } = await this.supabase
                .from('pomodoro_sessions')
                .update(updateData)
                .eq('id', sessionId)
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

    // ยกเลิกเซสชั่น
    async cancelSession(sessionId, userId) {
        try {
            // ตรวจสอบว่าเป็นเจ้าของเซสชั่นหรือไม่
            const { data: existingSession } = await this.supabase
                .from('pomodoro_sessions')
                .select('user_id')
                .eq('id', sessionId)
                .single();

            if (!existingSession || existingSession.user_id !== userId) {
                throw new Error('ไม่มีสิทธิ์ยกเลิกเซสชั่นนี้');
            }

            const { error } = await this.supabase
                .from('pomodoro_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงเซสชั่นปัจจุบัน (ที่ยังไม่เสร็จ)
    async getCurrentSession(userId) {
        try {
            const { data, error } = await this.supabase
                .from('pomodoro_sessions')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('user_id', userId)
                .eq('completed', false)
                .order('started_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            return { success: true, data: data[0] || null };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงประวัติเซสชั่น
    async getSessionHistory(userId, page = 1, limit = 20, filters = {}) {
        try {
            const offset = (page - 1) * limit;

            let query = this.supabase
                .from('pomodoro_sessions')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `, { count: 'exact' })
                .eq('user_id', userId);

            // กรองตามสถานะ
            if (filters.completed !== undefined) {
                query = query.eq('completed', filters.completed);
            }

            // กรองตามประเภทเซสชั่น
            if (filters.session_type) {
                query = query.eq('session_type', filters.session_type);
            }

            // กรองตามวันที่
            if (filters.date_from) {
                query = query.gte('started_at', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('started_at', filters.date_to);
            }

            const { data, error, count } = await query
                .order('started_at', { ascending: false })
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

    // อัปเดตข้อมูลเซสชั่น
    async updateSession(sessionId, userId, updateData) {
        try {
            // ตรวจสอบว่าเป็นเจ้าของเซสชั่นหรือไม่
            const { data: existingSession } = await this.supabase
                .from('pomodoro_sessions')
                .select('user_id')
                .eq('id', sessionId)
                .single();

            if (!existingSession || existingSession.user_id !== userId) {
                throw new Error('ไม่มีสิทธิ์แก้ไขเซสชั่นนี้');
            }

            // ลบข้อมูลที่ไม่ควรแก้ไข
            delete updateData.id;
            delete updateData.user_id;
            delete updateData.started_at;

            const { data, error } = await this.supabase
                .from('pomodoro_sessions')
                .update(updateData)
                .eq('id', sessionId)
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

    // เพิ่มการขัดจังหวะ
    async addInterruption(sessionId, userId) {
        try {
            // ดึงข้อมูลเซสชั่นปัจจุบัน
            const { data: session } = await this.supabase
                .from('pomodoro_sessions')
                .select('user_id, interruptions')
                .eq('id', sessionId)
                .single();

            if (!session || session.user_id !== userId) {
                throw new Error('ไม่มีสิทธิ์แก้ไขเซสชั่นนี้');
            }

            const newInterruptions = (session.interruptions || 0) + 1;

            return await this.updateSession(sessionId, userId, { 
                interruptions: newInterruptions 
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงสถิติ Pomodoro
    async getPomodoroStats(userId, period = 'week') {
        try {
            let dateFrom = new Date();
            
            switch (period) {
                case 'today':
                    dateFrom.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    dateFrom.setDate(dateFrom.getDate() - 7);
                    break;
                case 'month':
                    dateFrom.setMonth(dateFrom.getMonth() - 1);
                    break;
                case 'year':
                    dateFrom.setFullYear(dateFrom.getFullYear() - 1);
                    break;
            }

            const { data: sessions } = await this.supabase
                .from('pomodoro_sessions')
                .select('*')
                .eq('user_id', userId)
                .gte('started_at', dateFrom.toISOString());

            const stats = {
                total_sessions: sessions?.length || 0,
                completed_sessions: sessions?.filter(s => s.completed).length || 0,
                total_focus_time: 0,
                average_focus_rating: 0,
                total_interruptions: 0,
                session_types: {},
                daily_breakdown: []
            };

            if (sessions && sessions.length > 0) {
                // คำนวณเวลาโฟกัสรวม
                stats.total_focus_time = sessions
                    .filter(s => s.completed)
                    .reduce((total, s) => total + (s.duration_minutes || 0), 0);

                // คำนวณค่าเฉลี่ยการโฟกัส
                const ratedSessions = sessions.filter(s => s.focus_rating);
                if (ratedSessions.length > 0) {
                    stats.average_focus_rating = ratedSessions
                        .reduce((total, s) => total + s.focus_rating, 0) / ratedSessions.length;
                }

                // รวมการขัดจังหวะ
                stats.total_interruptions = sessions
                    .reduce((total, s) => total + (s.interruptions || 0), 0);

                // สถิติตามประเภทเซสชั่น
                sessions.forEach(session => {
                    const type = session.session_type;
                    stats.session_types[type] = (stats.session_types[type] || 0) + 1;
                });

                // สถิติรายวัน
                const dailyStats = {};
                sessions.forEach(session => {
                    const date = new Date(session.started_at).toISOString().split('T')[0];
                    if (!dailyStats[date]) {
                        dailyStats[date] = { date, sessions: 0, completed: 0, focus_time: 0 };
                    }
                    dailyStats[date].sessions++;
                    if (session.completed) {
                        dailyStats[date].completed++;
                        dailyStats[date].focus_time += session.duration_minutes || 0;
                    }
                });
                stats.daily_breakdown = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
            }

            return { success: true, data: stats };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงแนวโน้มประสิทธิภาพ
    async getProductivityTrend(userId, days = 30) {
        try {
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - days);

            const { data: sessions } = await this.supabase
                .from('pomodoro_sessions')
                .select('started_at, completed, duration_minutes, focus_rating, interruptions')
                .eq('user_id', userId)
                .eq('completed', true)
                .gte('started_at', dateFrom.toISOString())
                .order('started_at', { ascending: true });

            if (!sessions || sessions.length === 0) {
                return { success: true, data: { trend: [], summary: null } };
            }

            // จัดกลุ่มตามวัน
            const dailyStats = {};
            sessions.forEach(session => {
                const date = new Date(session.started_at).toISOString().split('T')[0];
                if (!dailyStats[date]) {
                    dailyStats[date] = {
                        date,
                        sessions: 0,
                        total_time: 0,
                        avg_focus_rating: 0,
                        total_interruptions: 0,
                        focus_ratings: []
                    };
                }
                dailyStats[date].sessions++;
                dailyStats[date].total_time += session.duration_minutes || 0;
                dailyStats[date].total_interruptions += session.interruptions || 0;
                if (session.focus_rating) {
                    dailyStats[date].focus_ratings.push(session.focus_rating);
                }
            });

            // คำนวณค่าเฉลี่ย
            const trend = Object.values(dailyStats).map(day => {
                day.avg_focus_rating = day.focus_ratings.length > 0 
                    ? day.focus_ratings.reduce((a, b) => a + b, 0) / day.focus_ratings.length 
                    : 0;
                delete day.focus_ratings;
                return day;
            });

            // สรุปแนวโน้ม
            const summary = {
                total_days: trend.length,
                avg_sessions_per_day: trend.reduce((a, b) => a + b.sessions, 0) / trend.length,
                avg_focus_time_per_day: trend.reduce((a, b) => a + b.total_time, 0) / trend.length,
                avg_focus_rating: trend.reduce((a, b) => a + b.avg_focus_rating, 0) / trend.length,
                avg_interruptions_per_day: trend.reduce((a, b) => a + b.total_interruptions, 0) / trend.length
            };

            return { success: true, data: { trend, summary } };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงเซสชั่นที่ดีที่สุด
    async getBestSessions(userId, limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('pomodoro_sessions')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('user_id', userId)
                .eq('completed', true)
                .not('focus_rating', 'is', null)
                .order('focus_rating', { ascending: false })
                .order('interruptions', { ascending: true })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ค้นหาเซสชั่น
    async searchSessions(userId, searchTerm, filters = {}) {
        try {
            let query = this.supabase
                .from('pomodoro_sessions')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('user_id', userId);

            // ค้นหาในชื่องานและรายละเอียด
            if (searchTerm) {
                query = query.or(`task_name.ilike.%${searchTerm}%,task_description.ilike.%${searchTerm}%,productivity_notes.ilike.%${searchTerm}%`);
            }

            // กรองตามประเภทเซสชั่น
            if (filters.session_type) {
                query = query.eq('session_type', filters.session_type);
            }

            // กรองตามสถานะ
            if (filters.completed !== undefined) {
                query = query.eq('completed', filters.completed);
            }

            // กรองตามระดับโฟกัส
            if (filters.min_focus_rating) {
                query = query.gte('focus_rating', filters.min_focus_rating);
            }

            const { data, error } = await query
                .order('started_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = PomodoroService;
