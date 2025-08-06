# 📁 Controllers vs Routes vs Services - โครงสร้าง API

## 🏗️ **โครงสร้างการทำงาน**

```
Client Request (Frontend)
        ↓
📍 Routes (routes/*.js) - กำหนดเส้น API
        ↓
🎯 Controllers (controllers/*.js) - จัดการ Request/Response
        ↓
⚙️ Services (services/*.js) - ตmantrakรรมข้อมูลและ Business Logic
        ↓
🗄️ Database (Supabase)
```

---

## 📂 **Routes (routes/*.js)**

### หน้าที่:
- **กำหนดเส้น API** (URL endpoints)
- **เชื่อมต่อ URL กับ Controller**
- **จัดการ Middleware** (authentication, validation)

### ตัวอย่าง:
```javascript
// routes/users.js
const router = express.Router();
const userController = new UserController();

// กำหนดเส้น API
router.post('/register', userController.createUser);
router.get('/:userId', userController.getUserById);
router.put('/:userId', userController.updateUser);
```

### ลักษณะ:
- ✅ **ไม่เรียก Service โดยตรง**
- ✅ เฉพาะการกำหนดเส้นทาง
- ✅ จัดการ middleware
- ✅ เชื่อมต่อกับ Controller

---

## 🎯 **Controllers (controllers/*.js)**

### หน้าที่:
- **รับและส่ง HTTP Request/Response**
- **เรียกใช้ Services** เพื่อประมวลผลข้อมูล
- **จัดการ Error Handling**
- **Format ข้อมูลส่งกลับ**

### ตัวอย่าง:
```javascript
// controllers/UserController.js
class UserController {
    constructor() {
        this.userService = new UserService(); // เรียกใช้ Service
    }

    async createUser(req, res) {
        try {
            // เรียกใช้ Service
            const result = await this.userService.createUser(req.body);
            
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: 'สร้างผู้ใช้สำเร็จ',
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาด',
                error: error.message
            });
        }
    }
}
```

### ลักษณะ:
- ✅ **เรียกใช้ Services**
- ✅ จัดการ HTTP Status Codes
- ✅ Format Response JSON
- ✅ Error Handling

---

## ⚙️ **Services (services/*.js)**

### หน้าที่:
- **Business Logic** หลักของแอป
- **เชื่อมต่อกับ Database**
- **ประมวลผลข้อมูล**
- **ไม่เกี่ยวข้องกับ HTTP**

### ตัวอย่าง:
```javascript
// services/UserService.js
class UserService {
    constructor() {
        this.supabase = createClient(/* config */);
    }

    async createUser(userData) {
        try {
            // ตรวจสอบข้อมูล
            if (!userData.email || !userData.password) {
                throw new Error('ข้อมูลไม่ครบ');
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            // บันทึกลงฐานข้อมูล
            const { data, error } = await this.supabase
                .from('users')
                .insert([{ ...userData, password: hashedPassword }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
```

### ลักษณะ:
- ✅ **ไม่รู้จัก req, res**
- ✅ เฉพาะ Business Logic
- ✅ Database Operations
- ✅ Data Validation

---

## 🔄 **การไหลของข้อมูล (Data Flow)**

### 1. **เมื่อมี Request เข้ามา:**
```
POST /api/users/register
        ↓
routes/users.js -> router.post('/register', userController.createUser)
        ↓
controllers/UserController.js -> this.userService.createUser(req.body)
        ↓
services/UserService.js -> database operations
        ↓
กลับผลลัพธ์ -> Controller -> Routes -> Client
```

### 2. **ใครเรียกใช้ใคร:**
- **Routes** เรียกใช้ **Controllers**
- **Controllers** เรียกใช้ **Services**
- **Services** เรียกใช้ **Database**

---

## 📋 **สรุปความแตกต่าง**

| ส่วน | หน้าที่หลัก | เรียกใช้ Service | เกี่ยวข้องกับ HTTP |
|------|------------|-----------------|-------------------|
| **Routes** | กำหนดเส้น API | ❌ ไม่เรียกโดยตรง | ✅ ใช่ |
| **Controllers** | จัดการ Request/Response | ✅ **เรียกใช้** | ✅ ใช่ |
| **Services** | Business Logic | ❌ ไม่เรียก | ❌ ไม่เกี่ยว |

---

## 🎯 **ตัวอย่างโครงสร้างไฟล์:**

```
📁 routes/
   ├── api.js          (หลัก - รวมทุก routes)
   ├── users.js        (เส้น API ผู้ใช้)
   ├── diary.js        (เส้น API ไดอารี่)
   └── chat.js         (เส้น API แชท)

📁 controllers/
   ├── UserController.js    (จัดการ HTTP สำหรับ users)
   ├── DiaryController.js   (จัดการ HTTP สำหรับ diary)
   └── ChatController.js    (จัดการ HTTP สำหรับ chat)

📁 services/
   ├── UserService.js       (Business logic ผู้ใช้)
   ├── DiaryService.js      (Business logic ไดอารี่)
   └── ChatService.js       (Business logic แชท)
```

**💡 คำตอบง่าย ๆ:** **Controllers เท่านั้นที่เรียกใช้ Services โดยตรง**
