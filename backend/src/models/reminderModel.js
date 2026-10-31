const { query } = require('../config/database');

const ReminderModel = {
  /**
   * Find reminders with filters
   */
  async findAll({ is_sent = false, entry_id, note_id, page = 1, limit = 50 } = {}) {
    const conditions = [];
    const values = [];
    let counter = 1;

    if (is_sent !== 'all' && is_sent !== undefined && is_sent !== null) {
      conditions.push(`r.is_sent = $${counter++}`);
      values.push(is_sent === 'true' || is_sent === true);
    }

    if (entry_id) {
      conditions.push(`r.entry_id = $${counter++}`);
      values.push(parseInt(entry_id, 10));
    }

    if (note_id) {
      conditions.push(`r.note_id = $${counter++}`);
      values.push(parseInt(note_id, 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int AS total FROM reminders r ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.total || 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const sql = `
      SELECT 
        r.*,
        e.title AS entry_title,
        e.due_date AS entry_due_date,
        e.status AS entry_status,
        n.title AS note_title
      FROM reminders r
      LEFT JOIN entries e ON e.id = r.entry_id
      LEFT JOIN notes n ON n.id = r.note_id
      ${whereClause}
      ORDER BY r.is_sent ASC, COALESCE(r.snooze_until, r.remind_at) ASC
      LIMIT $${counter++} OFFSET $${counter++}
    `;

    values.push(limitNum, offset);
    const res = await query(sql, values);

    return {
      reminders: res.rows,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  async findById(id) {
    const sql = `
      SELECT 
        r.*,
        e.title AS entry_title,
        e.due_date AS entry_due_date,
        e.status AS entry_status,
        n.title AS note_title
      FROM reminders r
      LEFT JOIN entries e ON e.id = r.entry_id
      LEFT JOIN notes n ON n.id = r.note_id
      WHERE r.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async create(data) {
    const {
      entry_id = null,
      note_id = null,
      title,
      message = null,
      remind_at,
      repeat_type = 'none',
    } = data;

    const sql = `
      INSERT INTO reminders (entry_id, note_id, title, message, remind_at, repeat_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      entry_id || null,
      note_id || null,
      title,
      message || null,
      remind_at,
      repeat_type || 'none',
    ];
    const res = await query(sql, values);
    return this.findById(res.rows[0].id);
  },

  async update(id, data) {
    const allowed = ['entry_id', 'note_id', 'title', 'message', 'remind_at', 'repeat_type', 'is_sent', 'is_snoozed', 'snooze_until'];
    const setClauses = [];
    const values = [];
    let counter = 1;

    for (const key of allowed) {
      if (data[key] !== undefined) {
        setClauses.push(`${key} = $${counter++}`);
        values.push(data[key]);
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    values.push(id);
    const sql = `
      UPDATE reminders
      SET ${setClauses.join(', ')}
      WHERE id = $${counter}
      RETURNING *
    `;
    const res = await query(sql, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  async delete(id) {
    const res = await query(`DELETE FROM reminders WHERE id = $1 RETURNING id`, [id]);
    return res.rows[0] || null;
  },

  async snooze(id, minutes = 15) {
    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    const sql = `
      UPDATE reminders
      SET is_snoozed = true, snooze_until = $1, is_sent = false
      WHERE id = $2
      RETURNING *
    `;
    const res = await query(sql, [snoozeUntil, id]);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  async dismiss(id) {
    const sql = `
      UPDATE reminders
      SET is_sent = true, is_snoozed = false, snooze_until = null
      WHERE id = $1
      RETURNING *
    `;
    const res = await query(sql, [id]);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Find all reminders that are due right now for background scheduler
   */
  async findDueReminders() {
    const sql = `
      SELECT r.*, e.title AS entry_title, n.title AS note_title
      FROM reminders r
      LEFT JOIN entries e ON e.id = r.entry_id
      LEFT JOIN notes n ON n.id = r.note_id
      WHERE r.is_sent = false
        AND (
          (r.is_snoozed = false AND r.remind_at <= CURRENT_TIMESTAMP)
          OR (r.is_snoozed = true AND r.snooze_until <= CURRENT_TIMESTAMP)
        )
      ORDER BY r.remind_at ASC
      LIMIT 50
    `;
    const res = await query(sql);
    return res.rows;
  },

  /**
   * Mark reminder as sent, and if recurring, compute and set next remind_at
   */
  async markSent(id, repeatType = 'none') {
    if (repeatType === 'daily') {
      await query(
        `UPDATE reminders 
         SET remind_at = remind_at + INTERVAL '1 day', is_snoozed = false, snooze_until = null
         WHERE id = $1`,
        [id]
      );
    } else if (repeatType === 'weekly') {
      await query(
        `UPDATE reminders 
         SET remind_at = remind_at + INTERVAL '7 days', is_snoozed = false, snooze_until = null
         WHERE id = $1`,
        [id]
      );
    } else if (repeatType === 'monthly') {
      await query(
        `UPDATE reminders 
         SET remind_at = remind_at + INTERVAL '1 month', is_snoozed = false, snooze_until = null
         WHERE id = $1`,
        [id]
      );
    } else {
      await query(
        `UPDATE reminders 
         SET is_sent = true, is_snoozed = false, snooze_until = null
         WHERE id = $1`,
        [id]
      );
    }
    return this.findById(id);
  },
};

module.exports = ReminderModel;
