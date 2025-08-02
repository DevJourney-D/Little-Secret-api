// Authentication Middleware
const jwt = require('jsonwebtoken');
const supabaseService = require('../config/supabase');

class AuthMiddleware {
    // Verify JWT token from request headers
    async verifyToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Access token required',
                    code: 'MISSING_TOKEN'
                });
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix

            // Verify token with Supabase
            const user = await supabaseService.verifyToken(token);
            
            if (!user) {
                return res.status(401).json({
                    error: 'Invalid or expired token',
                    code: 'INVALID_TOKEN'
                });
            }

            // Get full user profile from database
            const userProfile = await supabaseService.getUserById(user.id);
            
            if (!userProfile) {
                return res.status(401).json({
                    error: 'User profile not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Add user info to request object
            req.user = userProfile;
            req.token = token;
            
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(401).json({
                error: 'Authentication failed',
                code: 'AUTH_FAILED',
                message: error.message
            });
        }
    }

    // Verify token for Socket.IO connections
    async verifySocketToken(token) {
        try {
            const user = await supabaseService.verifyToken(token);
            if (!user) {
                throw new Error('Invalid token');
            }

            const userProfile = await supabaseService.getUserById(user.id);
            if (!userProfile) {
                throw new Error('User profile not found');
            }

            return userProfile;
        } catch (error) {
            throw new Error(`Socket authentication failed: ${error.message}`);
        }
    }

    // Optional authentication (for public endpoints that benefit from user context)
    async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const user = await supabaseService.verifyToken(token);
                
                if (user) {
                    const userProfile = await supabaseService.getUserById(user.id);
                    req.user = userProfile;
                    req.token = token;
                }
            }
            
            next();
        } catch (error) {
            // Don't fail on optional auth errors, just continue without user
            console.warn('Optional auth warning:', error.message);
            next();
        }
    }

    // Check if user has partner
    async requirePartner(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            if (!req.user.partner_id) {
                return res.status(403).json({
                    error: 'Partner connection required for this action',
                    code: 'PARTNER_REQUIRED'
                });
            }

            next();
        } catch (error) {
            console.error('Partner check error:', error);
            return res.status(500).json({
                error: 'Partner verification failed',
                code: 'PARTNER_CHECK_FAILED'
            });
        }
    }

    // Admin role check (for future admin features)
    async requireAdmin(req, res, next) {
        try {
            if (!req.user || !req.user.is_admin) {
                return res.status(403).json({
                    error: 'Admin access required',
                    code: 'ADMIN_REQUIRED'
                });
            }
            next();
        } catch (error) {
            console.error('Admin check error:', error);
            return res.status(500).json({
                error: 'Admin verification failed',
                code: 'ADMIN_CHECK_FAILED'
            });
        }
    }

    // Rate limiting for sensitive operations
    createRateLimit(maxRequests = 5, windowMs = 15 * 60 * 1000) {
        const attempts = new Map();

        return (req, res, next) => {
            const key = req.user ? req.user.id : req.ip;
            const now = Date.now();
            const windowStart = now - windowMs;

            // Clean old attempts
            if (attempts.has(key)) {
                const userAttempts = attempts.get(key).filter(time => time > windowStart);
                attempts.set(key, userAttempts);
            }

            const currentAttempts = attempts.get(key) || [];

            if (currentAttempts.length >= maxRequests) {
                return res.status(429).json({
                    error: 'Too many requests',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil((currentAttempts[0] + windowMs - now) / 1000)
                });
            }

            currentAttempts.push(now);
            attempts.set(key, currentAttempts);
            next();
        };
    }
}

module.exports = new AuthMiddleware();
