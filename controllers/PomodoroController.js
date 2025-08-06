// Pomodoro Controller - API endpoints สำหรับระบบ Pomodoro Timer (ออกแบบใหม่เพื่อให้ใช้งานง่าย)
const PomodoroService = require('../services/PomodoroService');
const UserService = require('../services/UserService');

class PomodoroController {
    constructor() {
        this.pomodoroService = new PomodoroService();
        this.userService = new UserService();
    }

    // ============================================
    // BASIC POMODORO OPERATIONS - การใช้งานพื้นฐาน
    // ============================================

    // เริ่มเซสชั่น Pomodoro ใหม่ (สำหรับผู้ใช้ทั่วไป)
    async start(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { 
                task_name = 'งานใหม่', 
                duration = 25, 
                session_type = 'focus' 
            } = req.body;
            
            const sessionData = {
                user_id: userId,
                task_name,
                duration_minutes: duration,
                session_type
            };
            
            const result = await this.pomodoroService.createPomodoroSession(sessionData);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(
                    userId, 
                    'pomodoro_started', 
                    'pomodoro_session', 
                    result.data.id, 
                    {
                        task_name: result.data.task_name,
                        duration_minutes: result.data.duration_minutes
                    }, 
                    req
                );

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
                message: 'เกิดข้อผิดพลาดในการเริ่มเซสชั่น',
                error: error.message
            });
        }
    }

    // เสร็จสิ้นเซสชั่น
    async complete(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { sessionId } = req.params;
            const { focus_rating, notes } = req.body;
            
            const result = await this.pomodoroService.completeSession(sessionId, userId, {
                focus_rating,
                notes
            });
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(
                    userId, 
                    'pomodoro_completed', 
                    'pomodoro_session', 
                    sessionId, 
                    {
                        focus_rating,
                        notes: notes ? 'มีหมายเหตุ' : 'ไม่มีหมายเหตุ'
                    }, 
                    req
                );

                res.json({
                    success: true,
                    message: 'เสร็จสิ้นเซสชั่นสำเร็จ',
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
    async cancel(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { sessionId } = req.params;
            
            const result = await this.pomodoroService.cancelSession(sessionId, userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(
                    userId, 
                    'pomodoro_cancelled', 
                    'pomodoro_session', 
                    sessionId, 
                    {}, 
                    req
                );

                res.json({
                    success: true,
                    message: 'ยกเลิกเซสชั่นสำเร็จ'
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

    // ดึงเซสชั่นปัจจุบัน (ที่กำลังทำงาน)
    async current(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            
            const result = await this.pomodoroService.getCurrentSession(userId);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'ไม่มีเซสชั่นที่กำลังทำงาน'
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

    // ============================================
    // SESSION MANAGEMENT - จัดการเซสชั่น
    // ============================================

    // ดึงรายการเซสชั่น (ง่าย ๆ)
    async list(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { 
                page = 1, 
                limit = 10, 
                completed = null,
                type = null 
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                session_type: type,
                completed: completed !== null ? completed === 'true' : null
            };
            
            const result = await this.pomodoroService.listPomodoroSessions(userId, options);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data.sessions,
                    pagination: result.data.pagination
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
                message: 'เกิดข้อผิดพลาดในการดึงรายการเซสชั่น',
                error: error.message
            });
        }
    }

    // ดึงเซสชั่นตาม ID
    async get(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { sessionId } = req.params;
            
            const result = await this.pomodoroService.getPomodoroSessionById(sessionId, userId);
            
            if (result.success) {
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
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเซสชั่น',
                error: error.message
            });
        }
    }

    // แก้ไขเซสชั่น
    async update(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { sessionId } = req.params;
            
            const result = await this.pomodoroService.updatePomodoroSession(sessionId, userId, req.body);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(
                    userId, 
                    'pomodoro_updated', 
                    'pomodoro_session', 
                    sessionId, 
                    {
                        updated_fields: Object.keys(req.body)
                    }, 
                    req
                );

                res.json({
                    success: true,
                    message: 'แก้ไขเซสชั่นสำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการแก้ไขเซสชั่น',
                error: error.message
            });
        }
    }

    // ลบเซสชั่น
    async delete(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { sessionId } = req.params;
            
            const result = await this.pomodoroService.deletePomodoroSession(sessionId, userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(
                    userId, 
                    'pomodoro_deleted', 
                    'pomodoro_session', 
                    sessionId, 
                    {}, 
                    req
                );

                res.json({
                    success: true,
                    message: 'ลบเซสชั่นสำเร็จ'
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
                message: 'เกิดข้อผิดพลาดในการลบเซสชั่น',
                error: error.message
            });
        }
    }

    // ============================================
    // STATISTICS & ANALYTICS - สถิติและการวิเคราะห์
    // ============================================

    // ดึงสถิติแบบง่าย
    async stats(req, res) {
        try {
            const userId = req.userId || req.params.userId;
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
                message: 'เกิดข้อผิดพลาดในการดึงสถิติ',
                error: error.message
            });
        }
    }

    // ข้อมูลโดยรวมของผู้ใช้
    async profile(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            
            const result = await this.pomodoroService.getUserPomodoroInfo(userId);
            
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
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์',
                error: error.message
            });
        }
    }

    // ============================================
    // ADVANCED FEATURES - ฟีเจอร์ขั้นสูง
    // ============================================

    // เพิ่มการขัดจังหวะ
    async addInterruption(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { sessionId } = req.params;
            
            const result = await this.pomodoroService.addInterruption(sessionId, userId);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'เพิ่มการขัดจังหวะแล้ว',
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
                message: 'เกิดข้อผิดพลาดในการเพิ่มการขัดจังหวะ',
                error: error.message
            });
        }
    }

    // ค้นหาเซสชั่น
    async search(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { q, type, page = 1, limit = 10 } = req.query;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาใส่คำค้นหาอย่างน้อย 2 ตัวอักษร'
                });
            }

            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                session_type: type
            };
            
            const result = await this.pomodoroService.searchSessions(userId, q, filters);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data.sessions,
                    pagination: result.data.pagination
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
                message: 'เกิดข้อผิดพลาดในการค้นหา',
                error: error.message
            });
        }
    }

    // ดึงแนวโน้มประสิทธิภาพ
    async trend(req, res) {
        try {
            const userId = req.userId || req.params.userId;
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
                message: 'เกิดข้อผิดพลาดในการดึงแนวโน้ม',
                error: error.message
            });
        }
    }

    // เซสชั่นที่ดีที่สุด
    async best(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { limit = 5 } = req.query;
            
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

    // รายงานรายวัน
    async dailyReport(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { date = new Date().toISOString().split('T')[0] } = req.query;
            
            const result = await this.pomodoroService.getDailyProductivity(userId, date);
            
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
                message: 'เกิดข้อผิดพลาดในการสร้างรายงานรายวัน',
                error: error.message
            });
        }
    }

    // รายงานรายสัปดาห์
    async weeklyReport(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { week_start } = req.query;
            
            // ถ้าไม่ได้ระบุ ใช้วันจันทร์ของสัปดาห์นี้
            let weekStart = week_start;
            if (!weekStart) {
                const today = new Date();
                const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
                weekStart = monday.toISOString().split('T')[0];
            }
            
            const result = await this.pomodoroService.getWeeklyReport(userId, weekStart);
            
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
                message: 'เกิดข้อผิดพลาดในการสร้างรายงานรายสัปดาห์',
                error: error.message
            });
        }
    }

    // ส่งออกข้อมูล
    async export(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const { format = 'json' } = req.query;
            
            const result = await this.pomodoroService.exportPomodoroSessions(userId, format);
            
            if (result.success) {
                if (format === 'csv') {
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', 'attachment; filename=pomodoro_sessions.csv');
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Disposition', 'attachment; filename=pomodoro_sessions.json');
                }
                
                res.json({
                    success: true,
                    data: result.data,
                    format: result.format
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
                message: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล',
                error: error.message
            });
        }
    }

    // ============================================
    // QUICK ACTIONS - การใช้งานด่วน
    // ============================================

    // เริ่มเซสชั่นด่วน (ใช้ค่าเริ่มต้น)
    async quickStart(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            
            const sessionData = {
                user_id: userId,
                task_name: 'เซสชั่นด่วน',
                duration_minutes: 25,
                session_type: 'focus'
            };
            
            const result = await this.pomodoroService.createPomodoroSession(sessionData);
            
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: 'เริ่มเซสชั่นด่วนสำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการเริ่มเซสชั่นด่วน',
                error: error.message
            });
        }
    }

    // สรุปวันนี้
    async today(req, res) {
        try {
            const userId = req.userId || req.params.userId;
            const today = new Date().toISOString().split('T')[0];
            
            const result = await this.pomodoroService.getDailyProductivity(userId, today);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'สรุปประสิทธิภาพวันนี้',
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
                message: 'เกิดข้อผิดพลาดในการสรุปวันนี้',
                error: error.message
            });
        }
    }
}

module.exports = PomodoroController;
