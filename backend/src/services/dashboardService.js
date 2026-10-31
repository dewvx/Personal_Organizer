const { query } = require('../config/database');
const EntryModel = require('../models/entryModel');
const CategoryModel = require('../models/categoryModel');
const GoalModel = require('../models/goalModel');

const DashboardService = {
  async getSummary() {
    const summaryData = await EntryModel.getDashboardSummary();
    const categories = await CategoryModel.findAll();

    return {
      ...summaryData,
      categories,
    };
  },

  async getMonthlyReport({ year, month } = {}) {
    const now = new Date();
    const targetYear = parseInt(year, 10) || now.getFullYear();
    const targetMonth = parseInt(month, 10) || (now.getMonth() + 1); // 1-12

    // Target month date range
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Previous month date range
    const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`;

    // 1. Task Metrics for target month
    const taskSql = `
      SELECT
        COUNT(*)::int AS total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::int AS in_progress_tasks,
        COALESCE(SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END), 0)::float AS current_expense
      FROM entries
      WHERE (entry_date >= $1 AND entry_date <= $2)
    `;
    const taskRes = await query(taskSql, [startDate, endDate]);
    const taskMetrics = taskRes.rows[0];
    const completionRate = taskMetrics.total_tasks > 0
      ? Math.round((taskMetrics.completed_tasks / taskMetrics.total_tasks) * 100)
      : 0;

    // 2. Previous Month Expense
    const prevExpenseSql = `
      SELECT COALESCE(SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END), 0)::float AS prev_expense
      FROM entries
      WHERE (entry_date >= $1 AND entry_date <= $2)
    `;
    const prevExpenseRes = await query(prevExpenseSql, [prevStartDate, prevEndDate]);
    const prevExpense = prevExpenseRes.rows[0]?.prev_expense || 0;
    const currentExpense = taskMetrics.current_expense || 0;
    const expenseDiff = currentExpense - prevExpense;
    const expenseDiffPercent = prevExpense > 0
      ? Math.round((expenseDiff / prevExpense) * 100)
      : null;

    // 3. Category Expense Breakdown
    const catExpenseSql = `
      SELECT
        c.id,
        COALESCE(c.name, 'ไม่มีหมวดหมู่') AS category_name,
        COALESCE(c.color, '#64748B') AS category_color,
        COALESCE(c.icon, 'folder') AS category_icon,
        c.monthly_budget,
        COUNT(e.id)::int AS entry_count,
        COALESCE(SUM(e.amount), 0)::float AS total_amount
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE (e.entry_date >= $1 AND e.entry_date <= $2)
        AND e.amount IS NOT NULL AND e.amount > 0
      GROUP BY c.id, c.name, c.color, c.icon, c.monthly_budget
      ORDER BY total_amount DESC
    `;
    const catExpenseRes = await query(catExpenseSql, [startDate, endDate]);
    const categoriesBreakdown = catExpenseRes.rows.map((row) => {
      const budget = row.monthly_budget ? parseFloat(row.monthly_budget) : null;
      const budgetPercent = budget && budget > 0 ? Math.round((row.total_amount / budget) * 100) : null;
      const percentOfTotal = currentExpense > 0 ? Math.round((row.total_amount / currentExpense) * 100) : 0;
      return {
        ...row,
        monthly_budget: budget,
        budget_percent: budgetPercent,
        percent_of_total: percentOfTotal,
        is_over_budget: budget ? row.total_amount > budget : false,
      };
    });

    // 4. Habit consistency in target month
    const habitSql = `
      SELECT
        COUNT(*)::int AS total_logs,
        COUNT(CASE WHEN is_completed = true THEN 1 END)::int AS completed_logs
      FROM habit_logs
      WHERE log_date >= $1 AND log_date <= $2
    `;
    const habitRes = await query(habitSql, [startDate, endDate]);
    const habitRow = habitRes.rows[0];
    const habitConsistencyRate = habitRow.total_logs > 0
      ? Math.round((habitRow.completed_logs / habitRow.total_logs) * 100)
      : 0;

    // 5. Goals summary
    const goals = await GoalModel.findAll();

    // 6. Top Accomplishments (completed entries in the month)
    const accomplishmentsSql = `
      SELECT e.id, e.title, e.amount, e.entry_date, c.name AS category_name, c.color AS category_color
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE (e.entry_date >= $1 AND e.entry_date <= $2)
        AND e.status = 'completed'
      ORDER BY e.entry_date DESC, e.id DESC
      LIMIT 10
    `;
    const accomplishmentsRes = await query(accomplishmentsSql, [startDate, endDate]);

    return {
      period: {
        year: targetYear,
        month: targetMonth,
        startDate,
        endDate,
      },
      tasks: {
        total: taskMetrics.total_tasks,
        completed: taskMetrics.completed_tasks,
        pending: taskMetrics.pending_tasks,
        in_progress: taskMetrics.in_progress_tasks,
        completionRate,
      },
      financials: {
        currentExpense,
        prevExpense,
        expenseDiff,
        expenseDiffPercent,
        categories: categoriesBreakdown,
      },
      habits: {
        totalLogs: habitRow.total_logs,
        completedLogs: habitRow.completed_logs,
        consistencyRate: habitConsistencyRate,
      },
      goals,
      accomplishments: accomplishmentsRes.rows,
    };
  },

  async getLayout() {
    const res = await query(`SELECT layout_config FROM dashboard_layouts WHERE id = 1 LIMIT 1`);
    if (res.rows.length > 0 && res.rows[0].layout_config) {
      return res.rows[0].layout_config;
    }
    return [
      { id: 'stats', label: 'สถิติภาพรวม (Summary Stats)', visible: true, order: 1 },
      { id: 'habits', label: 'กิจวัตรประจำวัน (Daily Habits)', visible: true, order: 2 },
      { id: 'goals', label: 'เป้าหมายชีวิต (Life Goals)', visible: true, order: 3 },
      { id: 'urgent_tasks', label: 'งานด่วนและใกล้ถึงกำหนด (Urgent Tasks)', visible: true, order: 4 },
      { id: 'budget', label: 'งบประมาณรายจ่าย (Category Budgets)', visible: true, order: 5 },
      { id: 'recent_entries', label: 'รายการล่าสุด (Recent Lists)', visible: true, order: 6 },
    ];
  },

  async updateLayout(layoutConfig) {
    const formatted = Array.isArray(layoutConfig) ? JSON.stringify(layoutConfig) : '[]';
    await query(
      `INSERT INTO dashboard_layouts (id, layout_config, updated_at)
       VALUES (1, $1, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET layout_config = EXCLUDED.layout_config, updated_at = CURRENT_TIMESTAMP`,
      [formatted]
    );
    return this.getLayout();
  },
};

module.exports = DashboardService;
