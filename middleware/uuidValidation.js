// UUID Validation Middleware
const { validate: uuidValidate, version: uuidVersion } = require('uuid');

// Middleware สำหรับตรวจสอบ UUID format
const validateUUID = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: `Missing ${paramName} parameter`
            });
        }

        // ตรวจสอบว่าเป็น UUID format ที่ถูกต้องหรือไม่
        if (!uuidValidate(id)) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName} format. Must be a valid UUID.`
            });
        }

        // ตรวจสอบว่าเป็น UUID version 4 หรือไม่
        if (uuidVersion(id) !== 4) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName} format. Must be a UUID v4.`
            });
        }

        next();
    };
};

// Middleware สำหรับตรวจสอบหลาย UUID parameters
const validateMultipleUUIDs = (...paramNames) => {
    return (req, res, next) => {
        for (const paramName of paramNames) {
            const id = req.params[paramName];
            
            if (id && !uuidValidate(id)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid ${paramName} format. Must be a valid UUID.`
                });
            }

            if (id && uuidVersion(id) !== 4) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid ${paramName} format. Must be a UUID v4.`
                });
            }
        }
        next();
    };
};

module.exports = {
    validateUUID,
    validateMultipleUUIDs
};
