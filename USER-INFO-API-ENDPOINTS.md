# User Info API Endpoints

## ดึงข้อมูลผู้ใช้ทั้งหมด (สำหรับหน้าบ้าน)

### GET /api/users
ดึงข้อมูลผู้ใช้ทั้งหมดในระบบ (Public endpoint)

**Query Parameters:**
- `status` (optional): กรองตามสถานะผู้ใช้ (active, inactive, banned)
- `is_online` (optional): กรองตามสถานะออนไลน์ (true, false)
- `search` (optional): ค้นหาจาก username, display_name, หรือ email
- `orderBy` (optional): เรียงลำดับตาม field (default: created_at)
- `orderDirection` (optional): ทิศทางการเรียง (asc, desc) (default: desc)
- `limit` (optional): จำนวนผลลัพธ์ต่อหน้า
- `offset` (optional): เริ่มต้นจากตำแหน่งที่

**ตอบกลับ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "first_name": "ชื่อจริง",
      "last_name": "นามสกุล",
      "display_name": "ชื่อที่แสดง",
      "nickname": "ชื่อเล่น",
      "gender": "male/female/other",
      "phone": "เบอร์โทรศัพท์",
      "birth_date": "วันเกิด",
      "bio": "ประวัติย่อ",
      "avatar_url": "URL รูปโปรไฟล์",
      "timezone": "Asia/Bangkok",
      "language": "th",
      "status": "active",
      "email_verified": true,
      "is_online": false,
      "partner_id": "uuid หรือ null",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "last_login_at": "2024-01-01T00:00:00Z",
      "theme_preference": "default",
      "notification_settings": {
        "chat": true,
        "push": true,
        "diary": true,
        "email": true
      },
      "privacy_settings": {
        "diary_default": "shared",
        "last_seen_visible": true,
        "profile_visibility": "partner"
      }
    }
  ],
  "count": 1
}
```

### GET /api/users/count
นับจำนวนผู้ใช้ทั้งหมดในระบบ (Public endpoint)

**Query Parameters:**
- `status` (optional): กรองตามสถานะผู้ใช้
- `is_online` (optional): กรองตามสถานะออนไลน์
- `search` (optional): ค้นหาจาก username, display_name, หรือ email

**ตอบกลับ:**
```json
{
  "success": true,
  "data": {
    "count": 150
  }
}
```

## ตัวอย่างการใช้งาน

### 1. ดึงข้อมูลผู้ใช้ทั้งหมด
```bash
GET /api/users
```

### 2. ดึงข้อมูลผู้ใช้ที่ active เท่านั้น
```bash
GET /api/users?status=active
```

### 3. ดึงข้อมูลผู้ใช้ที่ออนไลน์
```bash
GET /api/users?is_online=true
```

### 4. ค้นหาผู้ใช้
```bash
GET /api/users?search=john
```

### 5. ดึงข้อมูลแบบ pagination
```bash
GET /api/users?limit=20&offset=0
```

### 6. เรียงลำดับผู้ใช้ตามวันที่สร้าง (ใหม่ไปเก่า)
```bash
GET /api/users?orderBy=created_at&orderDirection=desc
```

### 7. นับจำนวนผู้ใช้ที่ active
```bash
GET /api/users/count?status=active
```

## ความปลอดภัย

- Endpoints เหล่านี้เป็น **Public endpoints** ไม่ต้องใช้ authentication
- ข้อมูล password จะถูกกรองออกจาก response อัตโนมัติ
- ข้อมูลที่ส่งกลับจะเป็นข้อมูลพื้นฐานที่ปลอดภัยสำหรับการแสดงในหน้าบ้าน

## หมายเหตุ

- ข้อมูลที่ส่งกลับจะไม่มี password field เพื่อความปลอดภัย
- การเรียงลำดับ default จะเป็นตามวันที่สร้าง (ใหม่ไปเก่า)
- สามารถใช้ query parameters หลายตัวร่วมกันได้
- รองรับการค้นหาแบบ case-insensitive ใน username, display_name, และ email
