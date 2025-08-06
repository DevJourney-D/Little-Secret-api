// Neko Routes - เส้น API สำหรับ Neko U AI Assistant
const express = require('express');
const router = express.Router();
const NekoChatController = require('../controllers/NekoChatController');
const UserController = require('../controllers/UserController');

// สร้าง instances
const nekoController = new NekoChatController();
const userController = new UserController();

// ============================================
// MIDDLEWARE - ตรวจสอบการเข้าสู่ระบบ
// ============================================
router.use(userController.authenticate.bind(userController));

// ============================================
// NEKO CHAT - แชทกับ Neko AI
// ============================================

// ส่งข้อความไปยัง Neko
router.post('/chat', nekoController.sendMessage.bind(nekoController));

// ดึงประวัติการสนทนา
router.get('/chat/history', nekoController.getChatHistory.bind(nekoController));

// ลบประวัติการสนทนา
router.delete('/chat/history', nekoController.clearHistory.bind(nekoController));

// ============================================
// NEKO FEATURES - ฟีเจอร์ Neko AI
// ============================================

// ทักทายเช้า
router.post('/greeting/morning', nekoController.morningGreeting.bind(nekoController));

// ทักทายเย็น
router.post('/greeting/evening', nekoController.eveningGreeting.bind(nekoController));

// คำแนะนำสุ่ม
router.get('/advice/random', nekoController.getRandomAdvice.bind(nekoController));

// คำแนะนำความรัก
router.get('/advice/love', nekoController.getLoveAdvice.bind(nekoController));

// ============================================
// NEKO MOOD & PERSONALITY - อารมณ์และบุคลิกภาพ
// ============================================

// ตั้งค่าบุคลิกภาพ Neko
router.put('/personality', nekoController.setPersonality.bind(nekoController));

// ดึงข้อมูลบุคลิกภาพ
router.get('/personality', nekoController.getPersonality.bind(nekoController));

// อัปเดตอารมณ์ Neko
router.put('/mood', nekoController.updateMood.bind(nekoController));

// ============================================
// NEKO GAMES & ACTIVITIES - เกมและกิจกรรม
// ============================================

// เล่นเกมกับ Neko
router.post('/game/play', nekoController.playGame.bind(nekoController));

// ขอคำทำนาย
router.get('/fortune', nekoController.getFortune.bind(nekoController));

// ขอเรื่องตลก
router.get('/joke', nekoController.getJoke.bind(nekoController));

// ============================================
// NEKO STATISTICS - สถิติการใช้งาน
// ============================================

// สถิติการสนทนา
router.get('/stats/conversations', nekoController.getConversationStats.bind(nekoController));

// เวลาที่ใช้กับ Neko
router.get('/stats/time-spent', nekoController.getTimeSpent.bind(nekoController));

// หัวข้อที่ชอบคุย
router.get('/stats/favorite-topics', nekoController.getFavoriteTopics.bind(nekoController));

module.exports = router;
