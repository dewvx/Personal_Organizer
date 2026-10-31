const { query, withTransaction } = require('../config/database');

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const HabitModel = {
  /**
   * Find all habits with past 7 days of logs and calculated streaks
   */
  async findAll() {
    const today = getLocalDateString();

    // 1. Fetch habits
    const habitsRes = await query(`
      SELECT * FROM habits ORDER BY sort_order ASC, created_at ASC
    `);
    const habits = habitsRes.rows;

    if (habits.length === 0) return [];

    // 2. Fetch past 7 days of logs for all habits
    const logsRes = await query(`
      SELECT habit_id, log_date, is_completed
      FROM habit_logs
      WHERE log_date >= CURRENT_DATE - INTERVAL '6 days' AND log_date <= CURRENT_DATE
      ORDER BY log_date ASC
    `);

    // Group logs by habit_id
    const logsByHabit = new Map();
    logsRes.rows.forEach((log) => {
      if (!logsByHabit.has(log.habit_id)) {
        logsByHabit.set(log.habit_id, []);
      }
      logsByHabit.get(log.habit_id).push({
        log_date: log.log_date,
        is_completed: log.is_completed,
      });
    });

    // 3. Fetch all completed dates for each habit to calculate current & best streak
    const allCompletedLogsRes = await query(`
      SELECT habit_id, log_date
      FROM habit_logs
      WHERE is_completed = true
      ORDER BY habit_id, log_date DESC
    `);

    const completedDatesByHabit = new Map();
    allCompletedLogsRes.rows.forEach((row) => {
      if (!completedDatesByHabit.has(row.habit_id)) {
        completedDatesByHabit.set(row.habit_id, new Set());
      }
      completedDatesByHabit.get(row.habit_id).add(row.log_date);
    });

    // Generate past 7 days array [D-6, D-5, ..., D-1, Today]
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      past7Days.push(getLocalDateString(d));
    }

    return habits.map((habit) => {
      const habitLogs = logsByHabit.get(habit.id) || [];
      const completedSet = completedDatesByHabit.get(habit.id) || new Set();

      // Format past 7 days status matrix
      const weeklyMatrix = past7Days.map((dateStr) => {
        const found = habitLogs.find((l) => l.log_date === dateStr);
        return {
          date: dateStr,
          is_completed: found ? found.is_completed : false,
        };
      });

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date();

      // If today is completed, start counting from today
      const todayStr = getLocalDateString(checkDate);
      if (completedSet.has(todayStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today is not completed yet, check if yesterday was completed
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (completedSet.has(getLocalDateString(checkDate))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      const completedToday = completedSet.has(today);
      const weeklyCompletedCount = weeklyMatrix.filter((d) => d.is_completed).length;

      return {
        ...habit,
        weeklyMatrix,
        currentStreak,
        completedToday,
        weeklyCompletedCount,
      };
    });
  },

  /**
   * Find habit by ID
   */
  async findById(id) {
    const res = await query('SELECT * FROM habits WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  /**
   * Create habit
   */
  async create({ name, description, icon = 'check', color = '#10B981', frequency = 'daily', target_days = 7, sort_order = 0 }) {
    const text = `
      INSERT INTO habits (name, description, icon, color, frequency, target_days, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      name.trim(),
      description ? description.trim() : null,
      icon || 'check',
      color || '#10B981',
      frequency || 'daily',
      target_days || 7,
      sort_order || 0,
    ];
    const res = await query(text, values);
    return res.rows[0];
  },

  /**
   * Update habit
   */
  async update(id, data) {
    const fields = [];
    const values = [];
    let counter = 1;

    const allowed = ['name', 'description', 'icon', 'color', 'frequency', 'target_days', 'sort_order'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${counter++}`);
        if (key === 'name') {
          values.push(data[key].trim());
        } else if (key === 'description') {
          values.push(data[key] ? data[key].trim() : null);
        } else {
          values.push(data[key]);
        }
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const text = `
      UPDATE habits
      SET ${fields.join(', ')}
      WHERE id = $${counter}
      RETURNING *
    `;
    const res = await query(text, values);
    return res.rows[0] || null;
  },

  /**
   * Delete habit
   */
  async delete(id) {
    const res = await query('DELETE FROM habits WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  },

  /**
   * Toggle habit completion for a specific date (defaults to today)
   */
  async toggleLog(habitId, logDate = getLocalDateString()) {
    // Check if log already exists
    const checkRes = await query(
      'SELECT id, is_completed FROM habit_logs WHERE habit_id = $1 AND log_date = $2',
      [habitId, logDate]
    );

    if (checkRes.rowCount > 0) {
      const current = checkRes.rows[0];
      const newStatus = !current.is_completed;
      if (newStatus === false) {
        // If unchecking, delete record to keep logs clean
        await query('DELETE FROM habit_logs WHERE id = $1', [current.id]);
      } else {
        await query('UPDATE habit_logs SET is_completed = true WHERE id = $1', [current.id]);
      }
      return { habitId, logDate, is_completed: newStatus };
    } else {
      // Create new completed log
      await query(
        'INSERT INTO habit_logs (habit_id, log_date, is_completed) VALUES ($1, $2, true)',
        [habitId, logDate]
      );
      return { habitId, logDate, is_completed: true };
    }
  },
};

module.exports = HabitModel;
