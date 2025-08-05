# Little Secret API - Username และ Email Availability Check

## 📋 สรุปการเพิ่ม Endpoint ใหม่

### 🆕 **Endpoint ที่เพิ่มใหม่**

#### 1. **ตรวจสอบ Username**
- **URL**: `GET /api/check/username/{username}`
- **Function**: ตรวจสอบว่า username สามารถใช้งานได้หรือไม่
- **Response**:
  ```json
  {
    "success": true,
    "available": true/false,
    "message": "ข้อความอธิบาย"
  }
  ```

#### 2. **ตรวจสอบ Email**
- **URL**: `GET /api/check/email/{email}`
- **Function**: ตรวจสอบว่า email สามารถใช้งานได้หรือไม่
- **Response**:
  ```json
  {
    "success": true,
    "available": true/false,
    "message": "ข้อความอธิบาย"
  }
  ```

### 🔧 **การตรวจสอบที่เพิ่มเติม**

#### Username Validation:
- ความยาวขั้นต่ำ 3 ตัวอักษร
- อนุญาตเฉพาะ: `a-z`, `A-Z`, `0-9`, `_`
- ไม่อนุญาต: ช่องว่าง, อักขระพิเศษอื่นๆ

#### Email Validation:
- รูปแบบ email ที่ถูกต้อง: `user@domain.com`
- ใช้ Regular Expression: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### 📁 **ไฟล์ที่แก้ไข**

1. **`controllers/UserController.js`**
   - เพิ่ม `checkUsernameAvailability()`
   - เพิ่ม `checkEmailAvailability()`

2. **`index.js`**
   - เพิ่ม route: `/api/check/username/:username`
   - เพิ่ม route: `/api/check/email/:email`
   - ปรับ middleware pattern เป็น `/:userId(\\d+)/*` เพื่อหลีกเลี่ยงการชนกับ route ใหม่

3. **`api-tester-updated.html`**
   - เพิ่มส่วนทดสอบ availability check
   - เพิ่ม real-time validation ในฟอร์มลงทะเบียน
   - แสดงสถานะ available/unavailable แบบ visual

### 🧪 **ตัวอย่างการใช้งาน**

#### ทดสอบ Username:
```bash
curl -X GET "https://little-secret-api.vercel.app/api/check/username/newuser123"
```

#### ทดสอบ Email:
```bash
curl -X GET "https://little-secret-api.vercel.app/api/check/email/test@example.com"
```

### 📊 **ตัวอย่าง Response**

#### Username ที่ใช้งานได้:
```json
{
  "success": true,
  "available": true,
  "message": "ชื่อผู้ใช้ใช้งานได้"
}
```

#### Username ที่ถูกใช้แล้ว:
```json
{
  "success": true,
  "available": false,
  "message": "ชื่อผู้ใช้นี้ถูกใช้แล้ว"
}
```

#### Username รูปแบบผิด:
```json
{
  "success": false,
  "available": false,
  "message": "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร"
}
```

### ⚡ **การใช้งานใน Frontend**

#### JavaScript Example:
```javascript
async function checkUsername(username) {
    try {
        const response = await fetch(`/api/check/username/${encodeURIComponent(username)}`);
        const data = await response.json();
        
        if (data.available) {
            // แสดง ✅ ใช้ได้
            console.log('Username available');
        } else {
            // แสดง ❌ ไม่ใช้ได้
            console.log('Username taken');
        }
    } catch (error) {
        console.error('Error checking username:', error);
    }
}
```

### 🔄 **Integration กับระบบลงทะเบียน**

สามารถใช้ endpoint เหล่านี้เพื่อ:
1. **Real-time validation** ขณะพิมพ์
2. **Pre-submission check** ก่อนส่งฟอร์ม
3. **UX improvement** แสดงสถานะแบบ visual

### 🚀 **Status**

- ✅ Code เขียนเสร็จแล้ว
- ✅ HTML Tester สร้างแล้ว
- ⏳ รอ Vercel deployment (auto-deploy)
- 📝 เอกสารสร้างแล้ว

### 🎯 **ประโยชน์**

1. **UX ที่ดีขึ้น**: ผู้ใช้รู้ทันทีว่า username/email ใช้ได้หรือไม่
2. **ลด Error**: ป้องกันการ submit ฟอร์มที่ผิดพลาด
3. **Performance**: ตรวจสอบแค่ field เดียวแทนการส่งฟอร์มทั้งหมด
4. **Security**: validation อยู่ที่ server-side

---

**📅 สร้างเมื่อ:** August 5, 2025  
**🔧 Status:** Ready for deployment
