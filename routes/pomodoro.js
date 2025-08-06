// Pomodoro Routes - เส้น API ที่ออกแบบให้ใช้งานง่าย
const express = require('express');
const router = express.Router();
const PomodoroController = require('../controllers/PomodoroController');
const UserController = require('../controllers/UserController');

// สร้าง instances
const pomodoroController = new PomodoroController();
const userController = new UserController();

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
router.use(userController.authenticate.bind(userController));

// ============================================
// QUICK ACTIONS - การใช้งานด่วน
// ============================================

// เริ่มเซสชั่นด่วน (ใช้ค่าเริ่มต้น)
router.post('/quick-start', pomodoroController.quickStart.bind(pomodoroController));

// สรุปวันนี้
router.get('/today', pomodoroController.today.bind(pomodoroController));

// ============================================
// BASIC OPERATIONS - การใช้งานพื้นฐาน
// ============================================

// เริ่มเซสชั่น Pomodoro ใหม่
router.post('/start', pomodoroController.start.bind(pomodoroController));

// ดึงเซสชั่นปัจจุบัน
router.get('/current', pomodoroController.current.bind(pomodoroController));

// ดึงรายการเซสชั่น
router.get('/list', pomodoroController.list.bind(pomodoroController));

// ============================================
// SESSION MANAGEMENT - จัดการเซสชั่นตาม ID
// ============================================

// ดึงเซสชั่นตาม ID
router.get('/:sessionId', pomodoroController.get.bind(pomodoroController));

// แก้ไขเซสชั่น
router.put('/:sessionId', pomodoroController.update.bind(pomodoroController));

// ลบเซสชั่น
router.delete('/:sessionId', pomodoroController.delete.bind(pomodoroController));

// เสร็จสิ้นเซสชั่น
router.put('/:sessionId/complete', pomodoroController.complete.bind(pomodoroController));

// ยกเลิกเซสชั่น
router.delete('/:sessionId/cancel', pomodoroController.cancel.bind(pomodoroController));

// เพิ่มการขัดจังหวะ
router.post('/:sessionId/interruption', pomodoroController.addInterruption.bind(pomodoroController));

// ============================================
// STATISTICS & ANALYTICS - สถิติและการวิเคราะห์
// ============================================

// ดึงสถิติ
router.get('/stats', pomodoroController.stats.bind(pomodoroController));

// ข้อมูลโปรไฟล์ Pomodoro
router.get('/profile', pomodoroController.profile.bind(pomodoroController));

// แนวโน้มประสิทธิภาพ
router.get('/trend', pomodoroController.trend.bind(pomodoroController));

// เซสชั่นที่ดีที่สุด
router.get('/best', pomodoroController.best.bind(pomodoroController));

// ============================================
// REPORTS - รายงาน
// ============================================

// รายงานรายวัน
router.get('/report/daily', pomodoroController.dailyReport.bind(pomodoroController));

// รายงานรายสัปดาห์
router.get('/report/weekly', pomodoroController.weeklyReport.bind(pomodoroController));

// ============================================
// ADVANCED FEATURES - ฟีเจอร์ขั้นสูง
// ============================================

// ค้นหาเซสชั่น
router.get('/search', pomodoroController.search.bind(pomodoroController));

// ส่งออกข้อมูล
router.get('/export', pomodoroController.export.bind(pomodoroController));

module.exports = router;
