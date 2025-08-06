// Chat Routes - เส้น API สำหรับแชทแบบเรียลไทม์
const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/ChatController');
const UserController = require('../controllers/UserController');

// สร้าง instances
const chatController = new ChatController();
const userController = new UserController();

// ============================================
// MIDDLEWARE - ตรวจสอบการเข้าสู่ระบบ
// ============================================
router.use(userController.authenticate.bind(userController));

// ============================================
// CHAT MESSAGES - จัดการข้อความ
// ============================================

// ดึงประวัติการแชท
router.get('/', chatController.list.bind(chatController));

// ส่งข้อความใหม่
router.post('/', chatController.create.bind(chatController));

// ดึงข้อความตาม ID
router.get('/:messageId', chatController.get.bind(chatController));

// แก้ไขข้อความ
router.put('/:messageId', chatController.update.bind(chatController));

// ลบข้อความ
router.delete('/:messageId', chatController.delete.bind(chatController));

// ============================================
// CHAT FEATURES - ฟีเจอร์แชท
// ============================================

// อ่านข้อความแล้ว
router.put('/:messageId/read', chatController.markAsRead.bind(chatController));

// ดึงข้อความที่ยังไม่ได้อ่าน
router.get('/unread/count', chatController.getUnreadCount.bind(chatController));

// ค้นหาข้อความ
router.get('/search/:query', chatController.search.bind(chatController));

// ============================================
// CHAT STATISTICS - สถิติการแชท
// ============================================

// สถิติการแชทรายวัน
router.get('/stats/daily', chatController.dailyStats.bind(chatController));

// สถิติการแชทรายเดือน
router.get('/stats/monthly', chatController.monthlyStats.bind(chatController));

module.exports = router;
