// Pomodoro Controller - API endpoints สำหรับระบบ Pomodoro Timer
const PomodoroService = require('../services/PomodoroService');
const UserService = require('../services/UserService');

class PomodoroController {
    constructor() {
        this.pomodoroService = new PomodoroService();
        this.userService = new UserService();
    }

    // เริ่มเซสชั่น Pomodoro ใหม่
    async startSession(req, res) {
        try {
            const { userId } = req.params;
            const sessionData = { ...req.body, user_id: userId };
            
            const result = await this.pomodoroService.startSession(sessionData);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'pomodoro_started', {
                    session_id: result.data.id,
                    task_name: result.data.task_name,
                    duration_minutes: result.data.duration_minutes,
                    session_type: result.data.session_type
                }, req);

                res.status(201).json({
                    success: true,
                    message: 'เริ่มเซสชั่น Pomodoro สำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการเริ่มเซสชั่น Pomodoro',
                error: error.message
            });
        }
    }

    // เสร็จสิ้นเซสชั่น
    async completeSession(req, res) {
        try {
            const { userId, sessionId } = req.params;
            
            const result = await this.pomodoroService.completeSession(sessionId, userId, req.body);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'pomodoro_completed', {
                    session_id: sessionId,
                    task_name: result.data.task_name,
                    duration_minutes: result.data.duration_minutes,
                    focus_rating: result.data.focus_rating,
                    interruptions: result.data.interruptions
                }, req);

                res.json({
                    success: true,
                    message: 'เสร็จสิ้นเซสชั่น Pomodoro สำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการเสร็จสิ้นเซสชั่น',
                error: error.message
            });
        }
    }

    // ยกเลิกเซสชั่น
    async cancelSession(req, res) {
        try {
            const { userId, sessionId } = req.params;
            
            const result = await this.pomodoroService.cancelSession(sessionId, userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'pomodoro_cancelled', {
                    session_id: sessionId
                }, req);

                res.json({
                    success: true,
                    message: 'ยกเลิกเซสชั่น Pomodoro สำเร็จ'
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
                message: 'เกิดข้อผิดพลาดในการยกเลิกเซสชั่น',
                error: error.message
            });
        }
    }

    // ดึงเซสชั่นปัจจุบัน
    async getCurrentSession(req, res) {
        try {
            const { userId } = req.params;
            
            const result = await this.pomodoroService.getCurrentSession(userId);
            
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
                message: 'เกิดข้อผิดพลาดในการดึงเซสชั่นปัจจุบัน',
                error: error.message
            });
        }
    }

    // ดึงประวัติเซสชั่น
    async getSessionHistory(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20, completed, session_type, date_from, date_to } = req.query;
            
            const filters = {};
            if (completed !== undefined) filters.completed = completed === 'true';
            if (session_type) filters.session_type = session_type;
            if (date_from) filters.date_from = date_from;
            if (date_to) filters.date_to = date_to;
            
            const result = await this.pomodoroService.getSessionHistory(userId, parseInt(page), parseInt(limit), filters);
            
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
                message: 'เกิดข้อผิดพลาดในการดึงประวัติเซสชั่น',
                error: error.message
            });
        }
    }

    // อัปเดตข้อมูลเซสชั่น
    async updateSession(req, res) {
        try {
            const { userId, sessionId } = req.params;
            
            const result = await this.pomodoroService.updateSession(sessionId, userId, req.body);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'pomodoro_updated', {
                    session_id: sessionId,
                    updated_fields: Object.keys(req.body)
                }, req);

                res.json({
                    success: true,
                    message: 'อัปเดตเซสชั่นสำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการอัปเดตเซสชั่น',
                error: error.message
            });
        }
    }

    // เพิ่มการขัดจังหวะ
    async addInterruption(req, res) {
        try {
            const { userId, sessionId } = req.params;
            
            const result = await this.pomodoroService.addInterruption(sessionId, userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'pomodoro_interrupted', {
                    session_id: sessionId,
                    interruptions: result.data.interruptions
                }, req);

                res.json({
                    success: true,
                    message: 'บันทึกการขัดจังหวะสำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการบันทึกการขัดจังหวะ',
                error: error.message
            });
        }
    }

    // ดึงสถิติ Pomodoro
    async getPomodoroStats(req, res) {
        try {
            const { userId } = req.params;
            const { period = 'week' } = req.query;
            
            const result = await this.pomodoroService.getPomodoroStats(userId, period);
            
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
                message: 'เกิดข้อผิดพลาดในการดึงสถิติ Pomodoro',
                error: error.message
            });
        }
    }

    // ดึงแนวโน้มประสิทธิภาพ
    async getProductivityTrend(req, res) {
        try {
            const { userId } = req.params;
            const { days = 30 } = req.query;
            
            const result = await this.pomodoroService.getProductivityTrend(userId, parseInt(days));
            
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
                message: 'เกิดข้อผิดพลาดในการดึงแนวโน้มประสิทธิภาพ',
                error: error.message
            });
        }
    }

    // ดึงเซสชั่นที่ดีที่สุด
    async getBestSessions(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 10 } = req.query;
            
            const result = await this.pomodoroService.getBestSessions(userId, parseInt(limit));
            
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
                message: 'เกิดข้อผิดพลาดในการดึงเซสชั่นที่ดีที่สุด',
                error: error.message
            });
        }
    }

    // ค้นหาเซสชั่น
    async searchSessions(req, res) {
        try {
            const { userId } = req.params;
            const { q, session_type, completed, min_focus_rating } = req.query;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาใส่คำค้นหาอย่างน้อย 2 ตัวอักษร'
                });
            }

            const filters = {};
            if (session_type) filters.session_type = session_type;
            if (completed !== undefined) filters.completed = completed === 'true';
            if (min_focus_rating) filters.min_focus_rating = parseInt(min_focus_rating);
            
            const result = await this.pomodoroService.searchSessions(userId, q, filters);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'pomodoro_searched', {
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
                message: 'เกิดข้อผิดพลาดในการค้นหาเซสชั่น',
                error: error.message
            });
        }
    }

    // ดึงเซสชั่นตามประเภท
    async getSessionsByType(req, res) {
        try {
            const { userId, sessionType } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            const filters = { session_type: sessionType };
            const result = await this.pomodoroService.getSessionHistory(userId, parseInt(page), parseInt(limit), filters);
            
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
                message: 'เกิดข้อผิดพลาดในการดึงเซสชั่นตามประเภท',
                error: error.message
            });
        }
    }

    // Export เซสชั่นเป็น JSON
    async exportSessions(req, res) {
        try {
            const { userId } = req.params;
            const { format = 'json', completed } = req.query;
            
            const filters = {};
            if (completed !== undefined) filters.completed = completed === 'true';
            
            // ดึงเซสชั่นทั้งหมด
            const result = await this.pomodoroService.getSessionHistory(userId, 1, 1000, filters);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'pomodoro_exported', {
                    format: format,
                    count: result.data.length,
                    filters: filters
                }, req);

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="pomodoro_sessions_${userId}_${new Date().toISOString().split('T')[0]}.json"`);
                
                res.json({
                    success: true,
                    export_date: new Date().toISOString(),
                    user_id: userId,
                    total_sessions: result.data.length,
                    filters: filters,
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
                message: 'เกิดข้อผิดพลาดในการ Export เซสชั่น',
                error: error.message
            });
        }
    }

    // สรุป Pomodoro สำหรับ Dashboard
    async getPomodoroSummary(req, res) {
        try {
            const { userId } = req.params;
            const { period = 'week' } = req.query;
            
            // ดึงข้อมูลพร้อมกัน
            const [statsResult, currentResult, trendResult] = await Promise.all([
                this.pomodoroService.getPomodoroStats(userId, period),
                this.pomodoroService.getCurrentSession(userId),
                this.pomodoroService.getProductivityTrend(userId, 7)
            ]);
            
            if (statsResult.success && currentResult.success && trendResult.success) {
                res.json({
                    success: true,
                    data: {
                        stats: statsResult.data,
                        current_session: currentResult.data,
                        trend: trendResult.data,
                        period: period
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
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป Pomodoro',
                error: error.message
            });
        }
    }

    // สร้าง Preset การตั้งค่า Pomodoro
    async createPreset(req, res) {
        try {
            const { userId } = req.params;
            const { name, work_duration, short_break, long_break, cycles_before_long_break } = req.body;
            
            // บันทึกลงใน user preferences หรือตารางแยก
            const presetData = {
                name,
                work_duration: work_duration || 25,
                short_break: short_break || 5,
                long_break: long_break || 15,
                cycles_before_long_break: cycles_before_long_break || 4
            };

            // บันทึก activity log
            await this.userService.logActivity(userId, 'pomodoro_preset_created', {
                preset_name: name,
                settings: presetData
            }, req);

            res.status(201).json({
                success: true,
                message: 'สร้าง Preset การตั้งค่า Pomodoro สำเร็จ',
                data: presetData
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการสร้าง Preset',
                error: error.message
            });
        }
    }
}

module.exports = PomodoroController;
