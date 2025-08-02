// Neko Chat Controller - จัดการ API endpoints สำหรับ AI Chatbot เนโกะ
const NekoChatService = require('../services/NekoChatService');

class NekoChatController {
    constructor() {
        this.nekoChatService = new NekoChatService();
    }

    // API สำหรับการสนทนากับเนโกะ
    async chatWithNeko(req, res) {
        try {
            const { message, context } = req.body;
            const userId = req.user.id;

            if (!message || message.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'ข้อความไม่สามารถเป็นค่าว่างได้'
                });
            }

            // สร้างการตอบสนองของเนโกะ
            const nekoResponse = await this.nekoChatService.generateNekoResponse(
                message, 
                userId, 
                context || {}
            );

            // บันทึกการสนทนา
            const conversationData = {
                user_id: userId,
                message: message.trim(),
                response: nekoResponse.message,
                mood: nekoResponse.mood,
                conversation_context: context || {},
                emotion_detected: nekoResponse.emotion_detected,
                response_type: nekoResponse.response_type
            };

            const saveResult = await this.nekoChatService.saveNekoConversation(conversationData);

            if (!saveResult.success) {
                console.error('Failed to save conversation:', saveResult.error);
                // ยังคงส่งการตอบสนองแม้บันทึกไม่สำเร็จ
            }

            res.json({
                success: true,
                data: {
                    message: nekoResponse.message,
                    emotion_detected: nekoResponse.emotion_detected,
                    response_type: nekoResponse.response_type,
                    mood: nekoResponse.mood,
                    conversation_id: saveResult.success ? saveResult.data.id : null
                }
            });

        } catch (error) {
            console.error('Error in chatWithNeko:', error);
            res.status(500).json({
                success: false,
                error: 'ไม่สามารถประมวลผลการสนทนาได้',
                details: error.message
            });
        }
    }

    // API สำหรับดึงประวัติการสนทนากับเนโกะ
    async getConversationHistory(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50); // จำกัดไม่เกิน 50

            const result = await this.nekoChatService.getNekoConversations(userId, page, limit);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถดึงประวัติการสนทนาได้',
                    details: result.error
                });
            }

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });

        } catch (error) {
            console.error('Error in getConversationHistory:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการดึงประวัติการสนทนา',
                details: error.message
            });
        }
    }

    // API สำหรับดึงสถิติการสนทนากับเนโกะ
    async getConversationStats(req, res) {
        try {
            const userId = req.user.id;

            const result = await this.nekoChatService.getNekoStats(userId);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถดึงสถิติการสนทนาได้',
                    details: result.error
                });
            }

            res.json({
                success: true,
                data: result.data
            });

        } catch (error) {
            console.error('Error in getConversationStats:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการดึงสถิติ',
                details: error.message
            });
        }
    }

    // API สำหรับรับคำแนะนำประจำวันจากเนโกะ
    async getDailyAdvice(req, res) {
        try {
            const userId = req.user.id;

            const result = await this.nekoChatService.generateDailyAdvice(userId);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถสร้างคำแนะนำได้',
                    details: result.error
                });
            }

            res.json({
                success: true,
                data: result.data
            });

        } catch (error) {
            console.error('Error in getDailyAdvice:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการสร้างคำแนะนำ',
                details: error.message
            });
        }
    }

    // API สำหรับรับคำทักทายตอนเช้าจากเนโกะ
    async getMorningGreeting(req, res) {
        try {
            const userId = req.user.id;

            const result = await this.nekoChatService.generateMorningGreeting(userId);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถสร้างคำทักทายได้',
                    details: result.error
                });
            }

            res.json({
                success: true,
                data: result.data
            });

        } catch (error) {
            console.error('Error in getMorningGreeting:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการสร้างคำทักทาย',
                details: error.message
            });
        }
    }

    // API สำหรับลบประวัติการสนทนา
    async deleteConversation(req, res) {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;

            if (!conversationId) {
                return res.status(400).json({
                    success: false,
                    error: 'กรุณาระบุ ID ของการสนทนา'
                });
            }

            // ตรวจสอบว่าการสนทนาเป็นของผู้ใช้คนนี้
            const { data: conversation, error: fetchError } = await this.nekoChatService.supabase
                .from('neko_conversations')
                .select('id')
                .eq('id', conversationId)
                .eq('user_id', userId)
                .single();

            if (fetchError || !conversation) {
                return res.status(404).json({
                    success: false,
                    error: 'ไม่พบการสนทนาที่ระบุ'
                });
            }

            // ลบการสนทนา
            const { error: deleteError } = await this.nekoChatService.supabase
                .from('neko_conversations')
                .delete()
                .eq('id', conversationId)
                .eq('user_id', userId);

            if (deleteError) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถลบการสนทนาได้',
                    details: deleteError.message
                });
            }

            res.json({
                success: true,
                message: 'ลบการสนทนาเรียบร้อยแล้ว'
            });

        } catch (error) {
            console.error('Error in deleteConversation:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการลบการสนทนา',
                details: error.message
            });
        }
    }

    // API สำหรับรีเซ็ตประวัติการสนทนาทั้งหมด
    async clearAllConversations(req, res) {
        try {
            const userId = req.user.id;

            const { error } = await this.nekoChatService.supabase
                .from('neko_conversations')
                .delete()
                .eq('user_id', userId);

            if (error) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถลบประวัติการสนทนาได้',
                    details: error.message
                });
            }

            res.json({
                success: true,
                message: 'ลบประวัติการสนทนาทั้งหมดเรียบร้อยแล้ว'
            });

        } catch (error) {
            console.error('Error in clearAllConversations:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการลบประวัติการสนทนา',
                details: error.message
            });
        }
    }

    // API สำหรับการตั้งค่าโหมดของเนโกะ
    async updateNekoMode(req, res) {
        try {
            const { mode, preferences } = req.body;
            const userId = req.user.id;

            const validModes = ['friendly', 'romantic', 'supportive', 'playful', 'professional'];
            
            if (!validModes.includes(mode)) {
                return res.status(400).json({
                    success: false,
                    error: 'โหมดที่ระบุไม่ถูกต้อง'
                });
            }

            // อัปเดตการตั้งค่าผู้ใช้
            const { error } = await this.nekoChatService.supabase
                .from('users')
                .update({ 
                    neko_mode: mode,
                    neko_preferences: preferences || {}
                })
                .eq('id', userId);

            if (error) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถอัปเดตการตั้งค่าได้',
                    details: error.message
                });
            }

            res.json({
                success: true,
                message: 'อัปเดตโหมดเนโกะเรียบร้อยแล้ว',
                data: { mode, preferences }
            });

        } catch (error) {
            console.error('Error in updateNekoMode:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า',
                details: error.message
            });
        }
    }
}

module.exports = NekoChatController;
