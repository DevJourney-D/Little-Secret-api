// Supabase Service Configuration
const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
    constructor() {
        console.log('🔍 Checking environment variables...');
        console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
        console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Present' : 'Missing');
        console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
        
        this.url = process.env.SUPABASE_URL;
        this.anonKey = process.env.SUPABASE_ANON_KEY;
        this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!this.url || !this.anonKey) {
            throw new Error('Missing Supabase configuration. Please check your environment variables.');
        }

        // Client for regular operations
        this.supabase = createClient(this.url, this.anonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: false
            }
        });

        // Admin client for service operations (if service key is provided)
        if (this.serviceKey) {
            this.supabaseAdmin = createClient(this.url, this.serviceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
        }

        console.log('✅ Supabase service initialized');
    }

    // Test connection to Supabase
    async testConnection() {
        try {
            // ทดสอบด้วยการเรียก auth admin เพื่อตรวจสอบ service role key
            const { data, error } = await this.supabase.auth.admin.listUsers({
                page: 1,
                perPage: 1
            });

            if (error) {
                throw error;
            }

            console.log('✅ Supabase connection successful');
            return true;
        } catch (error) {
            console.error('❌ Supabase connection failed:', error.message);
            // อย่า throw error แล้วให้ server หยุด ให้ warning แทน
            console.warn('⚠️ โปรดตรวจสอบ SUPABASE_SERVICE_ROLE_KEY ใน .env file');
            return false;
        }
    }

    // Get client instance
    getClient() {
        return this.supabase;
    }

    // Get admin client instance (for server operations)
    getAdminClient() {
        if (!this.supabaseAdmin) {
            throw new Error('Supabase admin client not initialized. Service role key required.');
        }
        return this.supabaseAdmin;
    }

    // Authentication helpers
    async verifyToken(token) {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser(token);
            if (error) throw error;
            return user;
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    // Database helpers
    async createUser(userData) {
        const { data, error } = await this.supabase
            .from('users')
            .insert([userData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getUserById(userId) {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    async getUserByUsername(username) {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
        return data;
    }

    async updateUser(userId, updates) {
        const { data, error } = await this.supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Partner connection helpers
    async createPartnerConnection(user1Id, user2Id, connectionCode) {
        const { data, error } = await this.supabase
            .from('partner_connections')
            .insert([{
                user1_id: user1Id,
                user2_id: user2Id,
                connection_code: connectionCode,
                status: 'connected',
                connected_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getPartnerByCode(partnerCode) {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('partner_code', partnerCode)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    // Diary helpers
    async createDiaryEntry(entryData) {
        const { data, error } = await this.supabase
            .from('diary_entries')
            .insert([entryData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getDiaryEntries(userId, partnerId = null) {
        let query = this.supabase
            .from('diary_entries')
            .select('*')
            .or(`user_id.eq.${userId},user_id.eq.${partnerId || 'null'}`)
            .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    // Chat helpers
    async createChatMessage(messageData) {
        const { data, error } = await this.supabase
            .from('chat_messages')
            .insert([messageData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getChatMessages(userId, partnerId, limit = 50) {
        const { data, error } = await this.supabase
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data.reverse(); // Return in chronological order
    }

    async markMessagesAsRead(userId, partnerId) {
        const { data, error } = await this.supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('sender_id', partnerId)
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return data;
    }

    // Real-time subscriptions
    subscribeToTable(tableName, callback, filter = null) {
        let subscription = this.supabase
            .channel(`${tableName}_changes`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: tableName,
                    filter: filter 
                }, 
                callback
            )
            .subscribe();

        return subscription;
    }

    // File storage helpers
    async uploadFile(bucket, fileName, file) {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (error) throw error;
        return data;
    }

    async getFileUrl(bucket, fileName) {
        const { data } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }
}

// Export singleton instance
module.exports = new SupabaseService();
