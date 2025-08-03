-- Migration: Add password field to users table
-- Date: 2025-08-03

-- เพิ่ม password field ใน users table
ALTER TABLE users ADD COLUMN password text;

-- อัพเดท password field ให้เป็น nullable แต่ใน code จะ validate
-- COMMENT ON COLUMN users.password IS 'Hashed password using bcrypt';
