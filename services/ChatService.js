// Chat Service - จัดการแชท
const { createClient } = require('@supabase/supabase-js');

class ChatService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    // ส่งข้อความ
    async sendMessage(messageData) {
        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .insert([{
                    sender_id: messageData.sender_id,
                    receiver_id: messageData.receiver_id,
                    message: messageData.message,
                    message_type: messageData.message_type || 'text',
                    reply_to_id: messageData.reply_to_id,
                    attachments: messageData.attachments,
                    reactions: {}
                }])
                .select(`
                    *,
                    sender:sender_id(id, first_name, last_name, display_name, avatar_url),
                    receiver:receiver_id(id, first_name, last_name, display_name, avatar_url),
                    reply_to:reply_to_id(id, message, sender_id)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงข้อความสนทนา
    async getMessages(userId, partnerId, page = 1, limit = 50) {
        try {
            const offset = (page - 1) * limit;

            const { data, error, count } = await this.supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:sender_id(id, first_name, last_name, display_name, avatar_url),
                    receiver:receiver_id(id, first_name, last_name, display_name, avatar_url),
                    reply_to:reply_to_id(id, message, sender_id)
                `, { count: 'exact' })
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
                )
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return { 
                success: true, 
                data: data.reverse(), // เรียงให้เก่าสุดอยู่ข้างบน
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

    // ดึงข้อความล่าสุด
    async getLatestMessages(userId, limit = 20) {
        try {
            // หา partner_id ก่อน
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            if (!user?.partner_id) {
                return { success: true, data: [] };
            }

            const { data, error } = await this.supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:sender_id(id, first_name, last_name, display_name, avatar_url),
                    receiver:receiver_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${user.partner_id}),and(sender_id.eq.${user.partner_id},receiver_id.eq.${userId})`
                )
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // อัปเดตข้อความ
    async updateMessage(messageId, userId, updateData) {
        try {
            // ตรวจสอบว่าเป็นเจ้าของข้อความหรือไม่
            const { data: existingMessage } = await this.supabase
                .from('chat_messages')
                .select('sender_id')
                .eq('id', messageId)
                .single();

            if (!existingMessage || existingMessage.sender_id !== userId) {
                throw new Error('ไม่มีสิทธิ์แก้ไขข้อความนี้');
            }

            // เฉพาะบางฟิลด์เท่านั้นที่แก้ไขได้
            const allowedFields = ['message', 'edited_at'];
            const filteredData = {};
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    filteredData[field] = updateData[field];
                }
            });

            filteredData.edited_at = new Date().toISOString();

            const { data, error } = await this.supabase
                .from('chat_messages')
                .update(filteredData)
                .eq('id', messageId)
                .eq('sender_id', userId)
                .select(`
                    *,
                    sender:sender_id(id, first_name, last_name, display_name, avatar_url),
                    receiver:receiver_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ลบข้อความ (Soft delete)
    async deleteMessage(messageId, userId) {
        try {
            // ตรวจสอบว่าเป็นเจ้าของข้อความหรือไม่
            const { data: existingMessage } = await this.supabase
                .from('chat_messages')
                .select('sender_id')
                .eq('id', messageId)
                .single();

            if (!existingMessage || existingMessage.sender_id !== userId) {
                throw new Error('ไม่มีสิทธิ์ลบข้อความนี้');
            }

            const { data, error } = await this.supabase
                .from('chat_messages')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', messageId)
                .eq('sender_id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // อ่านข้อความ (Mark as read)
    async markAsRead(messageIds, userId) {
        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .update({ read: true })
                .in('id', messageIds)
                .eq('receiver_id', userId)
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // นับข้อความที่ยังไม่ได้อ่าน
    async getUnreadCount(userId) {
        try {
            const { count, error } = await this.supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userId)
                .eq('read', false)
                .is('deleted_at', null);

            if (error) throw error;
            return { success: true, count: count || 0 };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // เพิ่มรีแอคชั่นในข้อความ
    async addReaction(messageId, userId, reaction) {
        try {
            // ดึงข้อความปัจจุบัน
            const { data: message } = await this.supabase
                .from('chat_messages')
                .select('reactions, sender_id, receiver_id')
                .eq('id', messageId)
                .single();

            if (!message) {
                throw new Error('ไม่พบข้อความ');
            }

            // ตรวจสอบสิทธิ์ (ต้องเป็นผู้ส่งหรือผู้รับ)
            if (message.sender_id !== userId && message.receiver_id !== userId) {
                throw new Error('ไม่มีสิทธิ์ให้รีแอคชั่นข้อความนี้');
            }

            // อัปเดตรีแอคชั่น
            const reactions = message.reactions || {};
            reactions[userId] = reaction;

            const { data, error } = await this.supabase
                .from('chat_messages')
                .update({ reactions })
                .eq('id', messageId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ลบรีแอคชั่น
    async removeReaction(messageId, userId) {
        try {
            // ดึงข้อความปัจจุบัน
            const { data: message } = await this.supabase
                .from('chat_messages')
                .select('reactions, sender_id, receiver_id')
                .eq('id', messageId)
                .single();

            if (!message) {
                throw new Error('ไม่พบข้อความ');
            }

            // ตรวจสอบสิทธิ์
            if (message.sender_id !== userId && message.receiver_id !== userId) {
                throw new Error('ไม่มีสิทธิ์แก้ไขรีแอคชั่นข้อความนี้');
            }

            // ลบรีแอคชั่น
            const reactions = message.reactions || {};
            delete reactions[userId];

            const { data, error } = await this.supabase
                .from('chat_messages')
                .update({ reactions })
                .eq('id', messageId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ค้นหาข้อความ
    async searchMessages(userId, searchTerm, filters = {}) {
        try {
            // หา partner_id
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            if (!user?.partner_id) {
                return { success: true, data: [] };
            }

            let query = this.supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:sender_id(id, first_name, last_name, display_name, avatar_url),
                    receiver:receiver_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${user.partner_id}),and(sender_id.eq.${user.partner_id},receiver_id.eq.${userId})`
                )
                .is('deleted_at', null);

            // ค้นหาในเนื้อหาข้อความ
            if (searchTerm) {
                query = query.ilike('message', `%${searchTerm}%`);
            }

            // กรองตามประเภทข้อความ
            if (filters.message_type) {
                query = query.eq('message_type', filters.message_type);
            }

            // กรองตามวันที่
            if (filters.date_from) {
                query = query.gte('created_at', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('created_at', filters.date_to);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงสถิติการแชท
    async getChatStats(userId) {
        try {
            // หา partner_id
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            if (!user?.partner_id) {
                return { success: true, data: { totalMessages: 0, sentMessages: 0, receivedMessages: 0 } };
            }

            const stats = {};

            // นับข้อความทั้งหมด
            const { count: totalMessages } = await this.supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${user.partner_id}),and(sender_id.eq.${user.partner_id},receiver_id.eq.${userId})`
                )
                .is('deleted_at', null);

            stats.totalMessages = totalMessages || 0;

            // นับข้อความที่ส่ง
            const { count: sentMessages } = await this.supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('sender_id', userId)
                .eq('receiver_id', user.partner_id)
                .is('deleted_at', null);

            stats.sentMessages = sentMessages || 0;

            // นับข้อความที่รับ
            const { count: receivedMessages } = await this.supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('sender_id', user.partner_id)
                .eq('receiver_id', userId)
                .is('deleted_at', null);

            stats.receivedMessages = receivedMessages || 0;

            // นับข้อความที่ยังไม่ได้อ่าน
            const { count: unreadMessages } = await this.supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userId)
                .eq('read', false)
                .is('deleted_at', null);

            stats.unreadMessages = unreadMessages || 0;

            return { success: true, data: stats };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึง media files จากข้อความแชท
    async getChatMedia(userId, limit = 20) {
        try {
            // หา partner_id
            const { data: user } = await this.supabase
                .from('users')
                .select('partner_id')
                .eq('id', userId)
                .single();

            if (!user?.partner_id) {
                return { success: true, data: [] };
            }

            const { data, error } = await this.supabase
                .from('chat_messages')
                .select(`
                    id,
                    message,
                    message_type,
                    attachments,
                    created_at,
                    sender:sender_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${user.partner_id}),and(sender_id.eq.${user.partner_id},receiver_id.eq.${userId})`
                )
                .in('message_type', ['image', 'video', 'voice'])
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = ChatService;
