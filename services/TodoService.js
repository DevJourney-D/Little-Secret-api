// Todo Service - จัดการรายการสิ่งที่ต้องทำ
const { createClient } = require('@supabase/supabase-js');

class TodoService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    // สร้างรายการใหม่
    async createTodo(todoData) {
        try {
            const { data, error } = await this.supabase
                .from('todos')
                .insert([{
                    user_id: todoData.user_id,
                    title: todoData.title,
                    description: todoData.description,
                    status: todoData.status || 'pending',
                    priority: todoData.priority || 'normal',
                    category: todoData.category || 'personal',
                    due_date: todoData.due_date,
                    shared_with_partner: todoData.shared_with_partner || false,
                    assigned_to_partner: todoData.assigned_to_partner || false,
                    reminder_at: todoData.reminder_at,
                    tags: todoData.tags || [],
                    attachments: todoData.attachments
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

    // ดึงรายการทั้งหมดของผู้ใช้
    async getUserTodos(userId, filters = {}, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            let query = this.supabase
                .from('todos')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `, { count: 'exact' })
                .eq('user_id', userId);

            // กรองตามสถานะ
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            // กรองตามความสำคัญ
            if (filters.priority) {
                query = query.eq('priority', filters.priority);
            }

            // กรองตามหมวดหมู่
            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            // กรองตามการแชร์
            if (filters.shared_with_partner !== undefined) {
                query = query.eq('shared_with_partner', filters.shared_with_partner);
            }

            // กรองตามวันครบกำหนด
            if (filters.due_date_from) {
                query = query.gte('due_date', filters.due_date_from);
            }
            if (filters.due_date_to) {
                query = query.lte('due_date', filters.due_date_to);
            }

            // กรองตาม tags
            if (filters.tags && filters.tags.length > 0) {
                query = query.overlaps('tags', filters.tags);
            }

            const { data, error, count } = await query
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

    // ดึงรายการที่แชร์กับคู่รัก
    async getSharedTodos(userId, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            // หา partner_id
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            if (!user?.partner_id) {
                return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
            }

            const { data, error, count } = await this.supabase
                .from('todos')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `, { count: 'exact' })
                .in('user_id', [userId, user.partner_id])
                .eq('shared_with_partner', true)
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

    // ดึงรายการตาม ID
    async getTodoById(todoId, userId) {
        try {
            const { data, error } = await this.supabase
                .from('todos')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('id', todoId)
                .single();

            if (error) throw error;

            // ตรวจสอบสิทธิ์การเข้าถึง
            if (data.user_id !== userId) {
                // ถ้าไม่ใช่เจ้าของ ต้องเป็นคู่รักและเป็นรายการที่แชร์
                const { data: user } = await this.supabase
                    .from('users')
                    .select('partner_id')
                    .eq('id', userId)
                    .single();

                if (data.user_id !== user?.partner_id || !data.shared_with_partner) {
                    throw new Error('ไม่มีสิทธิ์เข้าถึงรายการนี้');
                }
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // อัปเดตรายการ
    async updateTodo(todoId, userId, updateData) {
        try {
            // ตรวจสอบว่าเป็นเจ้าของรายการหรือไม่
            const { data: existingTodo } = await this.supabase
                .from('todos')
                .select('user_id, shared_with_partner')
                .eq('id', todoId)
                .single();

            if (!existingTodo) {
                throw new Error('ไม่พบรายการนี้');
            }

            // ตรวจสอบสิทธิ์
            let hasPermission = false;
            if (existingTodo.user_id === userId) {
                hasPermission = true;
            } else if (existingTodo.shared_with_partner) {
                // ตรวจสอบว่าเป็นคู่รักหรือไม่
                const { data: user } = await this.supabase
                    .from('users')
                    .select('partner_id')
                    .eq('id', userId)
                    .single();

                if (existingTodo.user_id === user?.partner_id) {
                    hasPermission = true;
                }
            }

            if (!hasPermission) {
                throw new Error('ไม่มีสิทธิ์แก้ไขรายการนี้');
            }

            // ลบข้อมูลที่ไม่ควรแก้ไข
            delete updateData.id;
            delete updateData.user_id;
            delete updateData.created_at;

            // ถ้าสถานะเป็น completed ให้เพิ่ม completed_at
            if (updateData.status === 'completed' && updateData.completed !== false) {
                updateData.completed = true;
                updateData.completed_at = new Date().toISOString();
            } else if (updateData.status !== 'completed') {
                updateData.completed = false;
                updateData.completed_at = null;
            }

            const { data, error } = await this.supabase
                .from('todos')
                .update(updateData)
                .eq('id', todoId)
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

    // ลบรายการ
    async deleteTodo(todoId, userId) {
        try {
            // ตรวจสอบว่าเป็นเจ้าของรายการหรือไม่
            const { data: existingTodo } = await this.supabase
                .from('todos')
                .select('user_id')
                .eq('id', todoId)
                .single();

            if (!existingTodo || existingTodo.user_id !== userId) {
                throw new Error('ไม่มีสิทธิ์ลบรายการนี้');
            }

            const { error } = await this.supabase
                .from('todos')
                .delete()
                .eq('id', todoId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ทำเครื่องหมายเสร็จสิ้น
    async toggleCompleted(todoId, userId, completed = true) {
        try {
            const updateData = {
                completed,
                status: completed ? 'completed' : 'pending',
                completed_at: completed ? new Date().toISOString() : null
            };

            return await this.updateTodo(todoId, userId, updateData);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ค้นหารายการ
    async searchTodos(userId, searchTerm, filters = {}) {
        try {
            let query = this.supabase
                .from('todos')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `);

            // หา partner_id สำหรับการค้นหาในรายการที่แชร์
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            // สิทธิ์การเข้าถึง: เจ้าของ หรือ คู่รักที่ดูรายการที่แชร์
            if (user?.partner_id) {
                query = query.or(`user_id.eq.${userId},and(user_id.eq.${user.partner_id},shared_with_partner.eq.true)`);
            } else {
                query = query.eq('user_id', userId);
            }

            // ค้นหาในหัวข้อและรายละเอียด
            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            // กรองตามสถานะ
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            // กรองตามหมวดหมู่
            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            // กรองตามความสำคัญ
            if (filters.priority) {
                query = query.eq('priority', filters.priority);
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

    // ดึงรายการที่ใกล้ครบกำหนด
    async getUpcomingTodos(userId, days = 7) {
        try {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);

            // หา partner_id
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            let query = this.supabase
                .from('todos')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .not('due_date', 'is', null)
                .gte('due_date', new Date().toISOString())
                .lte('due_date', endDate.toISOString())
                .eq('completed', false);

            // รวมรายการของคู่รักที่แชร์ด้วย
            if (user?.partner_id) {
                query = query.or(`user_id.eq.${userId},and(user_id.eq.${user.partner_id},shared_with_partner.eq.true)`);
            } else {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query
                .order('due_date', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงสถิติรายการ
    async getTodoStats(userId) {
        try {
            // หา partner_id
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            const stats = {};

            // สถิติของตัวเอง
            const { data: myTodos } = await this.supabase
                .from('todos')
                .select('status, priority, category, completed')
                .eq('user_id', userId);

            stats.total = myTodos?.length || 0;
            stats.completed = myTodos?.filter(t => t.completed).length || 0;
            stats.pending = myTodos?.filter(t => !t.completed).length || 0;

            // สถิติตามสถานะ
            const statusStats = {};
            myTodos?.forEach(todo => {
                statusStats[todo.status] = (statusStats[todo.status] || 0) + 1;
            });
            stats.byStatus = statusStats;

            // สถิติตามความสำคัญ
            const priorityStats = {};
            myTodos?.forEach(todo => {
                priorityStats[todo.priority] = (priorityStats[todo.priority] || 0) + 1;
            });
            stats.byPriority = priorityStats;

            // สถิติตามหมวดหมู่
            const categoryStats = {};
            myTodos?.forEach(todo => {
                categoryStats[todo.category] = (categoryStats[todo.category] || 0) + 1;
            });
            stats.byCategory = categoryStats;

            // สถิติรายการที่แชร์
            if (user?.partner_id) {
                const { count: sharedCount } = await this.supabase
                    .from('todos')
                    .select('*', { count: 'exact', head: true })
                    .in('user_id', [userId, user.partner_id])
                    .eq('shared_with_partner', true);

                stats.shared = sharedCount || 0;
            }

            return { success: true, data: stats };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงรายการที่มี reminder
    async getTodosWithReminders(userId) {
        try {
            const now = new Date();
            const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            const { data, error } = await this.supabase
                .from('todos')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('user_id', userId)
                .not('reminder_at', 'is', null)
                .gte('reminder_at', now.toISOString())
                .lte('reminder_at', next24Hours.toISOString())
                .eq('completed', false)
                .order('reminder_at', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = TodoService;
