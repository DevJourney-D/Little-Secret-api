// Math Routes - เส้น API สำหรับเกมคณิตศาสตร์
const express = require('express');
const router = express.Router();
const MathController = require('../controllers/MathController');
const UserController = require('../controllers/UserController');

// สร้าง instances
const mathController = new MathController();
const userController = new UserController();

// ============================================
// MIDDLEWARE - ตรวจสอบการเข้าสู่ระบบ
// ============================================
router.use(userController.authenticate.bind(userController));

// ============================================
// MATH PROBLEMS - จัดการโจทย์คณิตศาสตร์
// ============================================

// สร้างโจทย์ใหม่
router.post('/generate', mathController.generateProblem.bind(mathController));

// ตรวจคำตอบ
router.post('/check', mathController.checkAnswer.bind(mathController));

// ดึงโจทย์ตาม ID
router.get('/problem/:problemId', mathController.getProblem.bind(mathController));

// ============================================
// MATH GAMES - เกมคณิตศาสตร์
// ============================================

// เริ่มเกมใหม่
router.post('/game/start', mathController.startGame.bind(mathController));

// ส่งคำตอบในเกม
router.post('/game/:gameId/answer', mathController.submitAnswer.bind(mathController));

// จบเกม
router.put('/game/:gameId/finish', mathController.finishGame.bind(mathController));

// ดึงข้อมูลเกม
router.get('/game/:gameId', mathController.getGame.bind(mathController));

// ============================================
// MATH LEVELS - ระดับความยาก
// ============================================

// ดึงโจทย์ง่าย
router.get('/level/easy', mathController.getEasyProblems.bind(mathController));

// ดึงโจทย์ปานกลาง
router.get('/level/medium', mathController.getMediumProblems.bind(mathController));

// ดึงโจทย์ยาก
router.get('/level/hard', mathController.getHardProblems.bind(mathController));

// ============================================
// MATH STATISTICS - สถิติการเล่น
// ============================================

// สถิติส่วนตัว
router.get('/stats/personal', mathController.getPersonalStats.bind(mathController));

// ประวัติการเล่น
router.get('/history', mathController.getGameHistory.bind(mathController));

// คะแนนสูงสุด
router.get('/leaderboard', mathController.getLeaderboard.bind(mathController));

// ความก้าวหน้า
router.get('/progress', mathController.getProgress.bind(mathController));

module.exports = router;
