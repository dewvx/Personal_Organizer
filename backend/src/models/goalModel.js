const { query } = require('../config/database');

const GoalModel = {
  /**
   * Find all goals with aggregated tasks, amounts, and progress metrics
   */
  async findAll({ status } = {}) {
    const conditions = [];
    const values = [];
    let counter = 1;

    if (status && status !== 'all') {
      conditions.push(`g.status = $${counter++}`);
      values.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const text = `
      SELECT 
        g.id,
        g.title,
        g.description,
        g.target_date,
        g.target_amount,
        g.status,
        g.color,
        g.icon,
        g.created_at,
        g.updated_at,
        COUNT(e.id)::int AS total_tasks,
        COUNT(CASE WHEN e.status = 'completed' THEN 1 END)::int AS completed_tasks,
        COALESCE(SUM(CASE WHEN e.amount IS NOT NULL THEN e.amount ELSE 0 END), 0)::float AS current_amount,
        CASE 
          WHEN g.target_date IS NOT NULL THEN (g.target_date - CURRENT_DATE)
          ELSE NULL 
        END AS days_remaining
      FROM goals g
      LEFT JOIN entries e ON g.id = e.goal_id AND e.is_archived = false
      ${whereClause}
      GROUP BY g.id
      ORDER BY 
        CASE WHEN g.status = 'active' THEN 1 WHEN g.status = 'paused' THEN 2 ELSE 3 END,
        g.target_date ASC NULLS LAST,
        g.created_at DESC
    `;

    const res = await query(text, values);

    return res.rows.map((goal) => {
      const totalTasks = goal.total_tasks || 0;
      const completedTasks = goal.completed_tasks || 0;
      const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const targetAmount = goal.target_amount ? parseFloat(goal.target_amount) : null;
      const currentAmount = goal.current_amount || 0;
      const amountProgress = targetAmount && targetAmount > 0
        ? Math.min(Math.round((currentAmount / targetAmount) * 100), 100)
        : null;

      // Overall progress: prioritize amount progress if target_amount exists, else task progress
      const overallProgress = targetAmount && targetAmount > 0
        ? (amountProgress !== null ? amountProgress : 0)
        : taskProgress;

      return {
        ...goal,
        target_amount: targetAmount,
        task_progress: taskProgress,
        amount_progress: amountProgress,
        overall_progress: overallProgress,
        is_overdue: goal.target_date && goal.days_remaining !== null ? goal.days_remaining < 0 && goal.status === 'active' : false,
      };
    });
  },

  /**
   * Find goal by id
   */
  async findById(id) {
    const goals = await this.findAll();
    return goals.find((g) => g.id === parseInt(id, 10)) || null;
  },

  /**
   * Create goal
   */
  async create({
    title,
    description,
    target_date,
    target_amount,
    status = 'active',
    color = '#6366F1',
    icon = 'target',
  }) {
    const text = `
      INSERT INTO goals (title, description, target_date, target_amount, status, color, icon)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      title.trim(),
      description ? description.trim() : null,
      target_date || null,
      target_amount !== undefined && target_amount !== '' && target_amount !== null ? parseFloat(target_amount) : null,
      status || 'active',
      color || '#6366F1',
      icon || 'target',
    ];
    const res = await query(text, values);
    return this.findById(res.rows[0].id);
  },

  /**
   * Update goal
   */
  async update(id, data) {
    const fields = [];
    const values = [];
    let counter = 1;

    const allowed = ['title', 'description', 'target_date', 'target_amount', 'status', 'color', 'icon'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${counter++}`);
        if (key === 'title') {
          values.push(data[key].trim());
        } else if (key === 'description') {
          values.push(data[key] ? data[key].trim() : null);
        } else if (key === 'target_amount') {
          values.push(data[key] !== '' && data[key] !== null ? parseFloat(data[key]) : null);
        } else {
          values.push(data[key] || null);
        }
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const text = `
      UPDATE goals
      SET ${fields.join(', ')}
      WHERE id = $${counter}
      RETURNING id
    `;
    await query(text, values);
    return this.findById(id);
  },

  /**
   * Delete goal
   */
  async delete(id) {
    const res = await query('DELETE FROM goals WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  },

  /**
   * Get entries linked to a goal
   */
  async getGoalEntries(goalId) {
    const text = `
      SELECT e.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.goal_id = $1 AND e.is_archived = false
      ORDER BY e.status ASC, e.due_date ASC NULLS LAST, e.created_at DESC
    `;
    const res = await query(text, [goalId]);
    return res.rows;
  },
};

module.exports = GoalModel;
