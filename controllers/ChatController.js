// Chat Controller - API endpoints สำหรับระบบแชท
const ChatService = require('../services/ChatService');
const UserService = require('../services/UserService');

class ChatController {
    constructor() {
        this.chatService = new ChatService();
        this.userService = new UserService();
    }

    // ส่งข้อความ
    async sendMessage(req, res) {
        try {
            const { userId } = req.params;
            const messageData = { ...req.body, sender_id: userId };
            
            // ตรวจสอบข้อมูลที่จำเป็น
            if (!messageData.receiver_id || !messageData.message) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุผู้รับและข้อความ'
                });
            }
            
            const result = await this.chatService.sendMessage(messageData);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'message_sent', {
                    message_id: result.data.id,
                    receiver_id: messageData.receiver_id,
                    message_type: messageData.message_type || 'text'
                }, req);

                res.status(201).json({
                    success: true,
                    message: 'ส่งข้อความสำเร็จ',
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการส่งข้อความ',
                error: error.message
            });
        }
    }

    // ดึงข้อความสนทนา
    async getMessages(req, res) {
        try {
            const { userId, partnerId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            
            const result = await this.chatService.getMessages(userId, partnerId, parseInt(page), parseInt(limit));
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    pagination: result.pagination
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อความ',
                error: error.message
            });
        }
    }

    // ดึงข้อความล่าสุด
    async getLatestMessages(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 20 } = req.query;
            
            const result = await this.chatService.getLatestMessages(userId, parseInt(limit));
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อความล่าสุด',
                error: error.message
            });
        }
    }

    // อัปเดตข้อความ
    async updateMessage(req, res) {
        try {
            const { userId, messageId } = req.params;
            
            if (!req.body.message) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุข้อความใหม่'
                });
            }
            
            const result = await this.chatService.updateMessage(messageId, userId, req.body);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'message_edited', {
                    message_id: messageId
                }, req);

                res.json({
                    success: true,
                    message: 'แก้ไขข้อความสำเร็จ',
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการแก้ไขข้อความ',
                error: error.message
            });
        }
    }

    // ลบข้อความ
    async deleteMessage(req, res) {
        try {
            const { userId, messageId } = req.params;
            
            const result = await this.chatService.deleteMessage(messageId, userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'message_deleted', {
                    message_id: messageId
                }, req);

                res.json({
                    success: true,
                    message: 'ลบข้อความสำเร็จ'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการลบข้อความ',
                error: error.message
            });
        }
    }

    // อ่านข้อความ
    async markAsRead(req, res) {
        try {
            const { userId } = req.params;
            const { messageIds } = req.body;
            
            if (!messageIds || !Array.isArray(messageIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุรายการ ID ข้อความ'
                });
            }
            
            const result = await this.chatService.markAsRead(messageIds, userId);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'อ่านข้อความสำเร็จ',
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการอ่านข้อความ',
                error: error.message
            });
        }
    }

    // นับข้อความที่ยังไม่ได้อ่าน
    async getUnreadCount(req, res) {
        try {
            const { userId } = req.params;
            
            const result = await this.chatService.getUnreadCount(userId);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: { unread_count: result.count }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการนับข้อความที่ยังไม่ได้อ่าน',
                error: error.message
            });
        }
    }

    // เพิ่มรีแอคชั่นในข้อความ
    async addReaction(req, res) {
        try {
            const { userId, messageId } = req.params;
            const { reaction } = req.body;
            
            if (!reaction) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุรีแอคชั่น'
                });
            }
            
            const result = await this.chatService.addReaction(messageId, userId, reaction);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'message_reaction_added', {
                    message_id: messageId,
                    reaction: reaction
                }, req);

                res.json({
                    success: true,
                    message: 'เพิ่มรีแอคชั่นสำเร็จ',
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการเพิ่มรีแอคชั่น',
                error: error.message
            });
        }
    }

    // ลบรีแอคชั่น
    async removeReaction(req, res) {
        try {
            const { userId, messageId } = req.params;
            
            const result = await this.chatService.removeReaction(messageId, userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'message_reaction_removed', {
                    message_id: messageId
                }, req);

                res.json({
                    success: true,
                    message: 'ลบรีแอคชั่นสำเร็จ',
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการลบรีแอคชั่น',
                error: error.message
            });
        }
    }

    // ค้นหาข้อความ
    async searchMessages(req, res) {
        try {
            const { userId } = req.params;
            const { q, message_type, date_from, date_to } = req.query;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาใส่คำค้นหาอย่างน้อย 2 ตัวอักษร'
                });
            }

            const filters = {};
            if (message_type) filters.message_type = message_type;
            if (date_from) filters.date_from = date_from;
            if (date_to) filters.date_to = date_to;
            
            const result = await this.chatService.searchMessages(userId, q, filters);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'messages_searched', {
                    search_term: q,
                    filters: filters,
                    results_count: result.data.length
                }, req);

                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการค้นหาข้อความ',
                error: error.message
            });
        }
    }

    // ดึงสถิติการแชท
    async getChatStats(req, res) {
        try {
            const { userId } = req.params;
            
            const result = await this.chatService.getChatStats(userId);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงสถิติการแชท',
                error: error.message
            });
        }
    }

    // ดึงไฟล์สื่อจากแชท
    async getChatMedia(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 20 } = req.query;
            
            const result = await this.chatService.getChatMedia(userId, parseInt(limit));
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงไฟล์สื่อ',
                error: error.message
            });
        }
    }

    // Export ข้อความแชทเป็น JSON
    async exportMessages(req, res) {
        try {
            const { userId } = req.params;
            const { format = 'json' } = req.query;
            
            // ดึงข้อความทั้งหมด
            const result = await this.chatService.getLatestMessages(userId, 10000);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'messages_exported', {
                    format: format,
                    count: result.data.length
                }, req);

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="chat_messages_${userId}_${new Date().toISOString().split('T')[0]}.json"`);
                
                res.json({
                    success: true,
                    export_date: new Date().toISOString(),
                    user_id: userId,
                    total_messages: result.data.length,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการ Export ข้อความ',
                error: error.message
            });
        }
    }

    // ดึงประวัติการสนทนา (สำหรับ Dashboard)
    async getConversationSummary(req, res) {
        try {
            const { userId } = req.params;
            const { days = 7 } = req.query;
            
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - parseInt(days));
            
            const filters = {
                date_from: dateFrom.toISOString()
            };
            
            // ดึงสถิติและข้อความล่าสุด
            const [statsResult, messagesResult] = await Promise.all([
                this.chatService.getChatStats(userId),
                this.chatService.getLatestMessages(userId, 10)
            ]);
            
            if (statsResult.success && messagesResult.success) {
                res.json({
                    success: true,
                    data: {
                        stats: statsResult.data,
                        recent_messages: messagesResult.data,
                        period_days: parseInt(days)
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปการสนทนา',
                error: error.message
            });
        }
    }
}

module.exports = ChatController;
