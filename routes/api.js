// Main API Router - เส้น API หลักที่ออกแบบให้ใช้งานง่าย
const express = require('express');
const router = express.Router();

// Import Route Modules
const userRoutes = require('./users');
const diaryRoutes = require('./diary');
const chatRoutes = require('./chat');
const todoRoutes = require('./todo');
const mathRoutes = require('./math');
const nekoRoutes = require('./neko');

// ============================================
// API HEALTH CHECK - ตรวจสอบสถานะ API
// ============================================
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Neko U API is running! 🐱💕',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            users: '/api/users - จัดการผู้ใช้และโปรไฟล์',
            diary: '/api/diary - ไดอารี่คู่รัก',
            chat: '/api/chat - แชทแบบเรียลไทม์',
            todo: '/api/todo - รายการสิ่งที่ต้องทำ',
            math: '/api/math - เกมคณิตศาสตร์',
            neko: '/api/neko - Neko U AI Assistant'
        }
    });
});

// ============================================
// ROUTE MODULES - โมดูลเส้น API
// ============================================

// User Management (รวม Pomodoro ไว้ด้วย)
router.use('/users', userRoutes);

// Diary Management
router.use('/diary', diaryRoutes);

// Chat Management
router.use('/chat', chatRoutes);

// Todo Management
router.use('/todo', todoRoutes);

// Math Game
router.use('/math', mathRoutes);

// Neko AI Assistant
router.use('/neko', nekoRoutes);

// ============================================
// ERROR HANDLING - จัดการข้อผิดพลาด
// ============================================

// 404 Handler - เส้น API ไม่พบ
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'ไม่พบเส้น API ที่คุณร้องขอ',
        requested_path: req.originalUrl,
        available_endpoints: [
            '/api/users',
            '/api/diary', 
            '/api/chat',
            '/api/todo',
            '/api/math',
            '/api/neko'
        ]
    });
});

module.exports = router;
