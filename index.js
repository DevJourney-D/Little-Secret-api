// Main API Server - Neko U API v2.0 (Clean & Simple Design)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import API Routes
const apiRoutes = require('./routes/api');

// Import UserController for compatibility routes
const UserController = require('./controllers/UserController');
const userController = new UserController();

const app = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// CORS Configuration
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
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://localhost:5173'
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

// Body Parser
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

// ============================================
// ROUTE HANDLERS
// ============================================

// Root Path
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Neko U API! 🐱💕',
        version: '2.0.0',
        documentation: '/api',
        timestamp: new Date().toISOString()
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Neko U API is running! 🐱💕',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Missing',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
            JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Missing'
        }
    });
});

// ============================================
// COMPATIBILITY ROUTES (for frontend)
// ============================================

// Availability check routes
app.get('/api/check/username/:username', userController.checkUsernameAvailability.bind(userController));
app.get('/api/check/email/:email', userController.checkEmailAvailability.bind(userController));

// Alternative auth routes
app.get('/auth/check/username/:username', userController.checkUsernameAvailability.bind(userController));
app.get('/auth/check/email/:email', userController.checkEmailAvailability.bind(userController));
app.post('/auth/register', userController.createUser.bind(userController));
app.post('/auth/login', userController.loginUser.bind(userController));

// ============================================
// MAIN API ROUTES
// ============================================
app.use('/api', apiRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'ไม่พบหน้าที่คุณค้นหา',
        requested_path: req.originalUrl,
        available_endpoints: {
            api_documentation: '/api',
            health_check: '/api/health',
            users: '/api/users',
            diary: '/api/diary',
            chat: '/api/chat',
            todo: '/api/todo',
            math: '/api/math',
            neko: '/api/neko'
        }
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

// ============================================
// SERVER EXPORT (for Vercel)
// ============================================
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

// ============================================
// LOCAL DEVELOPMENT SERVER
// ============================================
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Neko U API Server is running on port ${PORT}`);
        console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
    });
}
