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

    // บันทึกการสนทนากับเนโกะ
    async saveNekoConversation(conversationData) {
        try {
            const { data, error } = await this.supabase
                .from('neko_conversations')
                .insert([{
                    user_id: conversationData.user_id,
                    message: conversationData.message,
                    response: conversationData.response,
                    mood: conversationData.mood || 'neutral',
                    context: conversationData.conversation_context || conversationData.context
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงประวัติการสนทนากับเนโกะ
    async getNekoConversations(userId, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const { data, error, count } = await this.supabase
                .from('neko_conversations')
                .select('*', { count: 'exact' })
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
                const emotion = conv.emotion_detected;
                stats.emotions[emotion] = (stats.emotions[emotion] || 0) + 1;
            });

            // นับประเภทการตอบสนอง
            conversations.forEach(conv => {
                const type = conv.response_type;
                stats.response_types[type] = (stats.response_types[type] || 0) + 1;
            });

            // นับ mood
            conversations.forEach(conv => {
                const mood = conv.mood;
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
            return { 
                success: true, 
                data: { 
                    message: "สวัสดีตอนเช้าค่ะ! ขอให้วันนี้เป็นวันที่ดีนะคะ 🌞" 
                } 
            };
        }
    }
}

module.exports = NekoChatService;
