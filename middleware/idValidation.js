// ID Validation Middleware (changed from UUID to Integer)

// Middleware สำหรับตรวจสอบ Integer ID format
const validateID = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: `Missing ${paramName} parameter`
            });
        }

        // ตรวจสอบว่าเป็น integer ที่ถูกต้องหรือไม่
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(parsedId)) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName} format. Must be a positive integer.`
            });
        }

        // เก็บ parsed ID กลับไปใน params
        req.params[paramName] = parsedId;
        
        next();
    };
};

// Middleware สำหรับตรวจสอบหลาย ID parameters
const validateMultipleIDs = (...paramNames) => {
    return (req, res, next) => {
        for (const paramName of paramNames) {
            const id = req.params[paramName];
            
            if (id) {
                const parsedId = parseInt(id, 10);
                if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(parsedId)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid ${paramName} format. Must be a positive integer.`
                    });
                }
            }
        }
        next();
    };
};

module.exports = {
    validateID,
    validateMultipleIDs
};
