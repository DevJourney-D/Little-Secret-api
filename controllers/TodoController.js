// Todo Controller - API endpoints สำหรับจัดการรายการสิ่งที่ต้องทำ
const TodoService = require('../services/TodoService');
const UserService = require('../services/UserService');

class TodoController {
    constructor() {
        this.todoService = new TodoService();
        this.userService = new UserService();
    }

    // สร้างรายการใหม่
    async createTodo(req, res) {
        try {
            const { userId } = req.params;
            const todoData = { ...req.body, user_id: userId };
            
            const result = await this.todoService.createTodo(todoData);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'todo_created', {
                    todo_id: result.data.id,
                    title: result.data.title,
                    category: result.data.category,
                    priority: result.data.priority,
                    shared_with_partner: result.data.shared_with_partner
                }, req);

                res.status(201).json({
                    success: true,
                    message: 'สร้างรายการสำเร็จ',
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการสร้างรายการ',
                error: error.message
            });
        }
    }

    // ดึงรายการทั้งหมดของผู้ใช้
    async getUserTodos(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20, status, priority, category, shared_with_partner, due_date_from, due_date_to, tags } = req.query;
            
            const filters = {};
            if (status) filters.status = status;
            if (priority) filters.priority = priority;
            if (category) filters.category = category;
            if (shared_with_partner !== undefined) filters.shared_with_partner = shared_with_partner === 'true';
            if (due_date_from) filters.due_date_from = due_date_from;
            if (due_date_to) filters.due_date_to = due_date_to;
            if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
            
            const result = await this.todoService.getUserTodos(userId, filters, parseInt(page), parseInt(limit));
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    pagination: result.pagination
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงรายการ',
                error: error.message
            });
        }
    }

    // ดึงรายการที่แชร์กับคู่รัก
    async getSharedTodos(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            const result = await this.todoService.getSharedTodos(userId, parseInt(page), parseInt(limit));
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    pagination: result.pagination
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงรายการที่แชร์',
                error: error.message
            });
        }
    }

    // ดึงรายการตาม ID
    async getTodoById(req, res) {
        try {
            const { userId, todoId } = req.params;
            
            const result = await this.todoService.getTodoById(todoId, userId);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงรายการ',
                error: error.message
            });
        }
    }

    // อัปเดตรายการ
    async updateTodo(req, res) {
        try {
            const { userId, todoId } = req.params;
            
            const result = await this.todoService.updateTodo(todoId, userId, req.body);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'todo_updated', {
                    todo_id: todoId,
                    title: result.data.title,
                    updated_fields: Object.keys(req.body)
                }, req);

                res.json({
                    success: true,
                    message: 'อัปเดตรายการสำเร็จ',
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการอัปเดตรายการ',
                error: error.message
            });
        }
    }

    // ลบรายการ
    async deleteTodo(req, res) {
        try {
            const { userId, todoId } = req.params;
            
            const result = await this.todoService.deleteTodo(todoId, userId);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'todo_deleted', {
                    todo_id: todoId
                }, req);

                res.json({
                    success: true,
                    message: 'ลบรายการสำเร็จ'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการลบรายการ',
                error: error.message
            });
        }
    }

    // ทำเครื่องหมายเสร็จสิ้น/ยกเลิก
    async toggleCompleted(req, res) {
        try {
            const { userId, todoId } = req.params;
            const { completed = true } = req.body;
            
            const result = await this.todoService.toggleCompleted(todoId, userId, completed);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, completed ? 'todo_completed' : 'todo_uncompleted', {
                    todo_id: todoId,
                    title: result.data.title
                }, req);

                res.json({
                    success: true,
                    message: completed ? 'ทำเครื่องหมายเสร็จสิ้นสำเร็จ' : 'ยกเลิกการทำเครื่องหมายเสร็จสิ้น',
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการทำเครื่องหมายเสร็จสิ้น',
                error: error.message
            });
        }
    }

    // ค้นหารายการ
    async searchTodos(req, res) {
        try {
            const { userId } = req.params;
            const { q, status, category, priority, tags } = req.query;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาใส่คำค้นหาอย่างน้อย 2 ตัวอักษร'
                });
            }

            const filters = {};
            if (status) filters.status = status;
            if (category) filters.category = category;
            if (priority) filters.priority = priority;
            if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
            
            const result = await this.todoService.searchTodos(userId, q, filters);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'todos_searched', {
                    search_term: q,
                    filters: filters,
                    results_count: result.data.length
                }, req);

                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการค้นหารายการ',
                error: error.message
            });
        }
    }

    // ดึงรายการที่ใกล้ครบกำหนด
    async getUpcomingTodos(req, res) {
        try {
            const { userId } = req.params;
            const { days = 7 } = req.query;
            
            const result = await this.todoService.getUpcomingTodos(userId, parseInt(days));
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงรายการที่ใกล้ครบกำหนด',
                error: error.message
            });
        }
    }

    // ดึงสถิติรายการ
    async getTodoStats(req, res) {
        try {
            const { userId } = req.params;
            
            const result = await this.todoService.getTodoStats(userId);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงสถิติรายการ',
                error: error.message
            });
        }
    }

    // ดึงรายการที่มี reminder
    async getTodosWithReminders(req, res) {
        try {
            const { userId } = req.params;
            
            const result = await this.todoService.getTodosWithReminders(userId);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงรายการที่มี reminder',
                error: error.message
            });
        }
    }

    // ดึงรายการตามหมวดหมู่
    async getTodosByCategory(req, res) {
        try {
            const { userId, category } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            const filters = { category };
            const result = await this.todoService.getUserTodos(userId, filters, parseInt(page), parseInt(limit));
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    pagination: result.pagination
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงรายการตามหมวดหมู่',
                error: error.message
            });
        }
    }

    // ดึงรายการตามความสำคัญ
    async getTodosByPriority(req, res) {
        try {
            const { userId, priority } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            const filters = { priority };
            const result = await this.todoService.getUserTodos(userId, filters, parseInt(page), parseInt(limit));
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    pagination: result.pagination
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงรายการตามความสำคัญ',
                error: error.message
            });
        }
    }

    // ดึงรายการตามสถานะ
    async getTodosByStatus(req, res) {
        try {
            const { userId, status } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            const filters = { status };
            const result = await this.todoService.getUserTodos(userId, filters, parseInt(page), parseInt(limit));
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    pagination: result.pagination
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงรายการตามสถานะ',
                error: error.message
            });
        }
    }

    // Export รายการเป็น JSON
    async exportTodos(req, res) {
        try {
            const { userId } = req.params;
            const { format = 'json', status } = req.query;
            
            const filters = {};
            if (status) filters.status = status;
            
            // ดึงรายการทั้งหมด
            const result = await this.todoService.getUserTodos(userId, filters, 1, 1000);
            
            if (result.success) {
                // บันทึก activity log
                await this.userService.logActivity(userId, 'todos_exported', {
                    format: format,
                    count: result.data.length,
                    filters: filters
                }, req);

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="todos_${userId}_${new Date().toISOString().split('T')[0]}.json"`);
                
                res.json({
                    success: true,
                    export_date: new Date().toISOString(),
                    user_id: userId,
                    total_todos: result.data.length,
                    filters: filters,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการ Export รายการ',
                error: error.message
            });
        }
    }

    // สรุปรายการสำหรับ Dashboard
    async getTodoSummary(req, res) {
        try {
            const { userId } = req.params;
            
            // ดึงข้อมูลพร้อมกัน
            const [statsResult, upcomingResult, overdueResult] = await Promise.all([
                this.todoService.getTodoStats(userId),
                this.todoService.getUpcomingTodos(userId, 7),
                this.todoService.getUpcomingTodos(userId, -1) // รายการที่เลยกำหนดแล้ว
            ]);
            
            if (statsResult.success && upcomingResult.success && overdueResult.success) {
                res.json({
                    success: true,
                    data: {
                        stats: statsResult.data,
                        upcoming: upcomingResult.data,
                        overdue: overdueResult.data.filter(todo => new Date(todo.due_date) < new Date())
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปรายการ',
                error: error.message
            });
        }
    }
}

module.exports = TodoController;
