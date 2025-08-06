// Math Service - จัดการโจทย์คณิตศาสตร์
const { createClient } = require('@supabase/supabase-js');

class MathService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    // ============================================
    // HELPER METHODS - ฟังก์ชันช่วยเหลือ
    // ============================================

    // สร้าง pagination object
    _buildPagination(page = 1, limit = 20, total = 0) {
        return {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: (page * limit) < total
        };
    }

    // ตรวจสอบสิทธิ์การเข้าถึงโจทย์คณิตศาสตร์
    async _checkMathProblemAccess(problemId, userId) {
        try {
            const { data: problem } = await this.supabase
                .from('math_problems')
                .select('user_id')
                .eq('id', problemId)
                .single();

            if (!problem) {
                throw new Error('ไม่พบโจทย์คณิตศาสตร์');
            }

            const hasAccess = problem.user_id === userId;
            const isOwner = problem.user_id === userId;

            return { hasAccess, isOwner, problem };
        } catch (error) {
            throw error;
        }
    }

    // สร้าง query สำหรับกรองโจทย์คณิตศาสตร์
    _buildMathQuery(baseQuery, filters = {}) {
        let query = baseQuery;

        // กรองตามความยาก
        if (filters.difficulty) {
            query = query.eq('difficulty', filters.difficulty);
        }

        // กรองตามประเภทการคำนวณ
        if (filters.category || filters.operation) {
            query = query.eq('category', filters.category || filters.operation);
        }

        // กรองตามความถูกต้อง
        if (filters.is_correct !== undefined) {
            query = query.eq('is_correct', filters.is_correct);
        }

        // กรองตามวันที่
        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
        }

        // ค้นหาในโจทย์
        if (filters.search) {
            query = query.ilike('problem_text', `%${filters.search}%`);
        }

        // เรียงลำดับ
        const sortBy = filters.sortBy || 'created_at';
        const sortOrder = filters.sortOrder || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        return query;
    }

    // ============================================
    // CORE MATH OPERATIONS - การจัดการโจทย์คณิตศาสตร์พื้นฐาน
    // ============================================

    // สร้างโจทย์คณิตศาสตร์ใหม่ (CREATE)
    async createMathProblem(problemData) {
        try {
            const { data, error } = await this.supabase
                .from('math_problems')
                .insert([{
                    user_id: problemData.user_id,
                    problem_text: problemData.question || problemData.problem_text,
                    correct_answer: problemData.correct_answer,
                    user_answer: problemData.user_answer,
                    difficulty: problemData.difficulty || 'easy',
                    category: problemData.operation || problemData.category || 'arithmetic',
                    is_correct: problemData.user_answer === problemData.correct_answer,
                    time_taken_seconds: problemData.time_spent || problemData.time_taken_seconds,
                    hints_used: problemData.hints_used || 0,
                    explanation: problemData.explanation,
                    answered_at: new Date().toISOString()
                }])
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('createMathProblem error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงโจทย์ตาม ID (READ)
    async getMathProblemById(problemId, userId) {
        try {
            const accessCheck = await this._checkMathProblemAccess(problemId, userId);
            
            if (!accessCheck.hasAccess) {
                throw new Error('ไม่มีสิทธิ์เข้าถึงโจทย์นี้');
            }

            const { data, error } = await this.supabase
                .from('math_problems')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('id', problemId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('getMathProblemById error:', error);
            return { success: false, error: error.message };
        }
    }

    // อัปเดตโจทย์ (UPDATE)
    async updateMathProblem(problemId, userId, updateData) {
        try {
            const accessCheck = await this._checkMathProblemAccess(problemId, userId);
            
            if (!accessCheck.isOwner) {
                throw new Error('ไม่มีสิทธิ์แก้ไขโจทย์นี้');
            }

            // ลบข้อมูลที่ไม่ควรแก้ไข
            const cleanData = { ...updateData };
            delete cleanData.id;
            delete cleanData.user_id;
            delete cleanData.created_at;
            delete cleanData.answered_at;

            // คำนวณความถูกต้องใหม่หากมีการเปลี่ยนคำตอบ
            if (cleanData.user_answer && cleanData.correct_answer) {
                cleanData.is_correct = cleanData.user_answer === cleanData.correct_answer;
            }

            const { data, error } = await this.supabase
                .from('math_problems')
                .update({
                    ...cleanData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', problemId)
                .eq('user_id', userId)
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('updateMathProblem error:', error);
            return { success: false, error: error.message };
        }
    }

    // ลบโจทย์ (DELETE)
    async deleteMathProblem(problemId, userId) {
        try {
            const accessCheck = await this._checkMathProblemAccess(problemId, userId);
            
            if (!accessCheck.isOwner) {
                throw new Error('ไม่มีสิทธิ์ลบโจทย์นี้');
            }

            const { error } = await this.supabase
                .from('math_problems')
                .delete()
                .eq('id', problemId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true, data: { message: 'ลบโจทย์เรียบร้อยแล้ว' } };
        } catch (error) {
            console.error('deleteMathProblem error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // LISTING & FILTERING - การแสดงรายการและกรอง
    // ============================================

    // แสดงรายการโจทย์ของผู้ใช้ (LIST)
    async listMathProblems(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                difficulty = null,
                category = null,
                is_correct = null,
                search = '',
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = options;

            const offset = (page - 1) * limit;

            let query = this.supabase
                .from('math_problems')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `, { count: 'exact' })
                .eq('user_id', userId);

            // ใช้ helper function สำหรับ filter
            query = this._buildMathQuery(query, { difficulty, category, is_correct, search, sortBy, sortOrder });
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;
            if (error) throw error;

            return {
                success: true,
                data: {
                    problems: data,
                    pagination: this._buildPagination(page, limit, count)
                }
            };
        } catch (error) {
            console.error('listMathProblems error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงข้อมูลผู้ใช้และสถิติ (USER INFO)
    async getUserMathInfo(userId) {
        try {
            // ดึงข้อมูลผู้ใช้
            const { data: user, error: userError } = await this.supabase
                .from('users')
                .select('id, first_name, last_name, display_name, email, avatar_url, created_at')
                .eq('id', userId)
                .single();

            if (userError) throw userError;

            // ดึงสถิติ
            const statsResult = await this.getMathStats(userId);
            const stats = statsResult.success ? statsResult.data : {};

            // ดึงโจทย์ล่าสุด
            const recentResult = await this.listMathProblems(userId, { limit: 5 });
            const recentProblems = recentResult.success ? recentResult.data.problems : [];

            // ดึงโจทย์ที่ทำผิด
            const incorrectResult = await this.getIncorrectProblems(userId, 5);
            const incorrectProblems = incorrectResult.success ? incorrectResult.data : [];

            return {
                success: true,
                data: {
                    user,
                    stats,
                    recent_problems: recentProblems,
                    incorrect_problems: incorrectProblems,
                    summary: {
                        total_problems: stats.total || 0,
                        accuracy: stats.accuracy || 0,
                        favorite_difficulty: this._getFavoriteDifficulty(stats.byDifficulty || {}),
                        average_time: stats.averageTime || 0
                    }
                }
            };
        } catch (error) {
            console.error('getUserMathInfo error:', error);
            return { success: false, error: error.message };
        }
    }

    // หาระดับความยากที่ชื่นชอบ
    _getFavoriteDifficulty(byDifficulty) {
        let max = 0;
        let favorite = 'easy';
        
        for (const [difficulty, count] of Object.entries(byDifficulty)) {
            if (count > max) {
                max = count;
                favorite = difficulty;
            }
        }
        
        return favorite;
    }

    // ============================================
    // MATH PROBLEM GENERATION - การสร้างโจทย์คณิตศาสตร์
    // ============================================

    // สร้างโจทย์คณิตศาสตร์
    async generateMathProblem(difficulty = 'easy', operation = 'random') {
        try {
            let problem = {};
            
            switch (difficulty) {
                case 'easy':
                    problem = this.generateEasyProblem(operation);
                    break;
                case 'medium':
                    problem = this.generateMediumProblem(operation);
                    break;
                case 'hard':
                    problem = this.generateHardProblem(operation);
                    break;
                case 'expert':
                    problem = this.generateExpertProblem(operation);
                    break;
                default:
                    problem = this.generateEasyProblem(operation);
            }

            return { success: true, data: problem };
        } catch (error) {
            console.error('generateMathProblem error:', error);
            return { success: false, error: error.message };
        }
    }

    // โจทย์ระดับง่าย
    generateEasyProblem(operation) {
        const operations = operation === 'random' ? ['addition', 'subtraction'] : [operation];
        const selectedOp = operations[Math.floor(Math.random() * operations.length)];
        
        let num1, num2, answer, question;

        switch (selectedOp) {
            case 'addition':
                num1 = Math.floor(Math.random() * 50) + 1;
                num2 = Math.floor(Math.random() * 50) + 1;
                answer = num1 + num2;
                question = `${num1} + ${num2} = ?`;
                break;
            case 'subtraction':
                num1 = Math.floor(Math.random() * 50) + 25;
                num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
                answer = num1 - num2;
                question = `${num1} - ${num2} = ?`;
                break;
            case 'multiplication':
                num1 = Math.floor(Math.random() * 10) + 1;
                num2 = Math.floor(Math.random() * 10) + 1;
                answer = num1 * num2;
                question = `${num1} × ${num2} = ?`;
                break;
            default:
                num1 = Math.floor(Math.random() * 20) + 1;
                num2 = Math.floor(Math.random() * 20) + 1;
                answer = num1 + num2;
                question = `${num1} + ${num2} = ?`;
        }

        return {
            question,
            correct_answer: answer.toString(),
            difficulty: 'easy',
            operation: selectedOp,
            explanation: `${question.replace('?', answer)}`
        };
    }

    // โจทย์ระดับกลาง
    generateMediumProblem(operation) {
        const operations = operation === 'random' ? ['addition', 'subtraction', 'multiplication'] : [operation];
        const selectedOp = operations[Math.floor(Math.random() * operations.length)];
        
        let num1, num2, answer, question;

        switch (selectedOp) {
            case 'addition':
                num1 = Math.floor(Math.random() * 500) + 100;
                num2 = Math.floor(Math.random() * 500) + 100;
                answer = num1 + num2;
                question = `${num1} + ${num2} = ?`;
                break;
            case 'subtraction':
                num1 = Math.floor(Math.random() * 500) + 200;
                num2 = Math.floor(Math.random() * (num1 - 100)) + 50;
                answer = num1 - num2;
                question = `${num1} - ${num2} = ?`;
                break;
            case 'multiplication':
                num1 = Math.floor(Math.random() * 25) + 10;
                num2 = Math.floor(Math.random() * 25) + 10;
                answer = num1 * num2;
                question = `${num1} × ${num2} = ?`;
                break;
            case 'division':
                num2 = Math.floor(Math.random() * 15) + 5;
                answer = Math.floor(Math.random() * 20) + 5;
                num1 = num2 * answer;
                question = `${num1} ÷ ${num2} = ?`;
                break;
            default:
                num1 = Math.floor(Math.random() * 100) + 50;
                num2 = Math.floor(Math.random() * 100) + 50;
                answer = num1 + num2;
                question = `${num1} + ${num2} = ?`;
        }

        return {
            question,
            correct_answer: answer.toString(),
            difficulty: 'medium',
            operation: selectedOp,
            explanation: `${question.replace('?', answer)}`
        };
    }

    // โจทย์ระดับยาก
    generateHardProblem(operation) {
        const operations = operation === 'random' ? ['multiplication', 'division', 'mixed'] : [operation];
        const selectedOp = operations[Math.floor(Math.random() * operations.length)];
        
        let question, answer;

        switch (selectedOp) {
            case 'multiplication':
                const num1 = Math.floor(Math.random() * 99) + 51;
                const num2 = Math.floor(Math.random() * 99) + 51;
                answer = num1 * num2;
                question = `${num1} × ${num2} = ?`;
                break;
            case 'division':
                const divisor = Math.floor(Math.random() * 25) + 15;
                const quotient = Math.floor(Math.random() * 50) + 25;
                const dividend = divisor * quotient;
                answer = quotient;
                question = `${dividend} ÷ ${divisor} = ?`;
                break;
            case 'mixed':
                // สมการแบบผสม เช่น (a + b) × c
                const a = Math.floor(Math.random() * 20) + 5;
                const b = Math.floor(Math.random() * 20) + 5;
                const c = Math.floor(Math.random() * 10) + 2;
                answer = (a + b) * c;
                question = `(${a} + ${b}) × ${c} = ?`;
                break;
            default:
                const n1 = Math.floor(Math.random() * 50) + 25;
                const n2 = Math.floor(Math.random() * 50) + 25;
                answer = n1 * n2;
                question = `${n1} × ${n2} = ?`;
        }

        return {
            question,
            correct_answer: answer.toString(),
            difficulty: 'hard',
            operation: selectedOp,
            explanation: `${question.replace('?', answer)}`
        };
    }

    // โจทย์ระดับผู้เชี่ยวชาญ
    generateExpertProblem(operation) {
        const problems = [
            // โจทย์รากที่สอง
            () => {
                const perfectSquares = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225];
                const square = perfectSquares[Math.floor(Math.random() * perfectSquares.length)];
                const answer = Math.sqrt(square);
                return {
                    question: `√${square} = ?`,
                    correct_answer: answer.toString(),
                    operation: 'square_root'
                };
            },
            // โจทย์เลขยกกำลัง
            () => {
                const base = Math.floor(Math.random() * 8) + 2;
                const power = Math.floor(Math.random() * 4) + 2;
                const answer = Math.pow(base, power);
                return {
                    question: `${base}^${power} = ?`,
                    correct_answer: answer.toString(),
                    operation: 'exponent'
                };
            },
            // โจทย์เปอร์เซ็นต์
            () => {
                const percentage = [10, 15, 20, 25, 30, 40, 50, 75][Math.floor(Math.random() * 8)];
                const number = Math.floor(Math.random() * 400) + 100;
                const answer = (number * percentage) / 100;
                return {
                    question: `${percentage}% ของ ${number} = ?`,
                    correct_answer: answer.toString(),
                    operation: 'percentage'
                };
            }
        ];

        const selectedProblem = problems[Math.floor(Math.random() * problems.length)]();
        
        return {
            question: selectedProblem.question,
            correct_answer: selectedProblem.correct_answer,
            difficulty: 'expert',
            operation: selectedProblem.operation,
            explanation: `${selectedProblem.question.replace('?', selectedProblem.correct_answer)}`
        };
    }

    // บันทึกคำตอบผู้ใช้ (Alias สำหรับ createMathProblem)
    async saveMathAnswer(problemData) {
        return await this.createMathProblem(problemData);
    }

    // ============================================
    // ADVANCED FEATURES - ฟีเจอร์ขั้นสูง
    // ============================================

    // ดึงประวัติการทำโจทย์ (Alias สำหรับ listMathProblems)
    async getMathHistory(userId, page = 1, limit = 20, filters = {}) {
        const result = await this.listMathProblems(userId, { page, limit, ...filters });
        
        if (result.success) {
            return {
                success: true,
                data: result.data.problems,
                pagination: result.data.pagination
            };
        }
        
        return result;
    }

    // ดึงสถิติการทำโจทย์
    async getMathStats(userId) {
        try {
            const { data: problems } = await this.supabase
                .from('math_problems')
                .select('*')
                .eq('user_id', userId);

            if (!problems || problems.length === 0) {
                return { 
                    success: true, 
                    data: { 
                        total: 0,
                        correct: 0,
                        accuracy: 0,
                        byDifficulty: {},
                        byOperation: {},
                        averageTime: 0
                    } 
                };
            }

            const stats = {
                total: problems.length,
                correct: problems.filter(p => p.is_correct).length,
                accuracy: 0,
                byDifficulty: {},
                byOperation: {},
                averageTime: 0
            };

            // คำนวณความแม่นยำ
            stats.accuracy = parseFloat((stats.correct / stats.total * 100).toFixed(2));

            // สถิติตามความยาก
            problems.forEach(problem => {
                const difficulty = problem.difficulty || 'easy';
                stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;
            });

            // สถิติตามการคำนวณ
            problems.forEach(problem => {
                const operation = problem.category || 'arithmetic';
                stats.byOperation[operation] = (stats.byOperation[operation] || 0) + 1;
            });

            // เวลาเฉลี่ย
            const timesSpent = problems
                .filter(p => p.time_taken_seconds)
                .map(p => parseFloat(p.time_taken_seconds));
            
            if (timesSpent.length > 0) {
                stats.averageTime = parseFloat(
                    (timesSpent.reduce((a, b) => a + b, 0) / timesSpent.length).toFixed(2)
                );
            }

            return { success: true, data: stats };
        } catch (error) {
            console.error('getMathStats error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงโจทย์ที่ทำผิด
    async getIncorrectProblems(userId, limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('math_problems')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('user_id', userId)
                .eq('is_correct', false)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('getIncorrectProblems error:', error);
            return { success: false, error: error.message };
        }
    }

    // ค้นหาโจทย์
    async searchMathProblems(userId, searchTerm, options = {}) {
        try {
            const searchOptions = {
                ...options,
                search: searchTerm,
                limit: options.limit || 50
            };

            return await this.listMathProblems(userId, searchOptions);
        } catch (error) {
            console.error('searchMathProblems error:', error);
            return { success: false, error: error.message };
        }
    }

    // สร้างโจทย์ทบทวน
    async generateReviewProblems(userId, count = 5) {
        try {
            // ดึงโจทย์ที่ทำผิดล่าสุด
            const incorrectResult = await this.getIncorrectProblems(userId, count * 2);
            
            if (!incorrectResult.success || incorrectResult.data.length === 0) {
                // ถ้าไม่มีโจทย์ที่ทำผิด ให้สร้างโจทย์ใหม่แบบสุ่ม
                const reviewProblems = [];
                for (let i = 0; i < count; i++) {
                    const difficulty = ['easy', 'medium'][Math.floor(Math.random() * 2)];
                    const problemResult = await this.generateMathProblem(difficulty);
                    if (problemResult.success) {
                        reviewProblems.push(problemResult.data);
                    }
                }
                return { success: true, data: reviewProblems };
            }

            // สร้างโจทย์ที่คล้ายกับที่ทำผิด
            const reviewProblems = [];
            const incorrectProblems = incorrectResult.data.slice(0, count);

            for (const incorrect of incorrectProblems) {
                const difficulty = incorrect.difficulty || 'easy';
                const operation = incorrect.category || 'addition';
                
                const problemResult = await this.generateMathProblem(difficulty, operation);
                if (problemResult.success) {
                    reviewProblems.push({
                        ...problemResult.data,
                        review_type: 'similar_to_incorrect',
                        original_problem_id: incorrect.id
                    });
                }
            }

            return { success: true, data: reviewProblems };
        } catch (error) {
            console.error('generateReviewProblems error:', error);
            return { success: false, error: error.message };
        }
    }

    // ดึงโจทย์ที่ดีที่สุด
    async getBestPerformances(userId, limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('math_problems')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name, avatar_url)
                `)
                .eq('user_id', userId)
                .eq('is_correct', true)
                .not('time_taken_seconds', 'is', null)
                .order('time_taken_seconds', { ascending: true })
                .order('difficulty', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('getBestPerformances error:', error);
            return { success: false, error: error.message };
        }
    }

    // ส่งออกข้อมูล
    async exportMathProblems(userId, format = 'json') {
        try {
            const { data: problems } = await this.supabase
                .from('math_problems')
                .select(`
                    *,
                    user:user_id(id, first_name, last_name, display_name)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (format === 'csv') {
                const csvData = problems.map(problem => ({
                    วันที่: new Date(problem.created_at).toLocaleDateString('th-TH'),
                    โจทย์: problem.problem_text,
                    คำตอบที่ถูก: problem.correct_answer,
                    คำตอบของคุณ: problem.user_answer,
                    ถูกต้อง: problem.is_correct ? 'ใช่' : 'ไม่',
                    ความยาก: problem.difficulty,
                    ประเภท: problem.category,
                    เวลาที่ใช้: problem.time_taken_seconds ? `${problem.time_taken_seconds} วินาที` : '-'
                }));
                
                return { success: true, data: csvData, format: 'csv' };
            }

            return { success: true, data: problems, format: 'json' };
        } catch (error) {
            console.error('exportMathProblems error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = MathService;
