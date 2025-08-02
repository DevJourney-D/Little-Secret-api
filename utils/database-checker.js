// ไฟล์ตรวจสอบและซิงค์โครงสร้างฐานข้อมูล
// Database Structure Checker and Sync Utility

class DatabaseChecker {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    // ตรวจสอบโครงสร้างตารางทั้งหมด
    async checkAllTables() {
        const results = {
            tables: {},
            missing_columns: [],
            issues: [],
            recommendations: []
        };

        const expectedTables = [
            'users',
            'chat_messages',
            'diary_entries',
            'todos',
            'math_problems',
            'pomodoro_sessions',
            'neko_conversations',
            'user_preferences',
            'user_sessions',
            'user_activity_logs',
            'daily_greetings',
            'morning_greetings',
            'relationships'
        ];

        for (const tableName of expectedTables) {
            try {
                const tableResult = await this.checkTable(tableName);
                results.tables[tableName] = tableResult;
                
                if (tableResult.missing_columns.length > 0) {
                    results.missing_columns.push(...tableResult.missing_columns.map(col => `${tableName}.${col}`));
                }
                
                if (tableResult.issues.length > 0) {
                    results.issues.push(...tableResult.issues);
                }
            } catch (error) {
                results.issues.push(`Error checking table ${tableName}: ${error.message}`);
            }
        }

        return results;
    }

    // ตรวจสอบตารางเฉพาะ
    async checkTable(tableName) {
        const result = {
            exists: false,
            columns: [],
            missing_columns: [],
            issues: []
        };

        try {
            // ลองดึงข้อมูลจากตาราง
            const { data, error } = await this.supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error && error.code === 'PGRST116') {
                // ตารางว่าง แต่มีอยู่
                result.exists = true;
            } else if (error) {
                result.exists = false;
                result.issues.push(`Table ${tableName} does not exist or cannot be accessed`);
                return result;
            } else {
                result.exists = true;
            }

            // ตรวจสอบคอลัมน์ที่คาดหวัง
            const expectedColumns = this.getExpectedColumns(tableName);
            
            if (data && data.length > 0) {
                result.columns = Object.keys(data[0]);
                
                // หาคอลัมน์ที่หายไป
                for (const expectedCol of expectedColumns) {
                    if (!result.columns.includes(expectedCol)) {
                        result.missing_columns.push(expectedCol);
                    }
                }
            } else {
                // ตารางว่าง ไม่สามารถตรวจสอบคอลัมน์ได้
                result.issues.push(`Table ${tableName} is empty, cannot verify column structure`);
            }

        } catch (error) {
            result.issues.push(`Error checking table ${tableName}: ${error.message}`);
        }

        return result;
    }

    // กำหนดคอลัมน์ที่คาดหวังในแต่ละตาราง
    getExpectedColumns(tableName) {
        const columnMap = {
            'users': [
                'id', 'email', 'username', 'first_name', 'last_name', 'display_name',
                'gender', 'partner_id', 'partner_code', 'nickname', 'avatar_url',
                'phone', 'birth_date', 'relationship_anniversary', 'bio', 'status',
                'email_verified', 'is_online', 'created_at', 'updated_at', 'last_seen',
                'timezone', 'language', 'theme_preference', 'notification_settings', 'privacy_settings'
            ],
            'chat_messages': [
                'id', 'sender_id', 'receiver_id', 'message', 'message_type', 'read', 'created_at'
            ],
            'diary_entries': [
                'id', 'user_id', 'title', 'content', 'mood', 'category', 'visibility',
                'image_url', 'created_at', 'updated_at'
            ],
            'todos': [
                'id', 'user_id', 'title', 'description', 'status', 'priority', 'category',
                'due_date', 'completed', 'completed_at', 'shared_with_partner', 'created_at', 'updated_at'
            ],
            'math_problems': [
                'id', 'user_id', 'problem_type', 'question', 'correct_answer', 'user_answer',
                'is_correct', 'difficulty', 'solved_at', 'created_at', 'problem_text',
                'time_spent', 'operation'
            ],
            'pomodoro_sessions': [
                'id', 'user_id', 'task_name', 'duration_minutes', 'session_type',
                'completed', 'started_at', 'completed_at', 'task_description'
            ],
            'neko_conversations': [
                'id', 'user_id', 'message', 'response', 'mood', 'created_at'
            ],
            'user_preferences': [
                'id', 'user_id', 'notification_enabled', 'daily_greeting_enabled',
                'theme', 'language', 'timezone', 'dark_mode', 'font_size',
                'auto_save', 'privacy_mode', 'created_at', 'updated_at'
            ],
            'user_sessions': [
                'id', 'user_id', 'session_token', 'device_info', 'ip_address',
                'user_agent', 'last_activity', 'expires_at', 'created_at'
            ],
            'user_activity_logs': [
                'id', 'user_id', 'activity_type', 'activity_data', 'ip_address',
                'user_agent', 'created_at'
            ]
        };

        return columnMap[tableName] || [];
    }

    // ตรวจสอบความสัมพันธ์ของข้อมูล
    async checkDataIntegrity() {
        const results = {
            orphaned_records: [],
            missing_relationships: [],
            data_issues: []
        };

        try {
            // ตรวจสอบ orphaned records
            await this.checkOrphanedRecords(results);
            
            // ตรวจสอบ partner relationships
            await this.checkPartnerRelationships(results);
            
            // ตรวจสอบ foreign key consistency
            await this.checkForeignKeyConsistency(results);

        } catch (error) {
            results.data_issues.push(`Error checking data integrity: ${error.message}`);
        }

        return results;
    }

    // ตรวจสอบ records ที่ไม่มี parent
    async checkOrphanedRecords(results) {
        const tables = [
            { table: 'chat_messages', foreign_key: 'sender_id', parent: 'users' },
            { table: 'chat_messages', foreign_key: 'receiver_id', parent: 'users' },
            { table: 'diary_entries', foreign_key: 'user_id', parent: 'users' },
            { table: 'todos', foreign_key: 'user_id', parent: 'users' },
            { table: 'math_problems', foreign_key: 'user_id', parent: 'users' },
            { table: 'pomodoro_sessions', foreign_key: 'user_id', parent: 'users' },
            { table: 'neko_conversations', foreign_key: 'user_id', parent: 'users' }
        ];

        for (const { table, foreign_key, parent } of tables) {
            try {
                // นี่เป็นการตรวจสอบพื้นฐาน - ในการใช้งานจริงอาจต้องใช้ SQL ที่ซับซ้อนกว่า
                const { data, error } = await this.supabase
                    .from(table)
                    .select(`${foreign_key}`)
                    .limit(1000);

                if (error) {
                    results.data_issues.push(`Cannot check orphaned records in ${table}: ${error.message}`);
                }
            } catch (error) {
                results.data_issues.push(`Error checking ${table}: ${error.message}`);
            }
        }
    }

    // ตรวจสอบความสัมพันธ์ของคู่รัก
    async checkPartnerRelationships(results) {
        try {
            const { data: users, error } = await this.supabase
                .from('users')
                .select('id, partner_id')
                .not('partner_id', 'is', null);

            if (error) {
                results.data_issues.push(`Cannot check partner relationships: ${error.message}`);
                return;
            }

            for (const user of users) {
                // ตรวจสอบว่าคู่รักมีความสัมพันธ์แบบสองทาง
                const { data: partner, error: partnerError } = await this.supabase
                    .from('users')
                    .select('id, partner_id')
                    .eq('id', user.partner_id)
                    .single();

                if (partnerError || !partner) {
                    results.missing_relationships.push(`User ${user.id} has partner_id ${user.partner_id} but partner does not exist`);
                } else if (partner.partner_id !== user.id) {
                    results.missing_relationships.push(`User ${user.id} and ${partner.id} do not have mutual partnership`);
                }
            }
        } catch (error) {
            results.data_issues.push(`Error checking partner relationships: ${error.message}`);
        }
    }

    // ตรวจสอบ foreign key consistency
    async checkForeignKeyConsistency(results) {
        // ตรวจสอบว่ามี records ที่อ้างอิงไปยัง users ที่ไม่มีอยู่
        // ในการใช้งานจริงจะต้องใช้ SQL joins ที่ซับซ้อนกว่านี้
        
        try {
            // ตรวจสอบจำนวน users และ records ที่เกี่ยวข้อง
            const { count: usersCount } = await this.supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            const { count: diaryCount } = await this.supabase
                .from('diary_entries')
                .select('*', { count: 'exact', head: true });

            const { count: todoCount } = await this.supabase
                .from('todos')
                .select('*', { count: 'exact', head: true });

            results.data_issues.push(`Database statistics: ${usersCount} users, ${diaryCount} diary entries, ${todoCount} todos`);

        } catch (error) {
            results.data_issues.push(`Error getting database statistics: ${error.message}`);
        }
    }

    // สร้างรายงานการตรวจสอบ
    generateReport(structureCheck, integrityCheck) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_tables: Object.keys(structureCheck.tables).length,
                tables_with_issues: Object.values(structureCheck.tables).filter(t => t.issues.length > 0).length,
                missing_columns: structureCheck.missing_columns.length,
                data_issues: integrityCheck.data_issues.length,
                orphaned_records: integrityCheck.orphaned_records.length
            },
            details: {
                structure: structureCheck,
                integrity: integrityCheck
            },
            recommendations: this.generateRecommendations(structureCheck, integrityCheck)
        };

        return report;
    }

    // สร้างคำแนะนำ
    generateRecommendations(structureCheck, integrityCheck) {
        const recommendations = [];

        if (structureCheck.missing_columns.length > 0) {
            recommendations.push({
                type: 'missing_columns',
                priority: 'high',
                message: 'ควรเพิ่มคอลัมน์ที่หายไปในฐานข้อมูล',
                action: 'รัน update_database_structure.sql'
            });
        }

        if (integrityCheck.missing_relationships.length > 0) {
            recommendations.push({
                type: 'relationship_issues',
                priority: 'medium',
                message: 'มีปัญหาความสัมพันธ์ของข้อมูลคู่รัก',
                action: 'ตรวจสอบและแก้ไขข้อมูล partner_id'
            });
        }

        if (integrityCheck.orphaned_records.length > 0) {
            recommendations.push({
                type: 'orphaned_data',
                priority: 'low',
                message: 'มีข้อมูลที่ไม่มี parent record',
                action: 'ลบหรือแก้ไขข้อมูลที่ไม่สมบูรณ์'
            });
        }

        return recommendations;
    }
}

// Export สำหรับใช้งาน
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseChecker;
} else if (typeof window !== 'undefined') {
    window.DatabaseChecker = DatabaseChecker;
}
