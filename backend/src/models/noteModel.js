const { query } = require('../config/database');

const NoteModel = {
  /**
   * Find notes with filtering, pagination, and sorting
   */
  async findAll({
    search,
    note_type,
    mood,
    is_pinned,
    is_archived = false,
    start_date,
    end_date,
    linked_entry_id,
    linked_goal_id,
    tag,
    sort_by = 'created_at',
    sort_order = 'DESC',
    page = 1,
    limit = 50,
  } = {}) {
    const conditions = [];
    const values = [];
    let counter = 1;

    // Default: archived filter
    if (is_archived !== undefined && is_archived !== null && is_archived !== 'all') {
      conditions.push(`n.is_archived = $${counter++}`);
      values.push(is_archived === 'true' || is_archived === true);
    }

    if (is_pinned !== undefined && is_pinned !== null) {
      conditions.push(`n.is_pinned = $${counter++}`);
      values.push(is_pinned === 'true' || is_pinned === true);
    }

    if (note_type && note_type !== 'all') {
      conditions.push(`n.note_type = $${counter++}`);
      values.push(note_type);
    }

    if (mood && mood !== 'all') {
      conditions.push(`n.mood = $${counter++}`);
      values.push(mood);
    }

    if (linked_entry_id) {
      conditions.push(`n.linked_entry_id = $${counter++}`);
      values.push(parseInt(linked_entry_id, 10));
    }

    if (linked_goal_id) {
      conditions.push(`n.linked_goal_id = $${counter++}`);
      values.push(parseInt(linked_goal_id, 10));
    }

    if (start_date) {
      conditions.push(`n.note_date >= $${counter++}`);
      values.push(start_date);
    }

    if (end_date) {
      conditions.push(`n.note_date <= $${counter++}`);
      values.push(end_date);
    }

    if (search && search.trim()) {
      conditions.push(`(n.title ILIKE $${counter} OR n.content ILIKE $${counter})`);
      values.push(`%${search.trim()}%`);
      counter++;
    }

    if (tag && tag.trim()) {
      conditions.push(`n.tags @> $${counter++}::jsonb`);
      values.push(JSON.stringify([tag.trim()]));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countSql = `SELECT COUNT(*)::int AS total FROM notes n ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.total || 0;

    // Sorting whitelist
    const allowedSortColumns = {
      created_at: 'n.created_at',
      updated_at: 'n.updated_at',
      note_date: 'n.note_date',
      title: 'n.title',
    };
    const sortCol = allowedSortColumns[sort_by] || 'n.created_at';
    const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Primary order: is_pinned DESC, then specified sort
    const dataSql = `
      SELECT 
        n.*,
        e.title AS linked_entry_title,
        g.title AS linked_goal_title
      FROM notes n
      LEFT JOIN entries e ON e.id = n.linked_entry_id
      LEFT JOIN goals g ON g.id = n.linked_goal_id
      ${whereClause}
      ORDER BY n.is_pinned DESC, ${sortCol} ${sortDir}
      LIMIT $${counter++} OFFSET $${counter++}
    `;

    values.push(limitNum, offset);
    const res = await query(dataSql, values);

    return {
      notes: res.rows,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Find single note by ID
   */
  async findById(id) {
    const sql = `
      SELECT 
        n.*,
        e.title AS linked_entry_title,
        g.title AS linked_goal_title
      FROM notes n
      LEFT JOIN entries e ON e.id = n.linked_entry_id
      LEFT JOIN goals g ON g.id = n.linked_goal_id
      WHERE n.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  /**
   * Create a new note
   */
  async create(data) {
    const {
      title,
      content = '',
      note_type = 'note',
      mood = null,
      tags = [],
      is_pinned = false,
      color = '#6366F1',
      linked_entry_id = null,
      linked_goal_id = null,
      note_date = new Date().toISOString().slice(0, 10),
    } = data;

    const sql = `
      INSERT INTO notes (
        title, content, note_type, mood, tags, is_pinned, color,
        linked_entry_id, linked_goal_id, note_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      title,
      content,
      note_type,
      mood,
      JSON.stringify(tags || []),
      Boolean(is_pinned),
      color,
      linked_entry_id || null,
      linked_goal_id || null,
      note_date,
    ];

    const res = await query(sql, values);
    return this.findById(res.rows[0].id);
  },

  /**
   * Update an existing note
   */
  async update(id, data) {
    const allowed = [
      'title',
      'content',
      'note_type',
      'mood',
      'tags',
      'is_pinned',
      'is_archived',
      'color',
      'linked_entry_id',
      'linked_goal_id',
      'note_date',
    ];

    const setClauses = [];
    const values = [];
    let counter = 1;

    for (const key of allowed) {
      if (data[key] !== undefined) {
        setClauses.push(`${key} = $${counter++}`);
        if (key === 'tags') {
          values.push(JSON.stringify(data[key] || []));
        } else {
          values.push(data[key]);
        }
      }
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE notes
      SET ${setClauses.join(', ')}
      WHERE id = $${counter}
      RETURNING *
    `;

    const res = await query(sql, values);
    if (res.rows.length === 0) return null;
    return this.findById(id);
  },

  /**
   * Delete a note
   */
  async delete(id) {
    const res = await query(`DELETE FROM notes WHERE id = $1 RETURNING id`, [id]);
    return res.rows[0] || null;
  },

  /**
   * Toggle pin
   */
  async togglePin(id) {
    const res = await query(
      `UPDATE notes SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0] ? this.findById(id) : null;
  },

  /**
   * Toggle archive
   */
  async toggleArchive(id) {
    const res = await query(
      `UPDATE notes SET is_archived = NOT is_archived WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0] ? this.findById(id) : null;
  },

  /**
   * Get journal entries for calendar/heatmap (grouped by date)
   */
  async getJournalCalendar({ year, month }) {
    let dateFilter = '';
    const values = [];

    if (year && month) {
      const padMonth = String(month).padStart(2, '0');
      const start = `${year}-${padMonth}-01`;
      dateFilter = `AND note_date >= $1 AND note_date < ($1::date + INTERVAL '1 month')`;
      values.push(start);
    }

    const sql = `
      SELECT 
        note_date,
        COUNT(*)::int AS count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', id,
              'title', title,
              'note_type', note_type,
              'mood', mood,
              'color', color,
              'is_pinned', is_pinned
            ) ORDER BY is_pinned DESC, created_at DESC
          ), '[]'::json
        ) AS entries
      FROM notes
      WHERE is_archived = false ${dateFilter}
      GROUP BY note_date
      ORDER BY note_date DESC
    `;

    const res = await query(sql, values);
    return res.rows;
  },
};

module.exports = NoteModel;
