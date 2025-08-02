// Main API Routes Configuration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import Controllers
const UserController = require('../controllers/UserController');
const DiaryController = require('../controllers/DiaryController');
const ChatController = require('../controllers/ChatController');
const TodoController = require('../controllers/TodoController');
const PomodoroController = require('../controllers/PomodoroController');
const MathController = require('../controllers/MathController');
const NekoChatController = require('../controllers/NekoChatController');

// Initialize Controllers
const userController = new UserController();
const diaryController = new DiaryController();
const chatController = new ChatController();
const todoController = new TodoController();
const pomodoroController = new PomodoroController();
const mathController = new MathController();
const nekoChatController = new NekoChatController();

const app = express();

// Middleware Configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'https://little-secret.vercel.app',
            'https://neko-u.vercel.app', 
            'https://our-little-secret-app.vercel.app',
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'http://127.0.0.1:8080',
            'http://localhost:8080'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Neko U API is running! 🐱💕',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ===============================
// USER ROUTES
// ===============================
const userRouter = express.Router();

// Public routes (no authentication required)
userRouter.post('/', userController.createUser.bind(userController));
userRouter.post('/login', userController.loginUser.bind(userController));
userRouter.get('/email/:email', userController.getUserByEmail.bind(userController));
userRouter.get('/username/:username', userController.getUserByUsername.bind(userController));

// Authentication middleware for protected routes
userRouter.use('/:userId/*', userController.authenticate.bind(userController));
userRouter.use('/:userId/*', userController.authorizeOwner.bind(userController));

// Protected user management
userRouter.get('/:userId', userController.getUserById.bind(userController));
userRouter.put('/:userId', userController.updateUser.bind(userController));
userRouter.delete('/:userId', userController.deleteUser.bind(userController));

// User status and preferences
userRouter.patch('/:userId/status', userController.setOnlineStatus.bind(userController));
userRouter.put('/:userId/preferences', userController.updatePreferences.bind(userController));

// Partner connection
userRouter.post('/:userId/generate-partner-code', userController.generatePartnerCode.bind(userController));
userRouter.post('/:userId/connect-partner', userController.connectWithPartner.bind(userController));

// User search and activity
userRouter.get('/:currentUserId/search', userController.searchUsers.bind(userController));
userRouter.get('/:userId/activity-logs', userController.getActivityLogs.bind(userController));

app.use('/api/users', userRouter);

// ===============================
// DIARY ROUTES
// ===============================
const diaryRouter = express.Router();

// Authentication middleware
diaryRouter.use('/:userId/*', userController.authenticate.bind(userController));
diaryRouter.use('/:userId/*', userController.authorizeOwner.bind(userController));

// Diary CRUD
diaryRouter.post('/:userId/diaries', diaryController.createDiary.bind(diaryController));
diaryRouter.get('/:userId/diaries', diaryController.getUserDiaries.bind(diaryController));
diaryRouter.get('/:userId/diaries/shared', diaryController.getSharedDiaries.bind(diaryController));
diaryRouter.get('/:userId/diaries/recent', diaryController.getRecentDiaries.bind(diaryController));
diaryRouter.get('/:userId/diaries/stats', diaryController.getDiaryStats.bind(diaryController));
diaryRouter.get('/:userId/diaries/export', diaryController.exportDiaries.bind(diaryController));

diaryRouter.get('/:userId/diaries/:diaryId', diaryController.getDiaryById.bind(diaryController));
diaryRouter.put('/:userId/diaries/:diaryId', diaryController.updateDiary.bind(diaryController));
diaryRouter.delete('/:userId/diaries/:diaryId', diaryController.deleteDiary.bind(diaryController));

// Diary interactions
diaryRouter.post('/:userId/diaries/:diaryId/reaction', diaryController.addReaction.bind(diaryController));

// Diary filtering
diaryRouter.get('/:userId/diaries/category/:category', diaryController.getDiariesByCategory.bind(diaryController));
diaryRouter.get('/:userId/diaries/mood/:mood', diaryController.getDiariesByMood.bind(diaryController));

// Diary search
diaryRouter.get('/:userId/diaries/search', diaryController.searchDiaries.bind(diaryController));

app.use('/api', diaryRouter);

// ===============================
// CHAT ROUTES
// ===============================
const chatRouter = express.Router();

// Authentication middleware
chatRouter.use('/:userId/*', userController.authenticate.bind(userController));
chatRouter.use('/:userId/*', userController.authorizeOwner.bind(userController));

// Chat messaging
chatRouter.post('/:userId/messages', chatController.sendMessage.bind(chatController));
chatRouter.get('/:userId/messages/latest', chatController.getLatestMessages.bind(chatController));
chatRouter.get('/:userId/messages/unread-count', chatController.getUnreadCount.bind(chatController));
chatRouter.get('/:userId/messages/stats', chatController.getChatStats.bind(chatController));
chatRouter.get('/:userId/messages/media', chatController.getChatMedia.bind(chatController));
chatRouter.get('/:userId/messages/export', chatController.exportMessages.bind(chatController));
chatRouter.get('/:userId/messages/summary', chatController.getConversationSummary.bind(chatController));

chatRouter.get('/:userId/messages/:partnerId', chatController.getMessages.bind(chatController));

chatRouter.put('/:userId/messages/:messageId', chatController.updateMessage.bind(chatController));
chatRouter.delete('/:userId/messages/:messageId', chatController.deleteMessage.bind(chatController));

// Message interactions
chatRouter.post('/:userId/messages/mark-read', chatController.markAsRead.bind(chatController));
chatRouter.post('/:userId/messages/:messageId/reaction', chatController.addReaction.bind(chatController));
chatRouter.delete('/:userId/messages/:messageId/reaction', chatController.removeReaction.bind(chatController));

// Chat search
chatRouter.get('/:userId/messages/search', chatController.searchMessages.bind(chatController));

app.use('/api', chatRouter);

// ===============================
// TODO ROUTES
// ===============================
const todoRouter = express.Router();

// Authentication middleware
todoRouter.use('/:userId/*', userController.authenticate.bind(userController));
todoRouter.use('/:userId/*', userController.authorizeOwner.bind(userController));

// Todo CRUD
todoRouter.post('/:userId/todos', todoController.createTodo.bind(todoController));
todoRouter.get('/:userId/todos', todoController.getUserTodos.bind(todoController));
todoRouter.get('/:userId/todos/shared', todoController.getSharedTodos.bind(todoController));
todoRouter.get('/:userId/todos/upcoming', todoController.getUpcomingTodos.bind(todoController));
todoRouter.get('/:userId/todos/stats', todoController.getTodoStats.bind(todoController));
todoRouter.get('/:userId/todos/reminders', todoController.getTodosWithReminders.bind(todoController));
todoRouter.get('/:userId/todos/summary', todoController.getTodoSummary.bind(todoController));
todoRouter.get('/:userId/todos/export', todoController.exportTodos.bind(todoController));

todoRouter.get('/:userId/todos/:todoId', todoController.getTodoById.bind(todoController));
todoRouter.put('/:userId/todos/:todoId', todoController.updateTodo.bind(todoController));
todoRouter.delete('/:userId/todos/:todoId', todoController.deleteTodo.bind(todoController));

// Todo actions
todoRouter.patch('/:userId/todos/:todoId/toggle', todoController.toggleCompleted.bind(todoController));

// Todo filtering
todoRouter.get('/:userId/todos/category/:category', todoController.getTodosByCategory.bind(todoController));
todoRouter.get('/:userId/todos/priority/:priority', todoController.getTodosByPriority.bind(todoController));
todoRouter.get('/:userId/todos/status/:status', todoController.getTodosByStatus.bind(todoController));

// Todo search
todoRouter.get('/:userId/todos/search', todoController.searchTodos.bind(todoController));

app.use('/api', todoRouter);

// ===============================
// POMODORO ROUTES
// ===============================
const pomodoroRouter = express.Router();

// Authentication middleware
pomodoroRouter.use('/:userId/*', userController.authenticate.bind(userController));
pomodoroRouter.use('/:userId/*', userController.authorizeOwner.bind(userController));

// Pomodoro session management
pomodoroRouter.post('/:userId/pomodoro/start', pomodoroController.startSession.bind(pomodoroController));
pomodoroRouter.get('/:userId/pomodoro/current', pomodoroController.getCurrentSession.bind(pomodoroController));
pomodoroRouter.get('/:userId/pomodoro/history', pomodoroController.getSessionHistory.bind(pomodoroController));
pomodoroRouter.get('/:userId/pomodoro/stats', pomodoroController.getPomodoroStats.bind(pomodoroController));
pomodoroRouter.get('/:userId/pomodoro/trend', pomodoroController.getProductivityTrend.bind(pomodoroController));
pomodoroRouter.get('/:userId/pomodoro/best', pomodoroController.getBestSessions.bind(pomodoroController));
pomodoroRouter.get('/:userId/pomodoro/summary', pomodoroController.getPomodoroSummary.bind(pomodoroController));
pomodoroRouter.get('/:userId/pomodoro/export', pomodoroController.exportSessions.bind(pomodoroController));

pomodoroRouter.post('/:userId/pomodoro/:sessionId/complete', pomodoroController.completeSession.bind(pomodoroController));
pomodoroRouter.delete('/:userId/pomodoro/:sessionId/cancel', pomodoroController.cancelSession.bind(pomodoroController));
pomodoroRouter.put('/:userId/pomodoro/:sessionId', pomodoroController.updateSession.bind(pomodoroController));
pomodoroRouter.post('/:userId/pomodoro/:sessionId/interrupt', pomodoroController.addInterruption.bind(pomodoroController));

// Pomodoro filtering
pomodoroRouter.get('/:userId/pomodoro/type/:sessionType', pomodoroController.getSessionsByType.bind(pomodoroController));

// Pomodoro search
pomodoroRouter.get('/:userId/pomodoro/search', pomodoroController.searchSessions.bind(pomodoroController));

// Pomodoro presets
pomodoroRouter.post('/:userId/pomodoro/presets', pomodoroController.createPreset.bind(pomodoroController));

app.use('/api', pomodoroRouter);

// ===============================
// MATH ROUTES
// ===============================
const mathRouter = express.Router();

// Authentication middleware
mathRouter.use('/:userId/*', userController.authenticate.bind(userController));
mathRouter.use('/:userId/*', userController.authorizeOwner.bind(userController));

// Math problem generation and solving
mathRouter.post('/:userId/math/generate', mathController.generateProblem.bind(mathController));
mathRouter.post('/:userId/math/submit', mathController.submitAnswer.bind(mathController));
mathRouter.get('/:userId/math/history', mathController.getMathHistory.bind(mathController));
mathRouter.get('/:userId/math/stats', mathController.getMathStats.bind(mathController));
mathRouter.post('/:userId/math/review', mathController.generateReviewProblems.bind(mathController));
mathRouter.get('/:userId/math/incorrect', mathController.getIncorrectProblems.bind(mathController));
mathRouter.get('/:userId/math/trend', mathController.getLearningTrend.bind(mathController));
mathRouter.delete('/:userId/math/history', mathController.deleteMathHistory.bind(mathController));

app.use('/api', mathRouter);

// ===============================
// NEKO CHAT ROUTES
// ===============================
const nekoRouter = express.Router();

// Authentication middleware
nekoRouter.use('/:userId/*', userController.authenticate.bind(userController));
nekoRouter.use('/:userId/*', userController.authorizeOwner.bind(userController));

// Neko chat functionality
nekoRouter.post('/:userId/neko/chat', nekoChatController.chatWithNeko.bind(nekoChatController));
nekoRouter.get('/:userId/neko/conversations', nekoChatController.getConversationHistory.bind(nekoChatController));
nekoRouter.get('/:userId/neko/stats', nekoChatController.getConversationStats.bind(nekoChatController));
nekoRouter.get('/:userId/neko/advice', nekoChatController.getDailyAdvice.bind(nekoChatController));
nekoRouter.get('/:userId/neko/greeting', nekoChatController.getMorningGreeting.bind(nekoChatController));
nekoRouter.delete('/:userId/neko/conversation/:conversationId', nekoChatController.deleteConversation.bind(nekoChatController));
nekoRouter.delete('/:userId/neko/conversations', nekoChatController.clearAllConversations.bind(nekoChatController));
nekoRouter.put('/:userId/neko/mode', nekoChatController.updateNekoMode.bind(nekoChatController));

app.use('/api', nekoRouter);

// ===============================
// DASHBOARD ROUTES
// ===============================
const dashboardRouter = express.Router();

// Authentication middleware
dashboardRouter.use('/:userId/*', userController.authenticate.bind(userController));
dashboardRouter.use('/:userId/*', userController.authorizeOwner.bind(userController));

// Dashboard summary endpoint
dashboardRouter.get('/:userId/dashboard', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get all dashboard data in parallel
        const [
            userResult,
            diaryStatsResult,
            todoSummaryResult,
            pomodoroSummaryResult,
            chatStatsResult
        ] = await Promise.all([
            userController.userService.getUserById(userId),
            diaryController.diaryService.getDiaryStats(userId),
            todoController.todoService.getTodoStats(userId),
            pomodoroController.pomodoroService.getPomodoroStats(userId, 'week'),
            chatController.chatService.getChatStats(userId)
        ]);

        const dashboardData = {
            user: userResult.success ? userResult.data : null,
            stats: {
                diary: diaryStatsResult.success ? diaryStatsResult.data : {},
                todo: todoSummaryResult.success ? todoSummaryResult.data : {},
                pomodoro: pomodoroSummaryResult.success ? pomodoroSummaryResult.data : {},
                chat: chatStatsResult.success ? chatStatsResult.data : {}
            },
            last_updated: new Date().toISOString()
        };

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard',
            error: error.message
        });
    }
});

app.use('/api', dashboardRouter);

// ===============================
// ERROR HANDLING
// ===============================

// 404 Handler
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.path
    });
});

// Global Error Handler
app.use((error, req, res, next) => {
    console.error('Global Error:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// For Vercel serverless functions
module.exports = app;

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Neko U API Server is running on port ${PORT}`);
        console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
    });
}
