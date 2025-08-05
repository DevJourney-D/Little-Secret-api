// Validation Middleware using Joi
const Joi = require('joi');

class ValidationMiddleware {
    // Validation schemas
    schemas = {
        registration: Joi.object({
            username: Joi.string()
                .alphanum()
                .min(3)
                .max(30)
                .required()
                .messages({
                    'string.alphanum': 'Username must contain only letters and numbers',
                    'string.min': 'Username must be at least 3 characters',
                    'string.max': 'Username must not exceed 30 characters',
                    'any.required': 'Username is required'
                }),
            
            password: Joi.string()
                .min(6)
                .required()
                .messages({
                    'string.min': 'Password must be at least 6 characters',
                    'any.required': 'Password is required'
                }),
            
            displayName: Joi.string()
                .min(1)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Display name is required',
                    'string.max': 'Display name must not exceed 100 characters',
                    'any.required': 'Display name is required'
                }),
            
            partnerCode: Joi.string()
                .pattern(/^NEKO[A-Z0-9]{6}$/)
                .optional()
                .messages({
                    'string.pattern.base': 'Invalid partner code format'
                })
        }),

        login: Joi.object({
            username: Joi.string()
                .required()
                .messages({
                    'any.required': 'Username is required'
                }),
            
            password: Joi.string()
                .required()
                .messages({
                    'any.required': 'Password is required'
                })
        }),

        profileUpdate: Joi.object({
            display_name: Joi.string()
                .min(1)
                .max(100)
                .optional()
                .messages({
                    'string.min': 'Display name cannot be empty',
                    'string.max': 'Display name must not exceed 100 characters'
                }),
            
            avatar_url: Joi.string()
                .uri()
                .optional()
                .messages({
                    'string.uri': 'Avatar URL must be a valid URL'
                })
        }),

        diaryEntry: Joi.object({
            title: Joi.string()
                .min(1)
                .max(200)
                .required()
                .messages({
                    'string.min': 'Title is required',
                    'string.max': 'Title must not exceed 200 characters',
                    'any.required': 'Title is required'
                }),
            
            content: Joi.string()
                .min(1)
                .max(10000)
                .required()
                .messages({
                    'string.min': 'Content is required',
                    'string.max': 'Content must not exceed 10000 characters',
                    'any.required': 'Content is required'
                }),
            
            mood: Joi.string()
                .valid('happy', 'sad', 'excited', 'calm', 'angry', 'love', 'grateful', 'anxious', 'peaceful', 'nostalgic')
                .optional(),
            
            weather: Joi.string()
                .valid('sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy')
                .optional(),
            
            location: Joi.string()
                .max(200)
                .optional(),
            
            photos: Joi.array()
                .items(Joi.string().uri())
                .max(10)
                .optional(),
            
            is_shared: Joi.boolean()
                .default(false)
                .optional()
        }),

        chatMessage: Joi.object({
            receiver_id: Joi.number()
                .integer()
                .positive()
                .required()
                .messages({
                    'number.integer': 'Invalid receiver ID - must be an integer',
                    'number.positive': 'Invalid receiver ID - must be positive',
                    'any.required': 'Receiver ID is required'
                }),
            
            message: Joi.string()
                .min(1)
                .max(1000)
                .required()
                .messages({
                    'string.min': 'Message cannot be empty',
                    'string.max': 'Message must not exceed 1000 characters',
                    'any.required': 'Message is required'
                }),
            
            message_type: Joi.string()
                .valid('text', 'image', 'sticker', 'system')
                .default('text')
                .optional()
        }),

        morningGreeting: Joi.object({
            message: Joi.string()
                .min(1)
                .max(500)
                .required()
                .messages({
                    'string.min': 'Greeting message is required',
                    'string.max': 'Greeting message must not exceed 500 characters',
                    'any.required': 'Greeting message is required'
                }),
            
            mood: Joi.string()
                .valid('energetic', 'sleepy', 'happy', 'neutral', 'excited', 'calm')
                .required()
                .messages({
                    'any.required': 'Mood is required'
                }),
            
            weather: Joi.string()
                .valid('sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy')
                .optional()
        }),

        profileUpdate: Joi.object({
            first_name: Joi.string().max(50).optional(),
            last_name: Joi.string().max(50).optional(),
            display_name: Joi.string().min(1).max(100).optional(),
            nickname: Joi.string().max(50).optional(),
            gender: Joi.string().valid('male', 'female', 'other').optional(),
            birth_date: Joi.date().optional(),
            phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).max(20).optional(),
            bio: Joi.string().max(500).optional(),
            email: Joi.string().email().optional(),
            timezone: Joi.string().optional(),
            language: Joi.string().valid('th', 'en').optional()
        }).min(1),

        passwordChange: Joi.object({
            currentPassword: Joi.string().required(),
            newPassword: Joi.string().min(6).required(),
            confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
        }),

        accountDeletion: Joi.object({
            password: Joi.string().required()
        }),

        pagination: Joi.object({
            page: Joi.number()
                .integer()
                .min(1)
                .default(1)
                .optional(),
            
            limit: Joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(20)
                .optional(),
            
            sort_by: Joi.string()
                .valid('created_at', 'updated_at', 'title')
                .default('created_at')
                .optional(),
            
            sort_order: Joi.string()
                .valid('asc', 'desc')
                .default('desc')
                .optional()
        })
    };

    // Generic validation function
    validate(schema) {
        return (req, res, next) => {
            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                const errors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value
                }));

                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors
                });
            }

            // Replace req.body with validated and sanitized data
            req.body = value;
            next();
        };
    }

    // Query parameter validation
    validateQuery(schema) {
        return (req, res, next) => {
            const { error, value } = schema.validate(req.query, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                const errors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value
                }));

                return res.status(400).json({
                    error: 'Query validation failed',
                    code: 'QUERY_VALIDATION_ERROR',
                    details: errors
                });
            }

            // Replace req.query with validated data
            req.query = value;
            next();
        };
    }

    // Specific validation methods
    validateRegistration = this.validate(this.schemas.registration);
    validateLogin = this.validate(this.schemas.login);
    validateProfileUpdate = this.validate(this.schemas.profileUpdate);
    validateDiaryEntry = this.validate(this.schemas.diaryEntry);
    validateChatMessage = this.validate(this.schemas.chatMessage);
    validateMorningGreeting = this.validate(this.schemas.morningGreeting);
    validatePagination = this.validateQuery(this.schemas.pagination);

    // Custom validators
    validateID(paramName) {
        return (req, res, next) => {
            const id = req.params[paramName];
            const idSchema = Joi.number().integer().positive();
            
            const { error } = idSchema.validate(parseInt(id, 10));
            
            if (error) {
                return res.status(400).json({
                    error: `Invalid ${paramName} format - must be a positive integer`,
                    code: 'INVALID_ID'
                });
            }
            
            // เก็บ parsed ID กลับไปใน params
            req.params[paramName] = parseInt(id, 10);
            next();
        };
    }

    validateDateRange(req, res, next) {
        const { start_date, end_date } = req.query;
        
        if (start_date || end_date) {
            const dateSchema = Joi.object({
                start_date: Joi.date().iso().optional(),
                end_date: Joi.date().iso().min(Joi.ref('start_date')).optional()
            });

            const { error } = dateSchema.validate({ start_date, end_date });
            
            if (error) {
                return res.status(400).json({
                    error: 'Invalid date range',
                    code: 'INVALID_DATE_RANGE',
                    message: error.details[0].message
                });
            }
        }
        
        next();
    }

    // File upload validation
    validateFileUpload(allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 10485760) {
        return (req, res, next) => {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No file uploaded',
                    code: 'NO_FILE_UPLOADED'
                });
            }

            if (!allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({
                    error: 'Invalid file type',
                    code: 'INVALID_FILE_TYPE',
                    allowedTypes: allowedTypes
                });
            }

            if (req.file.size > maxSize) {
                return res.status(413).json({
                    error: 'File too large',
                    code: 'FILE_TOO_LARGE',
                    maxSize: `${maxSize / 1024 / 1024}MB`
                });
            }

            next();
        };
    }

    // User profile validation methods
    validateProfileUpdate(req, res, next) {
        return this.validate(this.schemas.profileUpdate)(req, res, next);
    }

    validatePasswordChange(req, res, next) {
        return this.validate(this.schemas.passwordChange)(req, res, next);
    }

    validateAccountDeletion(req, res, next) {
        return this.validate(this.schemas.accountDeletion)(req, res, next);
    }
}

module.exports = new ValidationMiddleware();
