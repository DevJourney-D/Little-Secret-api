// User Routes - เส้น API สำหรับผู้ใช้ที่ออกแบบให้ใช้งานง่าย
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const PomodoroController = require('../controllers/PomodoroController');

// สร้าง instances
const userController = new UserController();
const pomodoroController = new PomodoroController();

// ============================================
// PUBLIC ROUTES - ไม่ต้องเข้าสู่ระบบ
// ============================================

// สร้างผู้ใช้ใหม่ (สมัครสมาชิก)
router.post('/register', userController.createUser.bind(userController));

// เข้าสู่ระบบ
router.post('/login', userController.loginUser.bind(userController));

// ตรวจสอบว่า email ใช้งานได้หรือไม่
router.get('/check-email/:email', userController.checkEmailAvailability.bind(userController));

// ตรวจสอบว่า username ใช้งานได้หรือไม่
router.get('/check-username/:username', userController.checkUsernameAvailability.bind(userController));

// ============================================
// PROTECTED ROUTES - ต้องเข้าสู่ระบบ
// ============================================
router.use(userController.authenticate.bind(userController));

// ============================================
// USER PROFILE MANAGEMENT - จัดการโปรไฟล์
// ============================================

// ดึงข้อมูลผู้ใช้ทั้งหมด (สำหรับหน้าบ้าน)
router.get('/', userController.getAllUsers.bind(userController));

// นับจำนวนผู้ใช้ทั้งหมด
router.get('/count', userController.getUserCount.bind(userController));

// ค้นหาผู้ใช้
router.get('/search/:currentUserId', userController.searchUsers.bind(userController));

// ============================================
// SPECIFIC USER ROUTES - เส้น API สำหรับผู้ใช้เฉพาะ
// ============================================

// ดึงข้อมูลผู้ใช้ตาม ID
router.get('/:userId', userController.getUserById.bind(userController));

// อัปเดตข้อมูลผู้ใช้
router.put('/:userId', 
    userController.authorizeOwner.bind(userController),
    userController.updateUser.bind(userController)
);

// ลบผู้ใช้
router.delete('/:userId', 
    userController.authorizeOwner.bind(userController),
    userController.deleteUser.bind(userController)
);

// ตั้งสถานะออนไลน์
router.put('/:userId/online-status', 
    userController.authorizeOwner.bind(userController),
    userController.setOnlineStatus.bind(userController)
);

// อัปเดต User Preferences
router.put('/:userId/preferences', 
    userController.authorizeOwner.bind(userController),
    userController.updatePreferences.bind(userController)
);

// ============================================
// PARTNER SYSTEM - ระบบคู่รัก
// ============================================

// สร้าง Partner Code
router.post('/:userId/partner-code', 
    userController.authorizeOwner.bind(userController),
    userController.generatePartnerCode.bind(userController)
);

// เชื่อมต่อกับคู่รัก
router.post('/:userId/connect-partner', 
    userController.authorizeOwner.bind(userController),
    userController.connectWithPartner.bind(userController)
);

// ============================================
// ACTIVITY LOGS - ประวัติการใช้งาน
// ============================================

// ดึง Activity Logs
router.get('/:userId/activity-logs', 
    userController.authorizeOwner.bind(userController),
    userController.getActivityLogs.bind(userController)
);

// ============================================
// USER'S POMODORO ROUTES - Pomodoro ของผู้ใช้เฉพาะ
// ============================================

// เริ่มเซสชั่นด่วน
router.post('/:userId/pomodoro/quick-start', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.quickStart.bind(pomodoroController)
);

// สรุปวันนี้
router.get('/:userId/pomodoro/today', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.today.bind(pomodoroController)
);

// เริ่มเซสชั่น Pomodoro ใหม่
router.post('/:userId/pomodoro/start', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.start.bind(pomodoroController)
);

// ดึงเซสชั่นปัจจุบัน
router.get('/:userId/pomodoro/current', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.current.bind(pomodoroController)
);

// ดึงรายการเซสชั่น
router.get('/:userId/pomodoro/list', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.list.bind(pomodoroController)
);

// ดึงสถิติ
router.get('/:userId/pomodoro/stats', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.stats.bind(pomodoroController)
);

// ข้อมูลโปรไฟล์ Pomodoro
router.get('/:userId/pomodoro/profile', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.profile.bind(pomodoroController)
);

// แนวโน้มประสิทธิภาพ
router.get('/:userId/pomodoro/trend', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.trend.bind(pomodoroController)
);

// เซสชั่นที่ดีที่สุด
router.get('/:userId/pomodoro/best', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.best.bind(pomodoroController)
);

// รายงานรายวัน
router.get('/:userId/pomodoro/report/daily', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.dailyReport.bind(pomodoroController)
);

// รายงานรายสัปดาห์
router.get('/:userId/pomodoro/report/weekly', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.weeklyReport.bind(pomodoroController)
);

// ค้นหาเซสชั่น
router.get('/:userId/pomodoro/search', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.search.bind(pomodoroController)
);

// ส่งออกข้อมูล
router.get('/:userId/pomodoro/export', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.export.bind(pomodoroController)
);

// ดึงเซสชั่นตาม ID
router.get('/:userId/pomodoro/:sessionId', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.get.bind(pomodoroController)
);

// แก้ไขเซสชั่น
router.put('/:userId/pomodoro/:sessionId', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.update.bind(pomodoroController)
);

// ลบเซสชั่น
router.delete('/:userId/pomodoro/:sessionId', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.delete.bind(pomodoroController)
);

// เสร็จสิ้นเซสชั่น
router.put('/:userId/pomodoro/:sessionId/complete', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.complete.bind(pomodoroController)
);

// ยกเลิกเซสชั่น
router.delete('/:userId/pomodoro/:sessionId/cancel', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.cancel.bind(pomodoroController)
);

// เพิ่มการขัดจังหวะ
router.post('/:userId/pomodoro/:sessionId/interruption', 
    userController.authorizeOwner.bind(userController),
    pomodoroController.addInterruption.bind(pomodoroController)
);

module.exports = router;
