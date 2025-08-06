// Todo Routes - เส้น API สำหรับรายการสิ่งที่ต้องทำ
const express = require('express');
const router = express.Router();
const TodoController = require('../controllers/TodoController');
const UserController = require('../controllers/UserController');

// สร้าง instances
const todoController = new TodoController();
const userController = new UserController();

// ============================================
// MIDDLEWARE - ตรวจสอบการเข้าสู่ระบบ
// ============================================
router.use(userController.authenticate.bind(userController));

// ============================================
// TODO ITEMS - จัดการรายการงาน
// ============================================

// ดึงรายการงานทั้งหมด
router.get('/', todoController.list.bind(todoController));

// สร้างงานใหม่
router.post('/', todoController.create.bind(todoController));

// ดึงงานตาม ID
router.get('/:todoId', todoController.get.bind(todoController));

// แก้ไขงาน
router.put('/:todoId', todoController.update.bind(todoController));

// ลบงาน
router.delete('/:todoId', todoController.delete.bind(todoController));

// ============================================
// TODO STATUS - จัดการสถานะงาน
// ============================================

// ทำเครื่องหมายว่าเสร็จแล้ว
router.put('/:todoId/complete', todoController.markComplete.bind(todoController));

// ทำเครื่องหมายว่ายังไม่เสร็จ
router.put('/:todoId/incomplete', todoController.markIncomplete.bind(todoController));

// สลับสถานะ
router.put('/:todoId/toggle', todoController.toggleStatus.bind(todoController));

// ============================================
// TODO FILTERING - กรองและค้นหา
// ============================================

// ดึงงานที่เสร็จแล้ว
router.get('/status/completed', todoController.getCompleted.bind(todoController));

// ดึงงานที่ยังไม่เสร็จ
router.get('/status/pending', todoController.getPending.bind(todoController));

// ดึงงานที่มีความสำคัญสูง
router.get('/priority/high', todoController.getHighPriority.bind(todoController));

// ดึงงานที่ครบกำหนดวันนี้
router.get('/due/today', todoController.getDueToday.bind(todoController));

// ค้นหางาน
router.get('/search/:query', todoController.search.bind(todoController));

// ============================================
// TODO STATISTICS - สถิติงาน
// ============================================

// สถิติการทำงานรายวัน
router.get('/stats/daily', todoController.dailyStats.bind(todoController));

// สถิติการทำงานรายสัปดาห์
router.get('/stats/weekly', todoController.weeklyStats.bind(todoController));

// สถิติประสิทธิภาพ
router.get('/stats/productivity', todoController.productivityStats.bind(todoController));

module.exports = router;
