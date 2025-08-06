// Pomodoro Service - จัดการ Pomodoro Timer
const { createClient } = require('@supabase/supabase-js');

class PomodoroService {
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
    _buildPagination(page = 1, limit = 20, total = 0) {
        return {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: (page * limit) < total
        };
    }

    // ตรวจสอบสิทธิ์การเข้าถึงเซสชั่น
    async _checkSessionAccess(sessionId, userId) {
        try {
            const { data: session } = await this.supabase
                .from('pomodoro_sessions')
                .select('user_id')
                .eq('id', sessionId)
                .single();

            if (!session) {
                throw new Error('ไม่พบเซสชั่น');
            }

            const hasAccess = session.user_id === userId;
            const isOwner = session.user_id === userId;

            return { hasAccess, isOwner, session };
        } catch (error) {
            throw error;
        }
    }

    // สร้าง query สำหรับกรองเซสชั่น
    _buildSessionQuery(baseQuery, filters = {}) {
        let query = baseQuery;

        // กรองตามสถานะ
        if (filters.completed !== undefined) {
            query = query.eq('completed', filters.completed);
        }

        // กรองตามประเภทเซสชั่น
        if (filters.session_type) {
            query = query.eq('session_type', filters.session_type);
        }

        // กรองตามระดับโฟกัส
        if (filters.min_focus_rating) {
            query = query.gte('focus_rating', filters.min_focus_rating);
        }
        if (filters.max_focus_rating) {
            query = query.lte('focus_rating', filters.max_focus_rating);
        }

        // กรองตามวันที่
        if (filters.dateFrom) {
            query = query.gte('started_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('started_at', filters.dateTo);
        }

        // ค้นหาในชื่องานและรายละเอียด
        if (filters.search) {
            query = query.or(`task_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
        }

        // เรียงลำดับ
        const sortBy = filters.sortBy || 'started_at';
        const sortOrder = filters.sortOrder || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        return query;
    }

    // ============================================
    // CORE POMODORO OPERATIONS - การจัดการ Pomodoro พื้นฐาน
    // ============================================

    // สร้างเซสชั่น Pomodoro ใหม่ (CREATE)
    async createPomodoroSession(sessionData) {
        try {
            const { data, error } = await this.supabase
                .from('pomodoro_sessions')
                .insert([{
                    user_id: sessionData.user_id,
                    task_name: sessionData.task_name,
                    duration_minutes: sessionData.duration_minutes || 25,
                    break_duration: sessionData.break_duration || 5,
                    session_type: sessionData.session_type || 'focus',
                    notes: sessionData.notes || sessionData.task_description,
                    focus_rating: sessionData.focus_rating || null,
                    interruptions: sessionData.interruptions || 0
                }])
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('createPomodoroSession error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงเซสชั่นตาม ID (READ)
    async getPomodoroSessionById(sessionId, userId) {
        try {
            const accessCheck = await this._checkSessionAccess(sessionId, userId);
            
            if (!accessCheck.hasAccess) {
                throw new Error('ไม่มีสิทธิ์เข้าถึงเซสชั่นนี้');
            }

            const { data, error } = await this.supabase
                .from('pomodoro_sessions')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('id', sessionId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('getPomodoroSessionById error:', error);
            return { success: false, error: error.message };
        }
    }

    // อัปเดตเซสชั่น (UPDATE)
    async updatePomodoroSession(sessionId, userId, updateData) {
        try {
            const accessCheck = await this._checkSessionAccess(sessionId, userId);
            
            if (!accessCheck.isOwner) {
                throw new Error('ไม่มีสิทธิ์แก้ไขเซสชั่นนี้');
            }

            // ลบข้อมูลที่ไม่ควรแก้ไข
            const cleanData = { ...updateData };
            delete cleanData.id;
            delete cleanData.user_id;
            delete cleanData.started_at;

            const { data, error } = await this.supabase
                .from('pomodoro_sessions')
                .update({
                    ...cleanData,
                    updated_at: new Date().toISOString()
                })
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
            console.error('updatePomodoroSession error:', error);
            return { success: false, error: error.message };
        }
    }

    // ลบเซสชั่น (DELETE)
    async deletePomodoroSession(sessionId, userId) {
        try {
            const accessCheck = await this._checkSessionAccess(sessionId, userId);
            
            if (!accessCheck.isOwner) {
                throw new Error('ไม่มีสิทธิ์ลบเซสชั่นนี้');
            }

            const { error } = await this.supabase
                .from('pomodoro_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true, data: { message: 'ลบเซสชั่นเรียบร้อยแล้ว' } };
        } catch (error) {
            console.error('deletePomodoroSession error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // LISTING & FILTERING - การแสดงรายการและกรอง
    // ============================================

    // แสดงรายการเซสชั่นของผู้ใช้ (LIST)
    async listPomodoroSessions(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                session_type = null,
                completed = null,
                min_focus_rating = null,
                max_focus_rating = null,
                search = '',
                sortBy = 'started_at',
                sortOrder = 'desc'
            } = options;

            const offset = (page - 1) * limit;

            let query = this.supabase
                .from('pomodoro_sessions')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `, { count: 'exact' })
                .eq('user_id', userId);

            // ใช้ helper function สำหรับ filter
            query = this._buildSessionQuery(query, { 
                session_type, completed, min_focus_rating, max_focus_rating, 
                search, sortBy, sortOrder 
            });
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;
            if (error) throw error;

            return {
                success: true,
                data: {
                    sessions: data,
                    pagination: this._buildPagination(page, limit, count)
                }
            };
        } catch (error) {
            console.error('listPomodoroSessions error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงข้อมูลผู้ใช้และสถิติ Pomodoro (USER INFO)
    async getUserPomodoroInfo(userId) {
        try {
            // ดึงข้อมูลผู้ใช้
            const { data: user, error: userError } = await this.supabase
                .from('users')
                .select('id, first_name, last_name, display_name, email, avatar_url, created_at')
                .eq('id', userId)
                .single();

            if (userError) throw userError;

            // ดึงสถิติ
            const statsResult = await this.getPomodoroStats(userId, 'week');
            const stats = statsResult.success ? statsResult.data : {};

            // ดึงเซสชั่นล่าสุด
            const recentResult = await this.listPomodoroSessions(userId, { limit: 5 });
            const recentSessions = recentResult.success ? recentResult.data.sessions : [];

            // ดึงเซสชั่นปัจจุบัน
            const currentResult = await this.getCurrentSession(userId);
            const currentSession = currentResult.success ? currentResult.data : null;

            // วิเคราะห์ประสิทธิภาพ
            const bestSessionsResult = await this.getBestSessions(userId, 3);
            const bestSessions = bestSessionsResult.success ? bestSessionsResult.data : [];

            return {
                success: true,
                data: {
                    user,
                    stats,
                    current_session: currentSession,
                    recent_sessions: recentSessions,
                    best_sessions: bestSessions,
                    summary: {
                        total_sessions: stats.total_sessions || 0,
                        completed_sessions: stats.completed_sessions || 0,
                        total_focus_time: stats.total_focus_time || 0,
                        average_focus_rating: stats.average_focus_rating || 0,
                        completion_rate: stats.total_sessions > 0 
                            ? ((stats.completed_sessions / stats.total_sessions) * 100).toFixed(1)
                            : 0
                    }
                }
            };
        } catch (error) {
            console.error('getUserPomodoroInfo error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // POMODORO SESSION MANAGEMENT - การจัดการเซสชั่น
    // ============================================

    // เริ่มเซสชั่น Pomodoro ใหม่ (Alias สำหรับ createPomodoroSession)
    async startSession(sessionData) {
        return await this.createPomodoroSession(sessionData);
    }

    // เสร็จสิ้นเซสชั่น (ใช้ updatePomodoroSession)
    async completeSession(sessionId, userId, sessionData = {}) {
        const updateData = {
            completed: true,
            completed_at: new Date().toISOString(),
            notes: sessionData.productivity_notes || sessionData.notes,
            focus_rating: sessionData.focus_rating
        };
        return await this.updatePomodoroSession(sessionId, userId, updateData);
    }

    // ยกเลิกเซสชั่น (ใช้ deletePomodoroSession)
    async cancelSession(sessionId, userId) {
        return await this.deletePomodoroSession(sessionId, userId);
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

    // ดึงประวัติเซสชั่น (Alias สำหรับ listPomodoroSessions)
    async getSessionHistory(userId, page = 1, limit = 20, filters = {}) {
        const result = await this.listPomodoroSessions(userId, { 
            page, limit, 
            ...filters,
            dateFrom: filters.date_from,
            dateTo: filters.date_to
        });
        
        if (result.success) {
            return {
                success: true,
                data: result.data.sessions,
                pagination: result.data.pagination
            };
        }
        
        return result;
    }

    // อัปเดตข้อมูลเซสชั่น (Alias สำหรับ updatePomodoroSession)
    async updateSession(sessionId, userId, updateData) {
        return await this.updatePomodoroSession(sessionId, userId, updateData);
    }

    // ============================================
    // ADVANCED FEATURES - ฟีเจอร์ขั้นสูง
    // ============================================

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

            return await this.updatePomodoroSession(sessionId, userId, { 
                interruptions: newInterruptions 
            });
        } catch (error) {
            console.error('addInterruption error:', error);
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
            console.error('getPomodoroStats error:', error);
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
            console.error('getProductivityTrend error:', error);
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
            console.error('getBestSessions error:', error);
            return { success: false, error: error.message };
        }
    }

    // ค้นหาเซสชั่น (ใช้ listPomodoroSessions)
    async searchSessions(userId, searchTerm, filters = {}) {
        try {
            const searchOptions = {
                ...filters,
                search: searchTerm,
                limit: filters.limit || 50
            };

            return await this.listPomodoroSessions(userId, searchOptions);
        } catch (error) {
            console.error('searchSessions error:', error);
            return { success: false, error: error.message };
        }
    }

    // ส่งออกข้อมูลเซสชั่น
    async exportPomodoroSessions(userId, format = 'json') {
        try {
            const { data: sessions } = await this.supabase
                .from('pomodoro_sessions')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name)
                `)
                .eq('user_id', userId)
                .order('started_at', { ascending: true });

            if (format === 'csv') {
                const csvData = sessions.map(session => ({
                    วันที่: new Date(session.started_at).toLocaleDateString('th-TH'),
                    เวลา: new Date(session.started_at).toLocaleTimeString('th-TH'),
                    ชื่องาน: session.task_name,
                    ประเภท: session.session_type,
                    ระยะเวลา: session.duration_minutes,
                    สถานะ: session.completed ? 'เสร็จสิ้น' : 'ยังไม่เสร็จ',
                    คะแนนโฟกัส: session.focus_rating || '-',
                    การขัดจังหวะ: session.interruptions || 0,
                    หมายเหตุ: session.notes || ''
                }));
                
                return { success: true, data: csvData, format: 'csv' };
            }

            return { success: true, data: sessions, format: 'json' };
        } catch (error) {
            console.error('exportPomodoroSessions error:', error);
            return { success: false, error: error.message };
        }
    }

    // วิเคราะห์ประสิทธิภาพรายวัน
    async getDailyProductivity(userId, date) {
        try {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            const { data: sessions } = await this.supabase
                .from('pomodoro_sessions')
                .select('*')
                .eq('user_id', userId)
                .gte('started_at', startDate.toISOString())
                .lte('started_at', endDate.toISOString())
                .order('started_at', { ascending: true });

            const productivity = {
                date: date,
                total_sessions: sessions?.length || 0,
                completed_sessions: sessions?.filter(s => s.completed).length || 0,
                total_focus_time: 0,
                total_break_time: 0,
                interruptions: 0,
                session_types: {},
                hourly_breakdown: {}
            };

            if (sessions && sessions.length > 0) {
                sessions.forEach(session => {
                    // เวลาโฟกัส
                    if (session.completed) {
                        productivity.total_focus_time += session.duration_minutes || 0;
                        productivity.total_break_time += session.break_duration || 0;
                    }

                    // การขัดจังหวะ
                    productivity.interruptions += session.interruptions || 0;

                    // ประเภทเซสชั่น
                    const type = session.session_type;
                    productivity.session_types[type] = (productivity.session_types[type] || 0) + 1;

                    // แยกตามชั่วโมง
                    const hour = new Date(session.started_at).getHours();
                    if (!productivity.hourly_breakdown[hour]) {
                        productivity.hourly_breakdown[hour] = { sessions: 0, completed: 0 };
                    }
                    productivity.hourly_breakdown[hour].sessions++;
                    if (session.completed) {
                        productivity.hourly_breakdown[hour].completed++;
                    }
                });

                // คำนวณอัตราส่วนความสำเร็จ
                productivity.completion_rate = productivity.total_sessions > 0 
                    ? (productivity.completed_sessions / productivity.total_sessions * 100).toFixed(1)
                    : 0;
            }

            return { success: true, data: productivity };
        } catch (error) {
            console.error('getDailyProductivity error:', error);
            return { success: false, error: error.message };
        }
    }

    // สร้างรายงานประสิทธิภาพรายสัปดาห์
    async getWeeklyReport(userId, weekStartDate) {
        try {
            const startDate = new Date(weekStartDate);
            const endDate = new Date(weekStartDate);
            endDate.setDate(endDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);

            const { data: sessions } = await this.supabase
                .from('pomodoro_sessions')
                .select('*')
                .eq('user_id', userId)
                .gte('started_at', startDate.toISOString())
                .lte('started_at', endDate.toISOString())
                .order('started_at', { ascending: true });

            const report = {
                week_start: weekStartDate,
                week_end: endDate.toISOString().split('T')[0],
                total_sessions: sessions?.length || 0,
                completed_sessions: sessions?.filter(s => s.completed).length || 0,
                total_focus_time: 0,
                average_focus_rating: 0,
                daily_breakdown: [],
                most_productive_day: null,
                improvement_suggestions: []
            };

            if (sessions && sessions.length > 0) {
                // สถิติรายวัน
                const dailyStats = {};
                for (let i = 0; i < 7; i++) {
                    const date = new Date(startDate);
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    dailyStats[dateStr] = { 
                        date: dateStr, 
                        sessions: 0, 
                        completed: 0, 
                        focus_time: 0,
                        focus_ratings: []
                    };
                }

                sessions.forEach(session => {
                    const date = new Date(session.started_at).toISOString().split('T')[0];
                    if (dailyStats[date]) {
                        dailyStats[date].sessions++;
                        if (session.completed) {
                            dailyStats[date].completed++;
                            dailyStats[date].focus_time += session.duration_minutes || 0;
                            report.total_focus_time += session.duration_minutes || 0;
                        }
                        if (session.focus_rating) {
                            dailyStats[date].focus_ratings.push(session.focus_rating);
                        }
                    }
                });

                // คำนวณค่าเฉลี่ยและหาวันที่มีประสิทธิภาพสูงสุด
                let mostProductiveScore = 0;
                report.daily_breakdown = Object.values(dailyStats).map(day => {
                    day.avg_focus_rating = day.focus_ratings.length > 0 
                        ? day.focus_ratings.reduce((a, b) => a + b, 0) / day.focus_ratings.length 
                        : 0;
                    
                    const productivityScore = day.completed * day.avg_focus_rating;
                    if (productivityScore > mostProductiveScore) {
                        mostProductiveScore = productivityScore;
                        report.most_productive_day = day.date;
                    }
                    
                    delete day.focus_ratings;
                    return day;
                });

                // คำนวณค่าเฉลี่ยโฟกัสรวม
                const allRatings = sessions.filter(s => s.focus_rating).map(s => s.focus_rating);
                if (allRatings.length > 0) {
                    report.average_focus_rating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
                }

                // สร้างคำแนะนำ
                report.improvement_suggestions = this._generateImprovementSuggestions(report);
            }

            return { success: true, data: report };
        } catch (error) {
            console.error('getWeeklyReport error:', error);
            return { success: false, error: error.message };
        }
    }

    // สร้างคำแนะนำในการปรับปรุง
    _generateImprovementSuggestions(report) {
        const suggestions = [];

        if (report.total_sessions < 10) {
            suggestions.push('ลองเพิ่มจำนวนเซสชั่น Pomodoro ให้มากขึ้นเพื่อเพิ่มประสิทธิภาพ');
        }

        if (report.completed_sessions / report.total_sessions < 0.7) {
            suggestions.push('ลองแบ่งงานให้เป็นชิ้นเล็กลงเพื่อให้เสร็จเซสชั่นได้ง่ายขึ้น');
        }

        if (report.average_focus_rating < 3) {
            suggestions.push('ลองหาสภาพแวดล้อมที่เงียบสงบกว่านี้เพื่อเพิ่มการโฟกัส');
        }

        const lowProductiveDays = report.daily_breakdown.filter(day => day.completed < 2).length;
        if (lowProductiveDays > 3) {
            suggestions.push('ลองกำหนดเป้าหมายรายวันที่ชัดเจนมากขึ้น');
        }

        if (suggestions.length === 0) {
            suggestions.push('คุณทำได้ดีมาก! ลองรักษาระดับนี้ไว้ต่อไป');
        }

        return suggestions;
    }
}

module.exports = PomodoroService;
