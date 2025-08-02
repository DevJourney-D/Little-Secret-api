// Math Controller - จัดการ API endpoints สำหรับระบบแบบฝึกหัดคณิตศาสตร์
const MathService = require('../services/MathService');

class MathController {
    constructor() {
        this.mathService = new MathService();
    }

    // API สำหรับสร้างโจทย์คณิตศาสตร์
    async generateProblem(req, res) {
        try {
            const { difficulty = 'easy', topic = 'arithmetic' } = req.body;
            const userId = req.user.id;

            const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
            const validTopics = ['arithmetic', 'algebra', 'geometry', 'fractions'];

            if (!validDifficulties.includes(difficulty)) {
                return res.status(400).json({
                    success: false,
                    error: 'ระดับความยากไม่ถูกต้อง'
                });
            }

            if (!validTopics.includes(topic)) {
                return res.status(400).json({
                    success: false,
                    error: 'หัวข้อไม่ถูกต้อง'
                });
            }

            const result = await this.mathService.generateMathProblem(userId, difficulty, topic);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถสร้างโจทย์ได้',
                    details: result.error
                });
            }

            res.json({
                success: true,
                data: result.data
            });

        } catch (error) {
            console.error('Error in generateProblem:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการสร้างโจทย์',
                details: error.message
            });
        }
    }

    // API สำหรับส่งคำตอบ
    async submitAnswer(req, res) {
        try {
            const { problemId, userAnswer, timeSpent } = req.body;
            const userId = req.user.id;

            if (!problemId || userAnswer === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'กรุณาระบุ ID โจทย์และคำตอบ'
                });
            }

            const result = await this.mathService.saveMathAnswer(
                userId, 
                problemId, 
                userAnswer, 
                timeSpent || 0
            );

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถบันทึกคำตอบได้',
                    details: result.error
                });
            }

            res.json({
                success: true,
                data: result.data
            });

        } catch (error) {
            console.error('Error in submitAnswer:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการส่งคำตอบ',
                details: error.message
            });
        }
    }

    // API สำหรับดึงประวัติการทำแบบฝึกหัด
    async getMathHistory(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const difficulty = req.query.difficulty;
            const topic = req.query.topic;

            const result = await this.mathService.getMathHistory(
                userId, 
                page, 
                limit, 
                { difficulty, topic }
            );

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถดึงประวัติได้',
                    details: result.error
                });
            }

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });

        } catch (error) {
            console.error('Error in getMathHistory:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการดึงประวัติ',
                details: error.message
            });
        }
    }

    // API สำหรับดึงสถิติการเรียนรู้
    async getMathStats(req, res) {
        try {
            const userId = req.user.id;
            const period = req.query.period || 'all'; // all, week, month

            const result = await this.mathService.getMathStats(userId, period);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถดึงสถิติได้',
                    details: result.error
                });
            }

            res.json({
                success: true,
                data: result.data
            });

        } catch (error) {
            console.error('Error in getMathStats:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการดึงสถิติ',
                details: error.message
            });
        }
    }

    // API สำหรับสร้างโจทย์ทบทวน
    async generateReviewProblems(req, res) {
        try {
            const userId = req.user.id;
            const { count = 5, focusTopic } = req.body;

            if (count > 20) {
                return res.status(400).json({
                    success: false,
                    error: 'จำนวนโจทย์ไม่สามารถเกิน 20 ข้อ'
                });
            }

            const result = await this.mathService.generateReviewProblems(userId, count, focusTopic);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถสร้างโจทย์ทบทวนได้',
                    details: result.error
                });
            }

            res.json({
                success: true,
                data: result.data
            });

        } catch (error) {
            console.error('Error in generateReviewProblems:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการสร้างโจทย์ทบทวน',
                details: error.message
            });
        }
    }

    // API สำหรับดึงโจทย์ที่ตอบผิด
    async getIncorrectProblems(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 10, 50);

            const offset = (page - 1) * limit;

            const { data, error, count } = await this.mathService.supabase
                .from('math_answers')
                .select(`
                    *,
                    math_problems (*)
                `, { count: 'exact' })
                .eq('user_id', userId)
                .eq('is_correct', false)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถดึงข้อมูลได้',
                    details: error.message
                });
            }

            res.json({
                success: true,
                data: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });

        } catch (error) {
            console.error('Error in getIncorrectProblems:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการดึงโจทย์ที่ตอบผิด',
                details: error.message
            });
        }
    }

    // API สำหรับดึงแนวโน้มการเรียนรู้
    async getLearningTrend(req, res) {
        try {
            const userId = req.user.id;
            const days = parseInt(req.query.days) || 30;

            if (days > 365) {
                return res.status(400).json({
                    success: false,
                    error: 'ช่วงเวลาไม่สามารถเกิน 365 วัน'
                });
            }

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data, error } = await this.mathService.supabase
                .from('math_answers')
                .select('created_at, is_correct, time_spent, math_problems(difficulty, topic)')
                .eq('user_id', userId)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            if (error) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถดึงข้อมูลแนวโน้มได้',
                    details: error.message
                });
            }

            // วิเคราะห์ข้อมูลแนวโน้ม
            const dailyStats = {};
            
            (data || []).forEach(answer => {
                const date = answer.created_at.split('T')[0];
                if (!dailyStats[date]) {
                    dailyStats[date] = {
                        total: 0,
                        correct: 0,
                        totalTime: 0,
                        avgTime: 0
                    };
                }
                
                dailyStats[date].total++;
                if (answer.is_correct) dailyStats[date].correct++;
                dailyStats[date].totalTime += answer.time_spent || 0;
                dailyStats[date].avgTime = dailyStats[date].totalTime / dailyStats[date].total;
            });

            // แปลงข้อมูลเป็นรูปแบบ array สำหรับ chart
            const trendData = Object.entries(dailyStats).map(([date, stats]) => ({
                date,
                accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
                problemsCount: stats.total,
                averageTime: Math.round(stats.avgTime)
            }));

            res.json({
                success: true,
                data: {
                    period: `${days} วันที่ผ่านมา`,
                    trend: trendData,
                    summary: {
                        totalDays: Object.keys(dailyStats).length,
                        totalProblems: (data || []).length,
                        overallAccuracy: data && data.length > 0 
                            ? (data.filter(a => a.is_correct).length / data.length) * 100 
                            : 0
                    }
                }
            });

        } catch (error) {
            console.error('Error in getLearningTrend:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการดึงแนวโน้มการเรียนรู้',
                details: error.message
            });
        }
    }

    // API สำหรับลบประวัติการทำแบบฝึกหัด
    async deleteMathHistory(req, res) {
        try {
            const userId = req.user.id;
            const { answerIds } = req.body;

            if (!answerIds || !Array.isArray(answerIds) || answerIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'กรุณาระบุ ID ของคำตอบที่ต้องการลบ'
                });
            }

            // ลบคำตอบที่เลือก
            const { error } = await this.mathService.supabase
                .from('math_answers')
                .delete()
                .eq('user_id', userId)
                .in('id', answerIds);

            if (error) {
                return res.status(500).json({
                    success: false,
                    error: 'ไม่สามารถลบประวัติได้',
                    details: error.message
                });
            }

            res.json({
                success: true,
                message: `ลบประวัติ ${answerIds.length} รายการเรียบร้อยแล้ว`
            });

        } catch (error) {
            console.error('Error in deleteMathHistory:', error);
            res.status(500).json({
                success: false,
                error: 'เกิดข้อผิดพลาดในการลบประวัติ',
                details: error.message
            });
        }
    }
}

module.exports = MathController;
