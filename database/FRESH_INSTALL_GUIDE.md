# คำแนะนำการติดตั้งฐานข้อมูล Little Secret แบบใหม่ทั้งหมด

## ⚠️ คำเตือนสำคัญ
**สคริปต์นี้จะลบข้อมูลทั้งหมดในฐานข้อมูล! กรุณาสำรองข้อมูลก่อนใช้งาน**

## ไฟล์ที่สร้างขึ้น

### 1. `complete_fresh_database.sql`
- **วัตถุประสงค์**: สร้างฐานข้อมูลใหม่ทั้งหมด โดยลบข้อมูลเก่าก่อน
- **เหมาะสำหรับ**: การติดตั้งใหม่ หรือการรีเซ็ตฐานข้อมูลทั้งหมด

## โครงสร้างตารางที่รวมอยู่

### ตารางหลัก (Core Tables)
1. **users** - ข้อมูลผู้ใช้งาน
2. **relationships** - ความสัมพันธ์ระหว่างคู่รัก

### ตารางฟีเจอร์หลัก (Main Features)
3. **diary_entries** - ไดอารี่คู่รัก
4. **chat_messages** - ข้อความแชท
5. **todos** - รายการสิ่งที่ต้องทำ

### ตารางฟีเจอร์เสริม (Additional Features)
6. **pomodoro_sessions** - เซสชัน Pomodoro
7. **math_problems** - โจทย์คณิตศาสตร์
8. **neko_conversations** - การสนทนากับ AI

### ตารางการตั้งค่า (Settings & User Data)
9. **user_preferences** - การตั้งค่าผู้ใช้
10. **user_sessions** - เซสชันการใช้งาน
11. **user_activity_logs** - บันทึกกิจกรรม
12. **daily_greetings** - คำทักทายประจำวัน
13. **morning_greetings** - ข้อความต้อนรับตอนเช้า

### ตารางฟีเจอร์อนาคต (Future Features)
14. **memories** - ความทรงจำพิเศษ
15. **couple_goals** - เป้าหมายคู่รัก
16. **date_plans** - แผนเดท
17. **love_letters** - จดหมายรัก
18. **mood_tracking** - ติดตามอารมณ์
19. **couple_challenges** - ความท้าทายคู่รัก
20. **user_challenges** - การเข้าร่วมความท้าทาย

### ตารางไฟล์และสื่อ (Media & Files)
21. **media_files** - ไฟล์สื่อ
22. **photo_albums** - อัลบั้มรูปภาพ

## ฟีเจอร์ที่รวมอยู่

### 🔐 ความปลอดภัย
- Row Level Security (RLS) สำหรับทุกตาราง
- Policies ที่ครอบคลุมการเข้าถึงข้อมูล
- Foreign Key Constraints พร้อม ON DELETE CASCADE/SET NULL

### 📊 ประสิทธิภาพ
- Indexes ที่เหมาะสมสำหรับการค้นหา
- View สำหรับสถิติผู้ใช้ (user_stats)

### 🔄 Automation
- Triggers สำหรับอัปเดต timestamp อัตโนมัติ
- Function สำหรับสร้าง user profile อัตโนมัติ

### 🌐 Real-time
- เปิดใช้งาน Supabase Realtime สำหรับตารางสำคัญ

## วิธีการใช้งาน

### ขั้นตอนที่ 1: เตรียมการ
```bash
# สำรองข้อมูลปัจจุบัน (ถ้ามี)
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### ขั้นตอนที่ 2: ใช้งานผ่าน Supabase Dashboard
1. เข้าสู่ Supabase Dashboard
2. ไปที่ SQL Editor
3. Copy โค้ดจากไฟล์ `complete_fresh_database.sql`
4. Run สคริปต์

### ขั้นตอนที่ 3: ใช้งานผ่าน psql
```bash
psql -h your-host -U your-user -d your-database -f complete_fresh_database.sql
```

### ขั้นตอนที่ 4: ตรวจสอบการติดตั้ง
```sql
-- ตรวจสอบตารางทั้งหมด
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ทดสอบ View
SELECT * FROM user_stats LIMIT 1;

-- ตรวจสอบ Sample Data
SELECT * FROM morning_greetings;
SELECT * FROM couple_challenges;
```

## ข้อมูลตัวอย่างที่รวมอยู่

### Morning Greetings
- ข้อความทักทายตอนเช้าภาษาไทย 5 ข้อความ
- หมวดหมู่: romantic, general, motivational, positive

### Couple Challenges
- ความท้าทาย 3 แบบ: 7 วันแห่งความหวาน, เดินออกกำลังกาย, 30 วันแห่งความขอบคุณ
- ระดับความยาก: easy, medium
- หมวดหมู่: romance, health, gratitude

## การแก้ไขปัญหา

### ปัญหา: Permission Denied
```sql
-- ตรวจสอบสิทธิ์
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### ปัญหา: Foreign Key Constraint
- สคริปต์จะลบตารางตามลำดับที่ถูกต้อง
- หากยังมีปัญหา ให้ลบ constraint ก่อน แล้วเพิ่มใหม่

### ปัญหา: RLS Policy Conflict
- สคริปต์จะปิด RLS ก่อนลบตาราง
- หากยังมีปัญหา ให้ drop policies ด้วยตนเอง

## การใช้งานหลังติดตั้ง

### 1. การสร้างผู้ใช้ใหม่
- ระบบจะสร้าง user profile และ preferences อัตโนมัติ
- ใช้ Supabase Auth สำหรับการลงทะเบียน

### 2. การเชื่อมต่อคู่รัก
```sql
-- สร้างความสัมพันธ์
INSERT INTO relationships (user1_id, user2_id, status) 
VALUES ('user1_uuid', 'user2_uuid', 'pending');

-- อัปเดต partner_id
UPDATE users SET partner_id = 'partner_uuid' WHERE id = 'user_uuid';
```

### 3. การใช้งาน Realtime
```javascript
// Subscribe to chat messages
const subscription = supabase
  .channel('chat_messages')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, 
    (payload) => {
      console.log('New message:', payload);
    })
  .subscribe();
```

## หมายเหตุสำคัญ
- สคริปต์นี้เหมาะสำหรับการติดตั้งใหม่เท่านั้น
- หากต้องการอัปเดตฐานข้อมูลที่มีอยู่ ให้ใช้ migration scripts แทน
- กรุณาทดสอบในสภาพแวดล้อม development ก่อนใช้ใน production
