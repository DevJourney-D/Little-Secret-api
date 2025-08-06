// Neko Chat Service - จัดการ AI Chatbot เนโกะ
const { createClient } = require('@supabase/supabase-js');

class NekoChatService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // ตัวอย่างคำตอบของเนโกะ
        this.nekoResponses = {
            greetings: [
                "สวัสดีค่ะ! เนโกะมาแล้วค่า~ 🐱💕",
                "หวัดดีค่ะ! วันนี้เป็นยังไงบ้างคะ? 😸",
                "ยินดีที่ได้พบกันค่ะ! เนโกะพร้อมช่วยเหลือแล้ว~ 🌟",
                "สวัสดีจ้า! เนโกะรอคุยกับคุณอยู่เลยค่ะ 💖"
            ],
            encouragement: [
                "เก่งมากเลยค่ะ! เนโกะภูมิใจในตัวคุณ 🌟",
                "สู้ๆ นะคะ! คุณทำได้แน่นอน 💪",
                "ไม่เป็นไรค่ะ ทุกคนมีวันที่ไม่สบายใจ กอดๆ 🤗",
                "เนโกะเชื่อในตัวคุณค่ะ ลองใหม่อีกครั้งนะ ✨"
            ],
            love_advice: [
                "ความรักต้องใช้ความเข้าใจและการสื่อสารค่ะ 💕",
                "การแสดงความห่วงใยเล็กๆ น้อยๆ สำคัญมากเลยค่ะ 🥰",
                "อย่าลืมบอกรักกันบ่อยๆ นะคะ 💖",
                "เวลาที่ใช้ร่วมกันคือของขวัญที่ดีที่สุดค่ะ ⏰💝"
            ],
            motivation: [
                "วันนี้คุณได้ทำอะไรที่ทำให้ตัวเองภูมิใจบ้างคะ? 🌈",
                "จุดเล็กๆ ก็สำคัญนะคะ ค่อยๆ ไปทีละขั้น 👣",
                "เนโกะเห็นว่าคุณพยายามมากเลยค่ะ เก่งจริงๆ! 🎉",
                "การเริ่มต้นใหม่ทุกวันคือโอกาสใหม่ค่ะ 🌅"
            ],
            comfort: [
                "เนโกะอยู่ข้างๆ คุณเสมอนะคะ ไม่ต้องเศร้าเลย 🤗",
                "ทุกคนมีวันที่เหนื่อยใจบ้างค่ะ พักผ่อนให้เพียงพอนะ 😌",
                "อย่าเก็บความรู้สึกไว้คนเดียวค่ะ เล่าให้เนโกะฟังได้เลย 👂💕",
                "tomorrow is another day ค่ะ วันพรุ่งนี้จะดีขึ้นแน่นอน 🌟"
            ],
            random: [
                "รู้ไหมคะ? เนโกะชอบปลาทูน่ามากเลย! 🐟",
                "วันนี้อากาศเป็นยังไงบ้างคะ? เนโกะชอบแดดอบอุ่นๆ ☀️",
                "คุณชอบทำอะไรยามว่างคะ? เนโกะอยากรู้! 🤔",
                "เนโกะอยากเล่นด้วยกันค่ะ มีเกมส์อะไรสนุกๆ ไหม? 🎮"
            ]
        };

        // คำหลักสำหรับการตอบสนอง
        this.responsePatterns = {
            greetings: /สวัสดี|หวัดดี|ฮัลโหล|hello|hi|สบายดี/i,
            sadness: /เศร้า|หดหู่|ไม่สบายใจ|ท้อ|ผิดหวัง|เหนื่อย/i,
            happiness: /ดีใจ|มีความสุข|สนุก|ชื่นชม|ภูมิใจ|สำเร็จ/i,
            love: /รัก|คิดถึง|หวาน|คู่รัก|แฟน|ความรัก/i,
            encouragement: /ช่วย|กำลังใจ|สู้|พยายาม|เก่ง|ทำได้/i,
            question: /ทำไม|อะไร|ยังไง|ไหม|หรือ|\?/i
        };
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

    // ตรวจสอบสิทธิ์การเข้าถึงการสนทนา
    async _checkConversationAccess(conversationId, userId) {
        try {
            const { data: conversation } = await this.supabase
                .from('neko_conversations')
                .select('user_id')
                .eq('id', conversationId)
                .single();

            if (!conversation) {
                throw new Error('ไม่พบการสนทนา');
            }

            const hasAccess = conversation.user_id === userId;
            const isOwner = conversation.user_id === userId;

            return { hasAccess, isOwner, conversation };
        } catch (error) {
            throw error;
        }
    }

    // สร้าง query สำหรับกรองการสนทนา
    _buildConversationQuery(baseQuery, filters = {}) {
        let query = baseQuery;

        // กรองตาม mood
        if (filters.mood) {
            query = query.eq('mood', filters.mood);
        }

        // กรองตาม emotion_detected
        if (filters.emotion) {
            query = query.eq('emotion_detected', filters.emotion);
        }

        // กรองตาม response_type
        if (filters.response_type) {
            query = query.eq('response_type', filters.response_type);
        }

        // กรองตามวันที่
        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
        }

        // ค้นหาในข้อความ
        if (filters.search) {
            query = query.or(`message.ilike.%${filters.search}%,response.ilike.%${filters.search}%`);
        }

        // เรียงลำดับ
        const sortBy = filters.sortBy || 'created_at';
        const sortOrder = filters.sortOrder || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        return query;
    }

    // ============================================
    // CORE NEKO OPERATIONS - การจัดการเนโกะแชทพื้นฐาน
    // ============================================

    // สร้างการสนทนาใหม่ (CREATE)
    async createNekoConversation(conversationData) {
        try {
            const { data, error } = await this.supabase
                .from('neko_conversations')
                .insert([{
                    user_id: conversationData.user_id,
                    message: conversationData.message,
                    response: conversationData.response,
                    emotion_detected: conversationData.emotion_detected || 'neutral',
                    response_type: conversationData.response_type || 'general',
                    mood: conversationData.mood || 'friendly',
                    context: conversationData.context || conversationData.conversation_context
                }])
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('createNekoConversation error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงการสนทนาตาม ID (READ)
    async getNekoConversationById(conversationId, userId) {
        try {
            const accessCheck = await this._checkConversationAccess(conversationId, userId);
            
            if (!accessCheck.hasAccess) {
                throw new Error('ไม่มีสิทธิ์เข้าถึงการสนทนานี้');
            }

            const { data, error } = await this.supabase
                .from('neko_conversations')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('id', conversationId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('getNekoConversationById error:', error);
            return { success: false, error: error.message };
        }
    }

    // อัปเดตการสนทนา (UPDATE)
    async updateNekoConversation(conversationId, userId, updateData) {
        try {
            const accessCheck = await this._checkConversationAccess(conversationId, userId);
            
            if (!accessCheck.isOwner) {
                throw new Error('ไม่มีสิทธิ์แก้ไขการสนทนานี้');
            }

            // ลบข้อมูลที่ไม่ควรแก้ไข
            const cleanData = { ...updateData };
            delete cleanData.id;
            delete cleanData.user_id;
            delete cleanData.created_at;

            const { data, error } = await this.supabase
                .from('neko_conversations')
                .update({
                    ...cleanData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', conversationId)
                .eq('user_id', userId)
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('updateNekoConversation error:', error);
            return { success: false, error: error.message };
        }
    }

    // ลบการสนทนา (DELETE)
    async deleteNekoConversation(conversationId, userId) {
        try {
            const accessCheck = await this._checkConversationAccess(conversationId, userId);
            
            if (!accessCheck.isOwner) {
                throw new Error('ไม่มีสิทธิ์ลบการสนทนานี้');
            }

            const { error } = await this.supabase
                .from('neko_conversations')
                .delete()
                .eq('id', conversationId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true, data: { message: 'ลบการสนทนาเรียบร้อยแล้ว' } };
        } catch (error) {
            console.error('deleteNekoConversation error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // LISTING & FILTERING - การแสดงรายการและกรอง
    // ============================================

    // แสดงรายการการสนทนาของผู้ใช้ (LIST)
    async listNekoConversations(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                mood = null,
                emotion = null,
                response_type = null,
                search = '',
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = options;

            const offset = (page - 1) * limit;

            let query = this.supabase
                .from('neko_conversations')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `, { count: 'exact' })
                .eq('user_id', userId);

            // ใช้ helper function สำหรับ filter
            query = this._buildConversationQuery(query, { mood, emotion, response_type, search, sortBy, sortOrder });
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;
            if (error) throw error;

            return {
                success: true,
                data: {
                    conversations: data,
                    pagination: this._buildPagination(page, limit, count)
                }
            };
        } catch (error) {
            console.error('listNekoConversations error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงข้อมูลผู้ใช้และสถิติ (USER INFO)
    async getUserNekoInfo(userId) {
        try {
            // ดึงข้อมูลผู้ใช้
            const { data: user, error: userError } = await this.supabase
                .from('users')
                .select('id, first_name, last_name, display_name, email, avatar_url, created_at')
                .eq('id', userId)
                .single();

            if (userError) throw userError;

            // ดึงสถิติ
            const statsResult = await this.getNekoStats(userId);
            const stats = statsResult.success ? statsResult.data : {};

            // ดึงการสนทนาล่าสุด
            const recentResult = await this.listNekoConversations(userId, { limit: 5 });
            const recentConversations = recentResult.success ? recentResult.data.conversations : [];

            // วิเคราะห์ mood ที่พบบ่อย
            const favoriteMood = this._getFavoriteMood(stats.moods || {});
            const favoriteEmotion = this._getFavoriteEmotion(stats.emotions || {});

            return {
                success: true,
                data: {
                    user,
                    stats,
                    recent_conversations: recentConversations,
                    summary: {
                        total_conversations: stats.total_conversations || 0,
                        favorite_mood: favoriteMood,
                        favorite_emotion: favoriteEmotion,
                        last_conversation: recentConversations[0] || null
                    }
                }
            };
        } catch (error) {
            console.error('getUserNekoInfo error:', error);
            return { success: false, error: error.message };
        }
    }

    // หา mood ที่ชื่นชอบ
    _getFavoriteMood(moods) {
        let max = 0;
        let favorite = 'friendly';
        
        for (const [mood, count] of Object.entries(moods)) {
            if (count > max) {
                max = count;
                favorite = mood;
            }
        }
        
        return favorite;
    }

    // หาอารมณ์ที่พบบ่อย
    _getFavoriteEmotion(emotions) {
        let max = 0;
        let favorite = 'neutral';
        
        for (const [emotion, count] of Object.entries(emotions)) {
            if (count > max) {
                max = count;
                favorite = emotion;
            }
        }
        
        return favorite;
    }

    // ============================================
    // NEKO RESPONSE GENERATION - การสร้างคำตอบของเนโกะ
    // ============================================

    // สร้างการตอบสนองของเนโกะ
    async generateNekoResponse(message, userId, context = {}) {
        try {
            // วิเคราะห์ความรู้สึกและเนื้อหา
            const emotion = this.analyzeEmotion(message);
            const responseType = this.determineResponseType(message, emotion);
            
            // เลือกคำตอบที่เหมาะสม
            let response = this.selectResponse(responseType, context);
            
            // ปรับแต่งคำตอบตามบริบท
            response = this.personalizeResponse(response, userId, context);

            return {
                message: response,
                emotion_detected: emotion,
                response_type: responseType,
                mood: this.getMoodFromEmotion(emotion)
            };
        } catch (error) {
            console.error('generateNekoResponse error:', error);
            return {
                message: "เนโกะไม่เข้าใจค่ะ ช่วยพูดใหม่ได้ไหมคะ? 😅",
                emotion_detected: 'neutral',
                response_type: 'default',
                mood: 'neutral'
            };
        }
    }

    // วิเคราะห์อารมณ์จากข้อความ
    analyzeEmotion(message) {
        const lowerMessage = message.toLowerCase();

        if (this.responsePatterns.sadness.test(lowerMessage)) {
            return 'sad';
        } else if (this.responsePatterns.happiness.test(lowerMessage)) {
            return 'happy';
        } else if (this.responsePatterns.love.test(lowerMessage)) {
            return 'love';
        } else if (this.responsePatterns.encouragement.test(lowerMessage)) {
            return 'need_encouragement';
        } else {
            return 'neutral';
        }
    }

    // กำหนดประเภทการตอบสนอง
    determineResponseType(message, emotion) {
        const lowerMessage = message.toLowerCase();

        if (this.responsePatterns.greetings.test(lowerMessage)) {
            return 'greetings';
        } else if (emotion === 'sad') {
            return 'comfort';
        } else if (emotion === 'happy') {
            return 'encouragement';
        } else if (emotion === 'love') {
            return 'love_advice';
        } else if (emotion === 'need_encouragement') {
            return 'motivation';
        } else if (this.responsePatterns.question.test(lowerMessage)) {
            return 'helpful';
        } else {
            return 'random';
        }
    }

    // เลือกคำตอบ
    selectResponse(responseType, context = {}) {
        const responses = this.nekoResponses[responseType] || this.nekoResponses.random;
        
        // เลือกคำตอบแบบสุ่ม
        let selectedResponse = responses[Math.floor(Math.random() * responses.length)];

        // เพิ่มการตอบสนองพิเศษตามเวลา
        const hour = new Date().getHours();
        if (responseType === 'greetings') {
            if (hour >= 5 && hour < 12) {
                selectedResponse = "อรุณสวัสดิ์ค่ะ! " + selectedResponse;
            } else if (hour >= 12 && hour < 17) {
                selectedResponse = "สวัสดีตอนบ่ายค่ะ! " + selectedResponse;
            } else if (hour >= 17 && hour < 21) {
                selectedResponse = "สวัสดีตอนเย็นค่ะ! " + selectedResponse;
            } else {
                selectedResponse = "สวัสดีตอนกลางคืนค่ะ! " + selectedResponse;
            }
        }

        return selectedResponse;
    }

    // ปรับแต่งคำตอบตามผู้ใช้
    personalizeResponse(response, userId, context) {
        // เพิ่มชื่อผู้ใช้ถ้ามี
        if (context.userName) {
            response = response.replace(/คุณ/g, `คุณ${context.userName}`);
        }

        // เพิ่มอิโมจิตามบริบท
        if (context.isPartnerConnected) {
            response += " อย่าลืมคุยกับคู่รักด้วยนะคะ 💕";
        }

        return response;
    }

    // แปลงอารมณ์เป็น mood
    getMoodFromEmotion(emotion) {
        const moodMap = {
            'happy': 'cheerful',
            'sad': 'sympathetic',
            'love': 'romantic',
            'need_encouragement': 'supportive',
            'neutral': 'friendly'
        };
        return moodMap[emotion] || 'friendly';
    }

    // บันทึกการสนทนากับเนโกะ (Alias สำหรับ createNekoConversation)
    async saveNekoConversation(conversationData) {
        return await this.createNekoConversation(conversationData);
    }

    // ============================================
    // ADVANCED FEATURES - ฟีเจอร์ขั้นสูง
    // ============================================

    // ดึงประวัติการสนทนากับเนโกะ (Alias สำหรับ listNekoConversations)
    async getNekoConversations(userId, page = 1, limit = 20) {
        const result = await this.listNekoConversations(userId, { page, limit });
        
        if (result.success) {
            return {
                success: true,
                data: result.data.conversations,
                pagination: result.data.pagination
            };
        }
        
        return result;
    }

    // ดึงสถิติการสนทนากับเนโกะ
    async getNekoStats(userId) {
        try {
            const { data: conversations } = await this.supabase
                .from('neko_conversations')
                .select('emotion_detected, response_type, mood, created_at')
                .eq('user_id', userId);

            if (!conversations || conversations.length === 0) {
                return { 
                    success: true, 
                    data: { 
                        total_conversations: 0,
                        emotions: {},
                        response_types: {},
                        moods: {},
                        recent_activity: []
                    } 
                };
            }

            const stats = {
                total_conversations: conversations.length,
                emotions: {},
                response_types: {},
                moods: {},
                recent_activity: []
            };

            // นับอารมณ์
            conversations.forEach(conv => {
                const emotion = conv.emotion_detected || 'neutral';
                stats.emotions[emotion] = (stats.emotions[emotion] || 0) + 1;
            });

            // นับประเภทการตอบสนอง
            conversations.forEach(conv => {
                const type = conv.response_type || 'general';
                stats.response_types[type] = (stats.response_types[type] || 0) + 1;
            });

            // นับ mood
            conversations.forEach(conv => {
                const mood = conv.mood || 'friendly';
                stats.moods[mood] = (stats.moods[mood] || 0) + 1;
            });

            // กิจกรรมล่าสุด
            stats.recent_activity = conversations
                .slice(0, 5)
                .map(conv => ({
                    date: conv.created_at,
                    emotion: conv.emotion_detected,
                    mood: conv.mood
                }));

            return { success: true, data: stats };
        } catch (error) {
            console.error('getNekoStats error:', error);
            return { success: false, error: error.message };
        }
    }

    // ค้นหาการสนทนา
    async searchNekoConversations(userId, searchTerm, options = {}) {
        try {
            const searchOptions = {
                ...options,
                search: searchTerm,
                limit: options.limit || 50
            };

            return await this.listNekoConversations(userId, searchOptions);
        } catch (error) {
            console.error('searchNekoConversations error:', error);
            return { success: false, error: error.message };
        }
    }

    // สร้างคำแนะนำจากเนโกะ
    async generateDailyAdvice(userId) {
        try {
            // ดึงข้อมูลกิจกรรมล่าสุดของผู้ใช้
            const [userResult, conversationsResult] = await Promise.all([
                this.supabase.from('users').select('*').eq('id', userId).single(),
                this.getNekoConversations(userId, 1, 5)
            ]);

            const advice = {
                message: "",
                category: "general",
                mood: "friendly"
            };

            // วิเคราะห์ pattern จากการสนทนาล่าสุด
            if (conversationsResult.success && conversationsResult.data.length > 0) {
                const recentEmotions = conversationsResult.data.map(c => c.emotion_detected);
                const sadCount = recentEmotions.filter(e => e === 'sad').length;
                const happyCount = recentEmotions.filter(e => e === 'happy').length;

                if (sadCount > happyCount) {
                    advice.message = "เนโกะสังเกตเห็นว่าคุณดูเศร้าๆ บ่อยเลยค่ะ วันนี้ลองทำอะไรที่ทำให้ตัวเองมีความสุขดูนะคะ อาจจะฟังเพลง กินของอร่อย หรือคุยกับคนที่รัก 💕";
                    advice.category = "comfort";
                    advice.mood = "sympathetic";
                } else if (happyCount > 0) {
                    advice.message = "เนโกะดีใจที่เห็นคุณมีความสุขค่ะ! วันนี้ลองแชร์ความสุขให้กับคนรอบข้างด้วยนะ ยิ้มแป๊บนึงก็ทำให้คนอื่นมีความสุขได้เลย 😊";
                    advice.category = "encouragement";
                    advice.mood = "cheerful";
                }
            } else {
                // คำแนะนำทั่วไป
                const generalAdvice = [
                    "วันนี้อย่าลืมดื่มน้ำให้เพียงพอนะคะ สุขภาพดีสำคัญมากเลย! 💧",
                    "ลองหาเวลาทำสิ่งที่รักสักหน่อยนะคะ แม้แค่ 10 นาทีก็ทำให้จิตใจสดชื่น 🌿",
                    "อย่าลืมบอกคนที่รักว่ารักพวกเขานะคะ คำเล็กๆ มีพลังมหาศาลเลย 💖",
                    "วันนี้ลองมองหาสิ่งเล็กๆ ที่ทำให้ขอบคุณดูค่ะ ความขอบคุณทำให้ใจสบาย 🙏"
                ];
                advice.message = generalAdvice[Math.floor(Math.random() * generalAdvice.length)];
            }

            return { success: true, data: advice };
        } catch (error) {
            console.error('generateDailyAdvice error:', error);
            return { 
                success: true, 
                data: {
                    message: "วันนี้เป็นวันใหม่ที่สวยงาม ลองทำสิ่งดีๆ ให้กับตัวเองนะคะ 🌈",
                    category: "general",
                    mood: "friendly"
                }
            };
        }
    }

    // สร้าง Morning Greeting
    async generateMorningGreeting(userId) {
        try {
            const greetings = [
                "อรุณสวัสดิ์ค่ะ! วันใหม่มาแล้ว พร้อมที่จะทำให้วันนี้เป็นวันที่ดีแล้วหรือยังคะ? 🌅",
                "สวัสดีตอนเช้าค่ะ! เนโกะหวังว่าคุณจะมีวันที่สดใสและเต็มไปด้วยรอยยิ้มนะคะ 😊",
                "เช้าดีค่ะ! วันนี้มีแผนอะไรสนุกๆ ไหมคะ? เนโกะอยากฟังเลย! 🌸",
                "หวัดดีตอนเช้าค่ะ! อย่าลืมทานอาหารเช้าและดื่มน้ำให้เพียงพอนะคะ 🥐☕"
            ];

            const selectedGreeting = greetings[Math.floor(Math.random() * greetings.length)];

            // บันทึกคำทักทายประจำวัน
            await this.supabase
                .from('daily_greetings')
                .upsert([{
                    user_id: userId,
                    greeting_text: selectedGreeting,
                    greeting_date: new Date().toISOString().split('T')[0]
                }]);

            return { success: true, data: { message: selectedGreeting } };
        } catch (error) {
            console.error('generateMorningGreeting error:', error);
            return { 
                success: true, 
                data: { 
                    message: "สวัสดีตอนเช้าค่ะ! ขอให้วันนี้เป็นวันที่ดีนะคะ 🌞" 
                } 
            };
        }
    }

    // ดึงการสนทนาตาม mood
    async getConversationsByMood(userId, mood, limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('neko_conversations')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('user_id', userId)
                .eq('mood', mood)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('getConversationsByMood error:', error);
            return { success: false, error: error.message };
        }
    }

    // ส่งออกการสนทนา
    async exportNekoConversations(userId, format = 'json') {
        try {
            const { data: conversations } = await this.supabase
                .from('neko_conversations')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (format === 'csv') {
                const csvData = conversations.map(conv => ({
                    วันที่: new Date(conv.created_at).toLocaleDateString('th-TH'),
                    เวลา: new Date(conv.created_at).toLocaleTimeString('th-TH'),
                    ข้อความของคุณ: conv.message,
                    ตอบกลับของเนโกะ: conv.response,
                    อารมณ์ที่ตรวจพบ: conv.emotion_detected,
                    ประเภทการตอบสนอง: conv.response_type,
                    อารมณ์ของเนโกะ: conv.mood
                }));
                
                return { success: true, data: csvData, format: 'csv' };
            }

            return { success: true, data: conversations, format: 'json' };
        } catch (error) {
            console.error('exportNekoConversations error:', error);
            return { success: false, error: error.message };
        }
    }

    // วิเคราะห์ความรู้สึกของผู้ใช้
    async analyzeUserMood(userId, days = 7) {
        try {
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - days);

            const { data: conversations } = await this.supabase
                .from('neko_conversations')
                .select('emotion_detected, created_at')
                .eq('user_id', userId)
                .gte('created_at', dateFrom.toISOString())
                .order('created_at', { ascending: true });

            if (!conversations || conversations.length === 0) {
                return {
                    success: true,
                    data: {
                        overall_mood: 'neutral',
                        mood_trend: 'stable',
                        daily_moods: {},
                        recommendations: ['ลองคุยกับเนโกะบ่อยๆ นะคะ เนโกะพร้อมฟังเสมอ! 🐱']
                    }
                };
            }

            // วิเคราะห์อารมณ์รายวัน
            const dailyMoods = {};
            conversations.forEach(conv => {
                const day = new Date(conv.created_at).toISOString().slice(0, 10);
                if (!dailyMoods[day]) {
                    dailyMoods[day] = { sad: 0, happy: 0, neutral: 0, love: 0, need_encouragement: 0 };
                }
                dailyMoods[day][conv.emotion_detected] = (dailyMoods[day][conv.emotion_detected] || 0) + 1;
            });

            // ประเมินอารมณ์โดยรวม
            const emotionCounts = { sad: 0, happy: 0, neutral: 0, love: 0, need_encouragement: 0 };
            conversations.forEach(conv => {
                emotionCounts[conv.emotion_detected] = (emotionCounts[conv.emotion_detected] || 0) + 1;
            });

            const overallMood = Object.keys(emotionCounts).reduce((a, b) => 
                emotionCounts[a] > emotionCounts[b] ? a : b
            );

            // สร้างคำแนะนำ
            const recommendations = this._generateMoodRecommendations(overallMood, emotionCounts);

            return {
                success: true,
                data: {
                    overall_mood: overallMood,
                    mood_trend: this._calculateMoodTrend(dailyMoods),
                    daily_moods: dailyMoods,
                    emotion_distribution: emotionCounts,
                    recommendations
                }
            };
        } catch (error) {
            console.error('analyzeUserMood error:', error);
            return { success: false, error: error.message };
        }
    }

    // สร้างคำแนะนำตามอารมณ์
    _generateMoodRecommendations(overallMood, emotionCounts) {
        const recommendations = [];

        if (overallMood === 'sad') {
            recommendations.push('เนโกะเห็นว่าคุณเศร้าๆ บ่อยเลยค่ะ ลองหาเวลาพักผ่อนและทำกิจกรรมที่ชอบนะคะ 🌸');
            recommendations.push('อย่าลืมคุยกับคนที่รักหรือเพื่อนที่ไว้ใจได้นะคะ การแบ่งปันความรู้สึกช่วยได้มากเลย 💕');
        } else if (overallMood === 'happy') {
            recommendations.push('เก่งมากเลยค่ะ! คุณดูมีความสุขดีจัง เนโกะดีใจด้วย 🎉');
            recommendations.push('ลองแชร์ความสุขให้คนรอบข้างด้วยนะคะ รอยยิ้มของคุณทำให้คนอื่นมีความสุขได้เลย 😊');
        } else if (overallMood === 'love') {
            recommendations.push('เนโกะเห็นว่าคุณเต็มไปด้วยความรักเลยค่ะ หวานมากๆ 💖');
            recommendations.push('อย่าลืมดูแลตัวเองด้วยนะคะ ความรักที่ยั่งยืนต้องเริ่มจากรักตัวเองก่อน 🌟');
        }

        return recommendations;
    }

    // คำนวณแนวโน้มอารมณ์
    _calculateMoodTrend(dailyMoods) {
        const days = Object.keys(dailyMoods).sort();
        if (days.length < 2) return 'stable';

        // คำนวณคะแนนอารมณ์ (happy = 2, love = 1, neutral = 0, need_encouragement = -1, sad = -2)
        const moodScores = days.map(day => {
            const moods = dailyMoods[day];
            return (moods.happy * 2) + (moods.love * 1) + (moods.neutral * 0) + 
                   (moods.need_encouragement * -1) + (moods.sad * -2);
        });

        const firstHalf = moodScores.slice(0, Math.floor(moodScores.length / 2));
        const secondHalf = moodScores.slice(Math.floor(moodScores.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (secondAvg > firstAvg + 0.5) return 'improving';
        if (secondAvg < firstAvg - 0.5) return 'declining';
        return 'stable';
    }
}

module.exports = NekoChatService;
