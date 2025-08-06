// Diary Routes - เส้น API สำหรับไดอารี่คู่รัก
const express = require('express');
const router = express.Router();
const DiaryController = require('../controllers/DiaryController');
const UserController = require('../controllers/UserController');

// สร้าง instances
const diaryController = new DiaryController();
const userController = new UserController();

// ============================================
// MIDDLEWARE - ตรวจสอบการเข้าสู่ระบบ
// ============================================
router.use(userController.authenticate.bind(userController));

// ============================================
// DIARY ENTRIES - จัดการรายการไดอารี่
// ============================================

// ดึงรายการไดอารี่ทั้งหมด
router.get('/', diaryController.list.bind(diaryController));

// สร้างรายการไดอารี่ใหม่
router.post('/', diaryController.create.bind(diaryController));

// ดึงรายการไดอารี่ของผู้ใช้เฉพาะ
router.get('/user/:userId', diaryController.getUserEntries.bind(diaryController));

// ดึงรายการไดอารี่ตาม ID
router.get('/:entryId', diaryController.get.bind(diaryController));

// แก้ไขรายการไดอารี่
router.put('/:entryId', diaryController.update.bind(diaryController));

// ลบรายการไดอารี่
router.delete('/:entryId', diaryController.delete.bind(diaryController));

// ============================================
// DIARY STATISTICS - สถิติไดอารี่
// ============================================

// สถิติรายเดือน
router.get('/stats/monthly', diaryController.monthlyStats.bind(diaryController));

// สถิติรายปี
router.get('/stats/yearly', diaryController.yearlyStats.bind(diaryController));

// ============================================
// DIARY SEARCH & FILTER - ค้นหาและกรอง
// ============================================

// ค้นหาไดอารี่
router.get('/search/:query', diaryController.search.bind(diaryController));

// กรองตามอารมณ์
router.get('/mood/:mood', diaryController.filterByMood.bind(diaryController));

// กรองตามวันที่
router.get('/date/:date', diaryController.filterByDate.bind(diaryController));

module.exports = router;
