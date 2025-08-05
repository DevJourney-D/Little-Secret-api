// Main API Routes Configuration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import ID Validation Middleware
const { validateID, validateMultipleIDs } = require('./middleware/idValidation');

// Import Controllers
const UserController = require('./controllers/UserController');
const DiaryController = require('./controllers/DiaryController');
const ChatController = require('./controllers/ChatController');
const TodoController = require('./controllers/TodoController');
const PomodoroController = require('./controllers/PomodoroController');
const MathController = require('./controllers/MathController');
const NekoChatController = require('./controllers/NekoChatController');

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
        version: '1.0.0',
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Missing',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
            JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Missing'
        }
    });
});

// ===============================
// AVAILABILITY CHECK ROUTES (Before other routes to avoid middleware conflicts)
// ===============================
app.get('/api/check/username/:username', userController.checkUsernameAvailability.bind(userController));
app.get('/api/check/email/:email', userController.checkEmailAvailability.bind(userController));

// Test endpoint
app.get('/api/test-connection', async (req, res) => {
    try {
        console.log('Testing basic HTTP connection to Supabase...');
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !apiKey) {
            return res.json({
                success: false,
                message: 'Missing environment variables',
                url_set: !!supabaseUrl,
                key_set: !!apiKey
            });
        }
        
        // ทดสอบด้วย native fetch แทน Supabase client
        const response = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const data = await response.text();
        console.log('Response data:', data);
        
        res.json({
            success: true,
            message: 'Direct HTTP test to Supabase',
            status: response.status,
            status_text: response.statusText,
            headers: Object.fromEntries(response.headers),
            data_preview: data.substring(0, 200),
            connection_status: response.ok ? 'Success' : 'Failed'
        });
        
    } catch (error) {
        console.error('Connection test error:', error);
        res.json({
            success: false,
            message: 'Direct HTTP connection failed',
            error: {
                message: error.message,
                name: error.name,
                cause: error.cause
            }
        });
    }
});

// Test PostgreSQL direct connection with users table
app.get('/api/test-users-table', async (req, res) => {
    try {
        const { Client } = require('pg');
        
        // Parse the connection string you provided
        const connectionString = 'postgresql://postgres.cnvrikxkxrdeuofbbwkk:062191Komkem@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
        
        const client = new Client({
            connectionString: connectionString
        });
        
        await client.connect();
        console.log('PostgreSQL connected successfully');
        
        // Test if users table exists and has the right structure
        const tableCheck = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        `);
        
        // Count existing users
        const userCount = await client.query('SELECT COUNT(*) as count FROM users');
        
        await client.end();
        
        res.json({
            success: true,
            message: 'Users table test successful',
            table_exists: tableCheck.rows.length > 0,
            columns: tableCheck.rows,
            user_count: parseInt(userCount.rows[0].count),
            has_password_column: tableCheck.rows.some(col => col.column_name === 'password')
        });
        
    } catch (error) {
        console.error('Users table test error:', error);
        res.json({
            success: false,
            message: 'Users table test failed',
            error: {
                message: error.message,
                name: error.name,
                code: error.code
            }
        });
    }
});

// Test direct user creation via PostgreSQL
app.post('/api/test-create-user-direct', async (req, res) => {
    try {
        const { Client } = require('pg');
        const bcrypt = require('bcrypt');
        
        const { username, email, password, displayName } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email และ password จำเป็น'
            });
        }
        
        const connectionString = 'postgresql://postgres.cnvrikxkxrdeuofbbwkk:062191Komkem@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
        
        const client = new Client({
            connectionString: connectionString
        });
        
        await client.connect();
        console.log('Connected to create user');
        
        // Hash password (ไม่ต้องสร้าง UUID เพราะใช้ auto-increment)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log('Creating user with auto-increment ID');
        
        // Insert user (ไม่ใส่ id เพื่อให้ auto-increment ทำงาน)
        const insertQuery = `
            INSERT INTO users (
                email, username, password, first_name, last_name, 
                display_name, timezone, language, status, email_verified, is_online,
                theme_preference, notification_settings, privacy_settings, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
            RETURNING id, email, username, display_name, created_at;
        `;
        
        const values = [
            email,
            username,
            hashedPassword,
            displayName?.split(' ')[0] || username,
            displayName?.split(' ')[1] || '',
            displayName || username,
            'Asia/Bangkok',
            'th',
            'active',
            false,
            false,
            'default',
            JSON.stringify({ chat: true, push: true, diary: true, email: true }),
            JSON.stringify({ diary_default: "shared", last_seen_visible: true, profile_visibility: "partner" })
        ];
        
        const result = await client.query(insertQuery, values);
        
        await client.end();
        
        console.log('User created successfully:', result.rows[0]);
        
        res.json({
            success: true,
            message: 'User created successfully via direct PostgreSQL',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Direct user creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Direct user creation failed',
            error: {
                message: error.message,
                name: error.name,
                code: error.code,
                detail: error.detail
            }
        });
    }
});

// Test direct user login via PostgreSQL
app.post('/api/test-login-direct', async (req, res) => {
    try {
        const { Client } = require('pg');
        const bcrypt = require('bcrypt');
        const jwt = require('jsonwebtoken');
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username และ password จำเป็น'
            });
        }

        
        
        const connectionString = 'postgresql://postgres.cnvrikxkxrdeuofbbwkk:062191Komkem@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
        
        const client = new Client({
            connectionString: connectionString
        });
        
        await client.connect();
        console.log('Connected to login user');
        
        // ค้นหาผู้ใช้
        const userQuery = `
            SELECT id, email, username, password, display_name, created_at
            FROM users 
            WHERE username = $1
        `;
        
        const userResult = await client.query(userQuery, [username]);
        
        if (userResult.rows.length === 0) {
            await client.end();
            return res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }
        
        const user = userResult.rows[0];
        
        // ตรวจสอบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            await client.end();
            return res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }
        
        // สร้าง JWT Token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                email: user.email 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        await client.end();
        
        // ลบรหัสผ่านออกจาก response
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            message: 'Login successful via direct PostgreSQL',
            data: {
                user: userWithoutPassword,
                token,
                login_time: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Direct login error:', error);
        res.status(500).json({
            success: false,
            message: 'Direct login failed',
            error: {
                message: error.message,
                name: error.name,
                code: error.code
            }
        });
    }
});

// ===============================
// USER ROUTES
// ===============================
const userRouter = express.Router();

// Public routes (no authentication required)
userRouter.post('/', userController.createUser.bind(userController));
userRouter.post('/login', userController.loginUser.bind(userController));

// Check availability routes (must be before the general email/username routes)
userRouter.get('/availability/email/:email', userController.checkEmailAvailability.bind(userController));
userRouter.get('/availability/username/:username', userController.checkUsernameAvailability.bind(userController));

// General user lookup routes
userRouter.get('/email/:email', userController.getUserByEmail.bind(userController));
userRouter.get('/username/:username', userController.getUserByUsername.bind(userController));

// Authentication middleware for protected routes (only apply to numeric userId)
userRouter.use('/:userId(\\d+)/*', validateID('userId'), userController.authenticate.bind(userController));
userRouter.use('/:userId(\\d+)/*', userController.authorizeOwner.bind(userController));

// Protected user management (with numeric userId)
userRouter.get('/:userId(\\d+)', userController.getUserById.bind(userController));
userRouter.put('/:userId(\\d+)', userController.updateUser.bind(userController));
userRouter.delete('/:userId(\\d+)', userController.deleteUser.bind(userController));

// User status and preferences
userRouter.patch('/:userId(\\d+)/status', userController.setOnlineStatus.bind(userController));
userRouter.put('/:userId(\\d+)/preferences', userController.updatePreferences.bind(userController));

// Partner connection
userRouter.post('/:userId(\\d+)/generate-partner-code', userController.generatePartnerCode.bind(userController));
userRouter.post('/:userId(\\d+)/connect-partner', userController.connectWithPartner.bind(userController));

// User search and activity
userRouter.get('/:currentUserId(\\d+)/search', userController.searchUsers.bind(userController));
userRouter.get('/:userId(\\d+)/activity-logs', userController.getActivityLogs.bind(userController));

app.use('/api/users', userRouter);

// ===============================
// DIARY ROUTES
// ===============================
const diaryRouter = express.Router();

// Authentication middleware
diaryRouter.use('/:userId/*', validateID('userId'), userController.authenticate.bind(userController));
diaryRouter.use('/:userId/*', userController.authorizeOwner.bind(userController));

// Diary CRUD
diaryRouter.post('/:userId/diaries', diaryController.createDiary.bind(diaryController));
diaryRouter.get('/:userId/diaries', diaryController.getUserDiaries.bind(diaryController));
diaryRouter.get('/:userId/diaries/shared', diaryController.getSharedDiaries.bind(diaryController));
diaryRouter.get('/:userId/diaries/recent', diaryController.getRecentDiaries.bind(diaryController));
diaryRouter.get('/:userId/diaries/stats', diaryController.getDiaryStats.bind(diaryController));
diaryRouter.get('/:userId/diaries/export', diaryController.exportDiaries.bind(diaryController));

diaryRouter.get('/:userId/diaries/:diaryId', validateID('diaryId'), diaryController.getDiaryById.bind(diaryController));
diaryRouter.put('/:userId/diaries/:diaryId', validateID('diaryId'), diaryController.updateDiary.bind(diaryController));
diaryRouter.delete('/:userId/diaries/:diaryId', validateID('diaryId'), diaryController.deleteDiary.bind(diaryController));

// Diary interactions
diaryRouter.post('/:userId/diaries/:diaryId/reaction', validateID('diaryId'), diaryController.addReaction.bind(diaryController));

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
    console.error('Error Stack:', error.stack);

    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        error_details: error.toString(),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// For Vercel serverless functions
module.exports = (req, res) => {
    try {
        // Set CORS headers for all requests
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        
        console.log(`📝 ${req.method} ${req.url}`);
        
        // Process request through Express app
        return app(req, res);
    } catch (error) {
        console.error('Handler Error:', error);
        res.status(500).json({
            success: false,
            message: 'Handler Error: ' + error.message,
            error: error.toString()
        });
    }
};

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Neko U API Server is running on port ${PORT}`);
        console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
    });
}
