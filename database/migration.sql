-- Database Migration Script
-- สำหรับการ migrate ข้อมูลจาก UUID schema ไป BigInt Auto-increment schema

-- WARNING: รันคำสั่งนี้ในสภาพแวดล้อม development เท่านั้น!
-- ก่อนรันควร backup ข้อมูลก่อน

-- Step 1: สร้างตารางใหม่ด้วย schema ที่ปรับปรุงแล้ว
-- (ใช้ schema ที่ได้รับจากผู้ใช้)

-- Step 2: Migrate ข้อมูลจากตารางเก่า (ถ้ามี)

-- 2.1 Migrate Users
-- INSERT INTO users_new (email, username, first_name, last_name, display_name, ...)
-- SELECT email, username, first_name, last_name, display_name, ...
-- FROM users_old;

-- 2.2 สร้าง mapping table สำหรับ UUID -> BigInt
-- CREATE TEMP TABLE id_mapping (
--     old_uuid UUID,
--     new_id BIGINT,
--     table_name TEXT
-- );

-- 2.3 Migrate Chat Messages
-- แทนที่ sender_id และ receiver_id ด้วย BigInt IDs ใหม่

-- 2.4 Migrate Diary Entries
-- แทนที่ user_id ด้วย BigInt ID ใหม่

-- 2.5 Migrate Math Problems
-- แทนที่ user_id ด้วย BigInt ID ใหม่
-- แทนที่ field names เก่า

-- 2.6 Migrate อื่นๆ...

-- Step 3: Drop ตารางเก่าหลังจากยืนยันว่าข้อมูลถูกต้อง
-- DROP TABLE users_old;
-- DROP TABLE chat_messages_old;
-- etc...

-- Step 4: Rename ตารางใหม่
-- ALTER TABLE users_new RENAME TO users;
-- etc...

-- เนื่องจากเป็น fresh schema ที่ไม่มีข้อมูลเก่า
-- สามารถใช้ schema ใหม่ได้เลยโดยไม่ต้อง migrate

-- ถ้าต้องการใช้กับข้อมูลเก่า ให้ปรับ script นี้ตามข้อมูลจริง
