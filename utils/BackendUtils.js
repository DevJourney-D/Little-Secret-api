// Backend Utilities - ฟังก์ชันช่วยเหลือทั่วไป
const crypto = require('crypto');
const validator = require('validator');

class BackendUtils {
    // ===============================
    // VALIDATION UTILITIES
    // ===============================

    // ตรวจสอบความถูกต้องของอีเมล
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        return validator.isEmail(email) && email.length <= 254;
    }

    // ตรวจสอบความถูกต้องของรหัสผ่าน
    static isValidPassword(password) {
        if (!password || typeof password !== 'string') return false;
        
        // รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร
        if (password.length < 8) return false;
        
        // มีตัวอักษรพิมพ์เล็ก
        if (!/[a-z]/.test(password)) return false;
        
        // มีตัวอักษรพิมพ์ใหญ่
        if (!/[A-Z]/.test(password)) return false;
        
        // มีตัวเลข
        if (!/\d/.test(password)) return false;
        
        return true;
    }

    // ตรวจสอบความถูกต้องของ UUID
    static isValidUUID(uuid) {
        if (!uuid || typeof uuid !== 'string') return false;
        return validator.isUUID(uuid);
    }

    // ตรวจสอบความถูกต้องของข้อความ
    static isValidText(text, minLength = 1, maxLength = 1000) {
        if (!text || typeof text !== 'string') return false;
        const trimmed = text.trim();
        return trimmed.length >= minLength && trimmed.length <= maxLength;
    }

    // ตรวจสอบความถูกต้องของเบอร์โทรศัพท์
    static isValidPhoneNumber(phone) {
        if (!phone || typeof phone !== 'string') return false;
        // รองรับเบอร์ไทย (08-xxx-xxxx, 09-xxx-xxxx, etc.)
        return /^(\+66|0)[0-9]{8,9}$/.test(phone.replace(/[-\s]/g, ''));
    }

    // ตรวจสอบความถูกต้องของวันที่
    static isValidDate(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // ===============================
    // STRING UTILITIES
    // ===============================

    // สร้างรหัส Partner Code
    static generatePartnerCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // สร้างรหัสลับแบบสุ่ม
    static generateSecretKey(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // สร้าง ID แบบสุ่ม
    static generateRandomId(length = 10) {
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // ทำให้ข้อความปลอดภัย (ลบ HTML tags)
    static sanitizeText(text) {
        if (!text || typeof text !== 'string') return '';
        
        // ลบ HTML tags
        let sanitized = text.replace(/<[^>]*>/g, '');
        
        // ลบ script tags อย่างเข้มงวด
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Escape special characters
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
        
        return sanitized.trim();
    }

    // ตัดข้อความให้สั้นลง
    static truncateText(text, maxLength = 100, suffix = '...') {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + suffix;
    }

    // แปลงเป็น slug
    static createSlug(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // ลบอักขระพิเศษ
            .replace(/[\s_-]+/g, '-') // แทนที่ space ด้วย dash
            .replace(/^-+|-+$/g, ''); // ลบ dash ที่จุดเริ่มต้นและจุดสิ้นสุด
    }

    // ===============================
    // DATE UTILITIES
    // ===============================

    // แปลงวันที่เป็นรูปแบบ ISO string
    static toISOString(date) {
        if (!date) return null;
        if (typeof date === 'string') date = new Date(date);
        if (!(date instanceof Date) || isNaN(date)) return null;
        return date.toISOString();
    }

    // คำนวณอายุจากวันเกิด
    static calculateAge(birthDate) {
        if (!birthDate) return null;
        
        const birth = new Date(birthDate);
        const today = new Date();
        
        if (birth > today) return null;
        
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    // เพิ่มวันในวันที่
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    // ตรวจสอบว่าเป็นวันเดียวกันหรือไม่
    static isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    // แปลงวันที่เป็นข้อความ
    static formatDateThai(date) {
        if (!date) return '';
        
        const d = new Date(date);
        const months = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
    }

    // ===============================
    // ARRAY UTILITIES
    // ===============================

    // ลบข้อมูลที่ซ้ำกันในอาร์เรย์
    static removeDuplicates(array, key = null) {
        if (!Array.isArray(array)) return [];
        
        if (key) {
            // ลบข้อมูลที่ซ้ำกันตาม key ที่ระบุ
            const seen = new Set();
            return array.filter(item => {
                const value = item[key];
                if (seen.has(value)) {
                    return false;
                } else {
                    seen.add(value);
                    return true;
                }
            });
        } else {
            // ลบข้อมูลที่ซ้ำกันทั้งหมด
            return [...new Set(array)];
        }
    }

    // แบ่งอาร์เรย์เป็นชิ้นๆ
    static chunkArray(array, size) {
        if (!Array.isArray(array) || size <= 0) return [];
        
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    // สุ่มลำดับในอาร์เรย์
    static shuffleArray(array) {
        if (!Array.isArray(array)) return [];
        
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // ===============================
    // OBJECT UTILITIES
    // ===============================

    // ลบ property ที่เป็น null หรือ undefined
    static removeNullProperties(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const cleaned = {};
        Object.keys(obj).forEach(key => {
            if (obj[key] !== null && obj[key] !== undefined) {
                cleaned[key] = obj[key];
            }
        });
        return cleaned;
    }

    // เลือกเฉพาะ property ที่ต้องการ
    static pickProperties(obj, keys) {
        if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) return {};
        
        const picked = {};
        keys.forEach(key => {
            if (obj.hasOwnProperty(key)) {
                picked[key] = obj[key];
            }
        });
        return picked;
    }

    // ===============================
    // PAGINATION UTILITIES
    // ===============================

    // คำนวณ pagination
    static calculatePagination(page, limit, total) {
        const currentPage = Math.max(1, parseInt(page) || 1);
        const itemsPerPage = Math.max(1, Math.min(100, parseInt(limit) || 20));
        const totalItems = Math.max(0, parseInt(total) || 0);
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const offset = (currentPage - 1) * itemsPerPage;
        
        return {
            page: currentPage,
            limit: itemsPerPage,
            total: totalItems,
            totalPages,
            offset,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1
        };
    }

    // ===============================
    // ERROR HANDLING UTILITIES
    // ===============================

    // สร้าง error response
    static createErrorResponse(message, statusCode = 500, details = null) {
        return {
            success: false,
            error: message,
            statusCode,
            details,
            timestamp: new Date().toISOString()
        };
    }

    // สร้าง success response
    static createSuccessResponse(data = null, message = null) {
        const response = {
            success: true,
            timestamp: new Date().toISOString()
        };
        
        if (data !== null) response.data = data;
        if (message) response.message = message;
        
        return response;
    }

    // ===============================
    // SECURITY UTILITIES
    // ===============================

    // Hash รหัสผ่าน
    static hashPassword(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    }

    // สร้าง salt
    static generateSalt() {
        return crypto.randomBytes(32).toString('hex');
    }

    // ตรวจสอบรหัสผ่าน
    static verifyPassword(password, salt, hash) {
        const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return hash === hashVerify;
    }

    // เข้ารหัสข้อมูล
    static encryptData(text, key) {
        const algorithm = 'aes-256-cbc';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }

    // ถอดรหัสข้อมูล
    static decryptData(encryptedData, key) {
        try {
            const algorithm = 'aes-256-cbc';
            const textParts = encryptedData.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = textParts.join(':');
            const decipher = crypto.createDecipher(algorithm, key);
            
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            return null;
        }
    }

    // ===============================
    // MATH UTILITIES
    // ===============================

    // สุ่มตัวเลขในช่วง
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ปัดเศษทศนิยม
    static roundTo(number, decimals) {
        return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals);
    }

    // คำนวณเปอร์เซ็นต์
    static calculatePercentage(part, total) {
        if (total === 0) return 0;
        return Math.round((part / total) * 100 * 100) / 100;
    }
}

module.exports = BackendUtils;
