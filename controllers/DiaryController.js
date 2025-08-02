// Diary Controller - API endpoints สำหรับจัดการไดอารี่
const DiaryService = require('../services/DiaryService');
const UserService = require('../services/UserService');

class DiaryController {
    constructor() {
        this.diaryService = new DiaryService();
        this.userService = new UserService();
    }

    // สร้างไดอารี่ใหม่
    async createDiary(req, res) {
        try {
            const { userId } = req.params;
            const diaryData = { ...req.body, user_id: userId };
            
            const result = await this.diaryService.createDiary(diaryData);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'diary_created', {
                    diary_id: result.data.id,
                    title: result.data.title,
                    category: result.data.category,
                    visibility: result.data.visibility
                }, req);

                res.status(201).json({
                    success: true,
                    message: 'สร้างไดอารี่สำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการสร้างไดอารี่',
                error: error.message
            });
        }
    }

    // ดึงไดอารี่ทั้งหมดของผู้ใช้
    async getUserDiaries(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            const result = await this.diaryService.getUserDiaries(userId, parseInt(page), parseInt(limit));
            
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
                message: 'เกิดข้อผิดพลาดในการดึงไดอารี่',
                error: error.message
            });
        }
    }

    // ดึงไดอารี่ที่แชร์กับคู่รัก
    async getSharedDiaries(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            const result = await this.diaryService.getSharedDiaries(userId, parseInt(page), parseInt(limit));
            
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
                message: 'เกิดข้อผิดพลาดในการดึงไดอารี่ที่แชร์',
                error: error.message
            });
        }
    }

    // ดึงไดอารี่ตาม ID
    async getDiaryById(req, res) {
        try {
            const { userId, diaryId } = req.params;
            
            const result = await this.diaryService.getDiaryById(diaryId, userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'diary_viewed', {
                    diary_id: diaryId,
                    title: result.data.title
                }, req);

                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงไดอารี่',
                error: error.message
            });
        }
    }

    // อัปเดตไดอารี่
    async updateDiary(req, res) {
        try {
            const { userId, diaryId } = req.params;
            
            const result = await this.diaryService.updateDiary(diaryId, userId, req.body);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'diary_updated', {
                    diary_id: diaryId,
                    title: result.data.title,
                    updated_fields: Object.keys(req.body)
                }, req);

                res.json({
                    success: true,
                    message: 'อัปเดตไดอารี่สำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการอัปเดตไดอารี่',
                error: error.message
            });
        }
    }

    // ลบไดอารี่
    async deleteDiary(req, res) {
        try {
            const { userId, diaryId } = req.params;
            
            const result = await this.diaryService.deleteDiary(diaryId, userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'diary_deleted', {
                    diary_id: diaryId
                }, req);

                res.json({
                    success: true,
                    message: 'ลบไดอารี่สำเร็จ'
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
                message: 'เกิดข้อผิดพลาดในการลบไดอารี่',
                error: error.message
            });
        }
    }

    // เพิ่มรีแอคชั่นในไดอารี่
    async addReaction(req, res) {
        try {
            const { userId, diaryId } = req.params;
            const { reaction } = req.body;
            
            if (!reaction) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุรีแอคชั่น'
                });
            }

            const result = await this.diaryService.addReaction(diaryId, userId, reaction);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'diary_reaction_added', {
                    diary_id: diaryId,
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

    // ค้นหาไดอารี่
    async searchDiaries(req, res) {
        try {
            const { userId } = req.params;
            const { q, category, mood, date_from, date_to, tags } = req.query;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาใส่คำค้นหาอย่างน้อย 2 ตัวอักษร'
                });
            }

            const filters = {};
            if (category) filters.category = category;
            if (mood) filters.mood = mood;
            if (date_from) filters.date_from = date_from;
            if (date_to) filters.date_to = date_to;
            if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
            
            const result = await this.diaryService.searchDiaries(userId, q, filters);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'diary_searched', {
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
                message: 'เกิดข้อผิดพลาดในการค้นหาไดอารี่',
                error: error.message
            });
        }
    }

    // ดึงสถิติไดอารี่
    async getDiaryStats(req, res) {
        try {
            const { userId } = req.params;
            
            const result = await this.diaryService.getDiaryStats(userId);
            
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
                message: 'เกิดข้อผิดพลาดในการดึงสถิติไดอารี่',
                error: error.message
            });
        }
    }

    // ดึงไดอารี่ล่าสุด
    async getRecentDiaries(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 5 } = req.query;
            
            const result = await this.diaryService.getRecentDiaries(userId, parseInt(limit));
            
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
                message: 'เกิดข้อผิดพลาดในการดึงไดอารี่ล่าสุด',
                error: error.message
            });
        }
    }

    // ดึงไดอารี่ตามหมวดหมู่
    async getDiariesByCategory(req, res) {
        try {
            const { userId, category } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            const filters = { category };
            const result = await this.diaryService.getUserDiaries(userId, parseInt(page), parseInt(limit));
            
            // กรองตามหมวดหมู่
            if (result.success && result.data) {
                result.data = result.data.filter(diary => diary.category === category);
            }
            
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
                message: 'เกิดข้อผิดพลาดในการดึงไดอารี่ตามหมวดหมู่',
                error: error.message
            });
        }
    }

    // ดึงไดอารี่ตามอารมณ์
    async getDiariesByMood(req, res) {
        try {
            const { userId, mood } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            const filters = { mood };
            const result = await this.diaryService.getUserDiaries(userId, parseInt(page), parseInt(limit));
            
            // กรองตามอารมณ์
            if (result.success && result.data) {
                result.data = result.data.filter(diary => diary.mood === mood);
            }
            
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
                message: 'เกิดข้อผิดพลาดในการดึงไดอารี่ตามอารมณ์',
                error: error.message
            });
        }
    }

    // Export ไดอารี่เป็น JSON
    async exportDiaries(req, res) {
        try {
            const { userId } = req.params;
            const { format = 'json' } = req.query;
            
            // ดึงไดอารี่ทั้งหมด
            const result = await this.diaryService.getUserDiaries(userId, 1, 1000);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'diary_exported', {
                    format: format,
                    count: result.data.length
                }, req);

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="diaries_${userId}_${new Date().toISOString().split('T')[0]}.json"`);
                
                res.json({
                    success: true,
                    export_date: new Date().toISOString(),
                    user_id: userId,
                    total_diaries: result.data.length,
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
                message: 'เกิดข้อผิดพลาดในการ Export ไดอารี่',
                error: error.message
            });
        }
    }
}

module.exports = DiaryController;
