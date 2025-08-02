// Global Error Handler Middleware
class ErrorHandler {
    handle(error, req, res, next) {
        console.error('💥 Global Error Handler:', {
            message: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });

        // Supabase errors
        if (error.code && error.code.startsWith('PGRST')) {
            return this.handleSupabaseError(error, req, res);
        }

        // JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        // Validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: error.details
            });
        }

        // Multer (file upload) errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: 'File too large',
                code: 'FILE_TOO_LARGE',
                maxSize: process.env.MAX_FILE_SIZE || '10MB'
            });
        }

        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected file field',
                code: 'UNEXPECTED_FILE'
            });
        }

        // Database connection errors
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'Database connection failed',
                code: 'DB_CONNECTION_ERROR'
            });
        }

        // Default error response
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        return res.status(error.statusCode || 500).json({
            error: error.message || 'Internal server error',
            code: error.code || 'INTERNAL_ERROR',
            ...(isDevelopment && { 
                stack: error.stack,
                details: error.details 
            })
        });
    }

    handleSupabaseError(error, req, res) {
        console.error('🔴 Supabase Error:', error);

        // Map Supabase error codes to HTTP status codes
        const errorMappings = {
            'PGRST116': { status: 404, message: 'Resource not found' },
            'PGRST204': { status: 400, message: 'Invalid request format' },
            'PGRST103': { status: 403, message: 'Access denied' },
            '23505': { status: 409, message: 'Resource already exists' }, // Unique constraint violation
            '23503': { status: 400, message: 'Referenced resource not found' }, // Foreign key violation
            '23502': { status: 400, message: 'Required field missing' }, // Not null violation
        };

        const mapping = errorMappings[error.code] || { 
            status: 500, 
            message: 'Database operation failed' 
        };

        return res.status(mapping.status).json({
            error: mapping.message,
            code: error.code,
            details: error.details || error.hint
        });
    }

    // 404 handler for undefined routes
    notFound(req, res) {
        res.status(404).json({
            error: 'Route not found',
            code: 'ROUTE_NOT_FOUND',
            path: req.originalUrl,
            method: req.method
        });
    }

    // Async error wrapper
    asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    // Custom error creation
    createError(message, statusCode = 500, code = 'CUSTOM_ERROR', details = null) {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.code = code;
        error.details = details;
        return error;
    }
}

module.exports = new ErrorHandler();
