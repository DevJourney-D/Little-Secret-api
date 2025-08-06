# 🚀 Neko U API v2.0 - คู่มือการใช้งาน

## 📋 **สรุปโครงสร้าง**

### **คำตอบคำถาม: Controllers vs Routes - ใครเรียกใช้ Services?**

- **Routes** = กำหนดเส้น API เท่านั้น (ไม่เรียก Services)
- **Controllers** = เรียกใช้ Services และจัดการ HTTP
- **Services** = Business Logic และ Database Operations

**💡 ตอบ: Controllers เท่านั้นที่เรียกใช้ Services โดยตรง**

---

## 🌐 **Base URL**
```
Production: https://neko-u-api.vercel.app
Local: http://localhost:3000
```

## 📚 **API Endpoints**

### 🏠 **หน้าหลัก**
```
GET /                    - หน้าแรก
GET /api                 - เอกสาร API
GET /api/health          - ตรวจสอบสถานะ
```

### 👤 **ผู้ใช้ (Users)**
```
POST /api/users/register          - สมัครสมาชิก
POST /api/users/login            - เข้าสู่ระบบ
GET  /api/users                  - รายการผู้ใช้ทั้งหมด
GET  /api/users/:userId          - ข้อมูลผู้ใช้
PUT  /api/users/:userId          - แก้ไขข้อมูล
DELETE /api/users/:userId        - ลบผู้ใช้
```

### 📝 **ไดอารี่ (Diary)**
```
GET  /api/diary                  - รายการไดอารี่
POST /api/diary                  - เขียนไดอารี่ใหม่
GET  /api/diary/:entryId         - ไดอารี่เฉพาะ
PUT  /api/diary/:entryId         - แก้ไขไดอารี่
DELETE /api/diary/:entryId       - ลบไดอารี่
```

### 💬 **แชท (Chat)**
```
GET  /api/chat                   - ประวัติการแชท
POST /api/chat                   - ส่งข้อความ
GET  /api/chat/:messageId        - ข้อความเฉพาะ
PUT  /api/chat/:messageId        - แก้ไขข้อความ
DELETE /api/chat/:messageId      - ลบข้อความ
```

### ✅ **สิ่งที่ต้องทำ (Todo)**
```
GET  /api/todo                   - รายการงาน
POST /api/todo                   - สร้างงานใหม่
GET  /api/todo/:todoId           - งานเฉพาะ
PUT  /api/todo/:todoId           - แก้ไขงาน
DELETE /api/todo/:todoId         - ลบงาน
PUT  /api/todo/:todoId/complete  - ทำเครื่องหมายเสร็จ
```

### 🔢 **เกมคณิตศาสตร์ (Math)**
```
POST /api/math/generate          - สร้างโจทย์
POST /api/math/check             - ตรวจคำตอบ
GET  /api/math/history           - ประวัติการเล่น
GET  /api/math/stats             - สถิติ
```

### 🐱 **Neko AI Assistant**
```
POST /api/neko/chat              - คุยกับ Neko
GET  /api/neko/chat/history      - ประวัติการสนทนา
GET  /api/neko/advice/random     - คำแนะนำสุ่ม
GET  /api/neko/fortune           - ดูดวง
```

---

## 🔐 **Authentication**

### สำหรับ API ที่ต้องการ token:
```javascript
Headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### Compatibility Routes (เดิม):
```
POST /auth/register              - สมัครสมาชิก
POST /auth/login                 - เข้าสู่ระบบ
GET  /auth/check/username/:user  - ตรวจสอบ username
GET  /auth/check/email/:email    - ตรวจสอบ email
```

---

## 📊 **Response Format**

### สำเร็จ:
```json
{
  "success": true,
  "message": "ข้อความสำเร็จ",
  "data": { ... }
}
```

### ข้อผิดพลาด:
```json
{
  "success": false,
  "message": "ข้อความแสดงข้อผิดพลาด",
  "error": "รายละเอียด"
}
```

---

## 🔧 **การทำงานของโครงสร้าง**

```
📱 Client Request
       ↓
📍 Routes (routes/*.js)
   - กำหนดเส้น API
   - ไม่เรียก Services
       ↓
🎯 Controllers (controllers/*.js)  
   - จัดการ HTTP Request/Response
   - เรียกใช้ Services ⭐
       ↓
⚙️ Services (services/*.js)
   - Business Logic
   - Database Operations
       ↓
🗄️ Database (Supabase)
```

---

## 💡 **ตัวอย่างการใช้งาน**

### สมัครสมาชิก:
```javascript
POST /api/users/register
{
  "email": "user@example.com",
  "username": "myusername",
  "password": "mypassword",
  "first_name": "ชื่อ",
  "last_name": "นามสกุล"
}
```

### เข้าสู่ระบบ:
```javascript
POST /api/users/login
{
  "username": "myusername",
  "password": "mypassword"
}
```

### เขียนไดอารี่:
```javascript
POST /api/diary
Headers: { "Authorization": "Bearer token" }
{
  "title": "วันนี้ดีมาก",
  "content": "เนื้อหาไดอารี่...",
  "mood": "happy",
  "category": "daily"
}
```

---

## 🎯 **สรุป**

✅ **API ออกแบบใหม่แบบง่าย ๆ**  
✅ **โครงสร้างชัดเจน: Routes → Controllers → Services**  
✅ **Controllers เป็นคนเดียวที่เรียกใช้ Services**  
✅ **รองรับ Frontend เดิม (Compatibility Routes)**  
✅ **เอกสารครบถ้วน พร้อมใช้งาน**
