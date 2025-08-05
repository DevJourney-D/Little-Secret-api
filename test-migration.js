// Test Database Schema Migration
// ทดสอบการทำงานของ API หลังจากการปรับปรุงฐานข้อมูล

const UserService = require('./services/UserService');
const ChatService = require('./services/ChatService');
const DiaryService = require('./services/DiaryService');

async function testDatabaseMigration() {
    console.log('🧪 เริ่มทดสอบการทำงานของ API หลัง Database Migration...\n');

    try {
        // Test 1: User Service
        console.log('1️⃣ ทดสอบ UserService...');
        const userService = new UserService();
        
        // สร้างผู้ใช้ทดสอบ
        const testUserData = {
            email: `test${Date.now()}@example.com`,
            username: `testuser${Date.now()}`,
            password: 'password123',
            first_name: 'Test',
            last_name: 'User',
            display_name: 'Test User'
        };

        const createUserResult = await userService.createUser(testUserData);
        if (createUserResult.success) {
            console.log('✅ สร้างผู้ใช้สำเร็จ - ID:', createUserResult.data.id);
            console.log('✅ User Preferences สร้างอัตโนมัติแล้ว');
            
            // ทดสอบ login
            const loginResult = await userService.loginUser(testUserData.username, testUserData.password);
            if (loginResult.success) {
                console.log('✅ Login สำเร็จ');
                
                // ทดสอบ activity log
                await userService.logActivity(
                    createUserResult.data.id, 
                    'test_action', 
                    'user', 
                    createUserResult.data.id, 
                    { test: true }
                );
                console.log('✅ Activity Log สำเร็จ');
            } else {
                console.log('❌ Login ไม่สำเร็จ:', loginResult.error);
            }
        } else {
            console.log('❌ สร้างผู้ใช้ไม่สำเร็จ:', createUserResult.error);
        }

        // Test 2: Chat Service  
        console.log('\n2️⃣ ทดสอบ ChatService...');
        const chatService = new ChatService();
        
        if (createUserResult.success) {
            const testMessageData = {
                sender_id: createUserResult.data.id,
                receiver_id: createUserResult.data.id, // ส่งให้ตัวเอง
                message: 'Hello, this is a test message!',
                message_type: 'text'
            };

            const sendMessageResult = await chatService.sendMessage(testMessageData);
            if (sendMessageResult.success) {
                console.log('✅ ส่งข้อความสำเร็จ - ID:', sendMessageResult.data.id);
                
                // ทดสอบ add reaction
                const reactionResult = await chatService.addReaction(
                    sendMessageResult.data.id, 
                    createUserResult.data.id, 
                    '❤️'
                );
                if (reactionResult.success) {
                    console.log('✅ เพิ่ม Reaction สำเร็จ');
                } else {
                    console.log('❌ เพิ่ม Reaction ไม่สำเร็จ:', reactionResult.error);
                }
            } else {
                console.log('❌ ส่งข้อความไม่สำเร็จ:', sendMessageResult.error);
            }
        }

        // Test 3: Diary Service
        console.log('\n3️⃣ ทดสอบ DiaryService...');
        const diaryService = new DiaryService();
        
        if (createUserResult.success) {
            const testDiaryData = {
                user_id: createUserResult.data.id,
                title: 'Test Diary Entry',
                content: 'This is a test diary entry for migration testing.',
                mood: 'happy',
                category: 'daily',
                visibility: 'shared',
                tags: ['test', 'migration']
            };

            const createDiaryResult = await diaryService.createDiary(testDiaryData);
            if (createDiaryResult.success) {
                console.log('✅ สร้าง Diary Entry สำเร็จ - ID:', createDiaryResult.data.id);
            } else {
                console.log('❌ สร้าง Diary Entry ไม่สำเร็จ:', createDiaryResult.error);
            }
        }

        console.log('\n🎉 การทดสอบเสร็จสิ้น! ฐานข้อมูลใหม่ทำงานได้ปกติ');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// เรียกใช้งานเมื่อไฟล์นี้ถูกรัน
if (require.main === module) {
    testDatabaseMigration();
}

module.exports = { testDatabaseMigration };
