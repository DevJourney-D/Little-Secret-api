# Database Schema Migration Notes

## ✅ สรุปการเปลี่ยนแปลงที่ทำแล้ว

### 1. ID Fields เปลี่ยนจาก UUID เป็น BigInt Auto-increment
- **เดิม**: ใช้ `uuidv4()` ใน JavaScript และเก็บเป็น UUID strings
- **ใหม่**: ใช้ `bigint` ที่เป็น auto-increment sequences ใน PostgreSQL

### 2. ตารางที่ได้รับการปรับปรุง

#### 2.1 Users Table
- ✅ เพิ่ม fields ใหม่: `status`, `email_verified`, `is_online`, `last_seen`, `theme_preference`, `notification_settings`, `privacy_settings`
- ✅ ปรับ default values ให้ตรงกับ schema

#### 2.2 User Preferences Table  
- ✅ ปรับ field names: `notification_sound`, `auto_save`, `dark_mode`, `font_size`, `language_preference`, `time_format`, `date_format`, `privacy_diary_default`, `privacy_location_sharing`, `privacy_last_seen`
- ✅ เอา fields เก่าที่ไม่ใช้แล้วออก

#### 2.3 Chat Messages Table
- ✅ เพิ่ม fields: `reactions`, `edited_at`, `deleted_at`  
- ✅ ปรับ `message_type` constraints ให้ตรงกับ schema

#### 2.4 Diary Entries Table
- ✅ เพิ่ม fields: `reactions`, `updated_at`
- ✅ ปรับ `visibility` constraints

#### 2.5 Math Problems Table  
- ✅ ปรับ field names: `problem_text`, `time_taken_seconds`, `answered_at`
- ✅ เอา fields เก่าออก: `problem_type`, `operation`, `attempts`, `explanation`

#### 2.6 Neko Conversations Table
- ✅ ปรับ field name: `context` (จากเดิม `conversation_context`)
- ✅ เอา fields เก่าออก: `emotion_detected`, `response_type`

#### 2.7 Pomodoro Sessions Table
- ✅ ปรับ field names: `break_duration`, `notes` 
- ✅ ปรับ `session_type` constraints: `focus`, `short_break`, `long_break`
- ✅ เอา fields เก่าออก: `task_description`, `interruptions`, `focus_rating`, `productivity_notes`

#### 2.8 Todos Table
- ✅ เพิ่ม field: `completed`
- ✅ ปรับ `status` และ `priority` constraints ให้ตรงกับ schema

#### 2.9 User Activity Logs Table (ใหม่)
- ✅ ปรับ field names: `action`, `target_type`, `target_id`, `details`
- ✅ เอา fields เก่าออก: `activity_type`, `activity_data`

### 3. ไฟล์ที่ได้รับการปรับปรุง

#### Services:
- ✅ `UserService.js` - ปรับ createUser, createUserPreferences, logActivity methods
- ✅ `ChatService.js` - เอา UUID imports ออก, เพิ่ม reactions field  
- ✅ `DiaryService.js` - เอา UUID imports ออก, เพิ่ม reactions field
- ✅ `MathService.js` - เอา UUID imports ออก, ปรับ saveMathAnswer method
- ✅ `NekoChatService.js` - เอา UUID imports ออก, ปรับ saveNekoConversation method  
- ✅ `PomodoroService.js` - เอา UUID imports ออก, ปรับ startSession และ completeSession methods
- ✅ `TodoService.js` - เอา UUID imports ออก, เพิ่ม completed field

#### Controllers:
- ✅ `UserController.js` - ปรับ logActivity calls ทั้งหมดให้ตรงกับ signature ใหม่

### 4. การเปลี่ยนแปลงสำคัญใน Code

#### 4.1 ไม่ต้องใช้ UUID อีกต่อไป
```javascript
// เดิม
const { v4: uuidv4 } = require('uuid');
.insert([{ id: uuidv4(), ... }])

// ใหม่  
.insert([{ ... }]) // ให้ database สร้าง auto-increment ID
```

#### 4.2 Activity Logging ใหม่
```javascript
// เดิม
logActivity(userId, activityType, activityData, req)

// ใหม่
logActivity(userId, action, targetType, targetId, details, req)
```

#### 4.3 Field Mappings ที่สำคัญ
- `conversation_context` → `context`
- `problem_type` → ไม่ใช้แล้ว (ใช้ `category`)
- `question` → `problem_text`
- `time_spent` → `time_taken_seconds`
- `task_description` → `notes`

## ⚠️ สิ่งที่ต้องตรวจสอบเพิ่มเติม

1. **Database Migration Script**: ควรสร้าง SQL script เพื่อ migrate ข้อมูลเก่าไปใหม่
2. **Frontend Integration**: ตรวจสอบว่า frontend ยังใช้ field names เก่าอยู่หรือไม่
3. **API Testing**: ทดสอบ API endpoints ทั้งหมดด้วยข้อมูลจริง
4. **Data Validation**: ตรวจสอบ constraints และ validations ใหม่
5. **Performance**: ตรวจสอบ query performance ด้วย bigint IDs

## 🎯 ขั้นตอนถัดไป

1. สร้าง test cases สำหรับการทำงานของ API
2. ปรับ frontend ให้ตรงกับ schema ใหม่  
3. เตรียม production deployment plan
4. สร้าง backup และ rollback procedures
