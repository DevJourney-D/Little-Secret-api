// User Controller - API endpoints สำหรับจัดการผู้ใช้
const UserService = require('../services/UserService');

class UserController {
    constructor() {
        this.userService = new UserService();
    }

    // สร้างผู้ใช้ใหม่
    async createUser(req, res) {
        try {
            const result = await this.userService.createUser(req.body);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(result.data.id, 'user_created', {
                    email: result.data.email,
                    username: result.data.username
                }, req);

                res.status(201).json({
                    success: true,
                    message: 'สร้างผู้ใช้สำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้',
                error: error.message
            });
        }
    }

    // เข้าสู่ระบบ
    async loginUser(req, res) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
                });
            }

            const result = await this.userService.loginUser(username, password);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(result.data.user.id, 'user_login', {
                    username: result.data.user.username,
                    login_method: 'username'
                }, req);

                res.json({
                    success: true,
                    message: 'เข้าสู่ระบบสำเร็จ',
                    data: {
                        user: result.data.user,
                        token: result.data.token
                    }
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
                error: error.message
            });
        }
    }

    // ดึงข้อมูลผู้ใช้ตาม ID
    async getUserById(req, res) {
        try {
            const { userId } = req.params;
            const result = await this.userService.getUserById(userId);
            
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
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
                error: error.message
            });
        }
    }

    // ดึงข้อมูลผู้ใช้ตาม email
    async getUserByEmail(req, res) {
        try {
            const { email } = req.params;
            const result = await this.userService.getUserByEmail(email);
            
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
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
                error: error.message
            });
        }
    }

    // ดึงข้อมูลผู้ใช้ตาม username
    async getUserByUsername(req, res) {
        try {
            const { username } = req.params;
            const result = await this.userService.getUserByUsername(username);
            
            if (result.success) {
                res.json({
                    success: true,
                    available: false,
                    message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว'
                });
            } else {
                res.json({
                    success: true,
                    available: true,
                    message: 'ชื่อผู้ใช้ว่าง'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการตรวจสอบชื่อผู้ใช้',
                error: error.message
            });
        }
    }

    // อัปเดตข้อมูลผู้ใช้
    async updateUser(req, res) {
        try {
            const { userId } = req.params;
            const result = await this.userService.updateUser(userId, req.body);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'profile_updated', {
                    updated_fields: Object.keys(req.body)
                }, req);

                res.json({
                    success: true,
                    message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้',
                error: error.message
            });
        }
    }

    // ลบผู้ใช้
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            const result = await this.userService.deleteUser(userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'account_deactivated', {}, req);

                res.json({
                    success: true,
                    message: 'ลบผู้ใช้สำเร็จ'
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
                message: 'เกิดข้อผิดพลาดในการลบผู้ใช้',
                error: error.message
            });
        }
    }

    // ตั้งสถานะออนไลน์
    async setOnlineStatus(req, res) {
        try {
            const { userId } = req.params;
            const { isOnline } = req.body;
            
            const result = await this.userService.setOnlineStatus(userId, isOnline);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: `ตั้งสถานะออนไลน์เป็น ${isOnline ? 'ออนไลน์' : 'ออฟไลน์'} สำเร็จ`
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
                message: 'เกิดข้อผิดพลาดในการตั้งสถานะออนไลน์',
                error: error.message
            });
        }
    }

    // ค้นหาผู้ใช้
    async searchUsers(req, res) {
        try {
            const { q } = req.query;
            const { currentUserId } = req.params;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาใส่คำค้นหาอย่างน้อย 2 ตัวอักษร'
                });
            }

            const result = await this.userService.searchUsers(q, currentUserId);
            
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
                message: 'เกิดข้อผิดพลาดในการค้นหาผู้ใช้',
                error: error.message
            });
        }
    }

    // อัปเดต User Preferences
    async updatePreferences(req, res) {
        try {
            const { userId } = req.params;
            const result = await this.userService.updateUserPreferences(userId, req.body);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'preferences_updated', {
                    updated_settings: Object.keys(req.body)
                }, req);

                res.json({
                    success: true,
                    message: 'อัปเดตการตั้งค่าสำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า',
                error: error.message
            });
        }
    }

    // สร้าง Partner Code
    async generatePartnerCode(req, res) {
        try {
            const { userId } = req.params;
            const result = await this.userService.generatePartnerCode(userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'partner_code_generated', {
                    partner_code: result.data.partner_code
                }, req);

                res.json({
                    success: true,
                    message: 'สร้างรหัสคู่รักสำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการสร้างรหัสคู่รัก',
                error: error.message
            });
        }
    }

    // เชื่อมต่อกับคู่รัก
    async connectWithPartner(req, res) {
        try {
            const { userId } = req.params;
            const { partnerCode, partner_code } = req.body;
            
            // รับทั้ง partnerCode และ partner_code
            const code = partnerCode || partner_code;
            
            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาใส่รหัสคู่รัก'
                });
            }

            const result = await this.userService.connectWithPartner(userId, code);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'partner_connected', {
                    partner_id: result.data.id,
                    partner_name: result.data.display_name || `${result.data.first_name} ${result.data.last_name}`
                }, req);

                res.json({
                    success: true,
                    message: 'เชื่อมต่อกับคู่รักสำเร็จ',
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
                message: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับคู่รัก',
                error: error.message
            });
        }
    }

    // ดึง Activity Logs
    async getActivityLogs(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20, activity_type } = req.query;

            let query = this.userService.supabase
                .from('user_activity_logs')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);

            if (activity_type) {
                query = query.eq('activity_type', activity_type);
            }

            const offset = (page - 1) * limit;
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            res.json({
                success: true,
                data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Activity Logs',
                error: error.message
            });
        }
    }

    // Middleware สำหรับตรวจสอบ authentication
    async authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'ไม่พบ Access Token'
                });
            }

            const token = authHeader.split(' ')[1];
            
            // ตรวจสอบ JWT token
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
            const userResult = await this.userService.getUserById(decoded.userId);
            
            if (!userResult.success) {
                return res.status(401).json({
                    success: false,
                    message: 'ผู้ใช้ไม่พบในระบบ'
                });
            }

            // เพิ่มข้อมูลผู้ใช้ใน request
            req.user = userResult.data;
            req.userId = decoded.userId;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Access Token ไม่ถูกต้อง'
                });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Access Token หมดอายุแล้ว'
                });
            }
            res.status(401).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการตรวจสอบ Access Token',
                error: error.message
            });
        }
    }

        // Middleware สำหรับตรวจสอบสิทธิ์เจ้าของ
    async authorizeOwner(req, res, next) {
        try {
            const { userId } = req.params;
            
            if (req.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
                error: error.message
            });
        }
    }
}

module.exports = UserController;
