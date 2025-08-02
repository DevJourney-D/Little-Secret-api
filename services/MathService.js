// Math Service - จัดการโจทย์คณิตศาสตร์
const { createClient } = require('@supabase/supabase-js');

class MathService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

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

    // บันทึกคำตอบผู้ใช้
    async saveMathAnswer(problemData) {
        try {
            const { data, error } = await this.supabase
                .from('math_problems')
                .insert([{
                    user_id: problemData.user_id,
                    problem_type: problemData.operation,
                    question: problemData.question,
                    correct_answer: problemData.correct_answer,
                    user_answer: problemData.user_answer,
                    is_correct: problemData.user_answer === problemData.correct_answer,
                    difficulty: problemData.difficulty,
                    time_spent: problemData.time_spent,
                    operation: problemData.operation,
                    hints_used: problemData.hints_used || 0,
                    attempts: problemData.attempts || 1,
                    explanation: problemData.explanation
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงประวัติการทำโจทย์
    async getMathHistory(userId, page = 1, limit = 20, filters = {}) {
        try {
            const offset = (page - 1) * limit;

            let query = this.supabase
                .from('math_problems')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);

            // กรองตามความยาก
            if (filters.difficulty) {
                query = query.eq('difficulty', filters.difficulty);
            }

            // กรองตามประเภทการคำนวณ
            if (filters.operation) {
                query = query.eq('operation', filters.operation);
            }

            // กรองตามความถูกต้อง
            if (filters.is_correct !== undefined) {
                query = query.eq('is_correct', filters.is_correct);
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return { 
                success: true, 
                data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
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
            stats.accuracy = (stats.correct / stats.total * 100).toFixed(2);

            // สถิติตามความยาก
            problems.forEach(problem => {
                const difficulty = problem.difficulty;
                if (!stats.byDifficulty[difficulty]) {
                    stats.byDifficulty[difficulty] = { total: 0, correct: 0 };
                }
                stats.byDifficulty[difficulty].total++;
                if (problem.is_correct) {
                    stats.byDifficulty[difficulty].correct++;
                }
            });

            // สถิติตามการคำนวณ
            problems.forEach(problem => {
                const operation = problem.operation;
                if (!stats.byOperation[operation]) {
                    stats.byOperation[operation] = { total: 0, correct: 0 };
                }
                stats.byOperation[operation].total++;
                if (problem.is_correct) {
                    stats.byOperation[operation].correct++;
                }
            });

            // เวลาเฉลี่ย
            const timesSpent = problems.filter(p => p.time_spent).map(p => parseFloat(p.time_spent));
            if (timesSpent.length > 0) {
                stats.averageTime = (timesSpent.reduce((a, b) => a + b, 0) / timesSpent.length).toFixed(2);
            }

            return { success: true, data: stats };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ดึงโจทย์ที่ทำผิด
    async getIncorrectProblems(userId, limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('math_problems')
                .select('*')
                .eq('user_id', userId)
                .eq('is_correct', false)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // สร้างโจทย์ทบทวน
    async generateReviewProblems(userId, count = 5) {
        try {
            // ดึงโจทย์ที่ทำผิดล่าสุด
            const incorrectResult = await this.getIncorrectProblems(userId, count * 2);
            
            if (!incorrectResult.success || incorrectResult.data.length === 0) {
                // ถ้าไม่มีโจทย์ที่ทำผิด ให้สร้างโจทย์ใหม่
                const problems = [];
                for (let i = 0; i < count; i++) {
                    const problem = await this.generateMathProblem('medium');
                    if (problem.success) {
                        problems.push(problem.data);
                    }
                }
                return { success: true, data: problems };
            }

            // สร้างโจทย์ที่คล้ายกับที่ทำผิด
            const reviewProblems = [];
            const incorrectProblems = incorrectResult.data.slice(0, count);

            for (const incorrect of incorrectProblems) {
                const similarProblem = await this.generateMathProblem(incorrect.difficulty, incorrect.operation);
                if (similarProblem.success) {
                    reviewProblems.push({
                        ...similarProblem.data,
                        review_for: incorrect.id
                    });
                }
            }

            return { success: true, data: reviewProblems };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = MathService;
