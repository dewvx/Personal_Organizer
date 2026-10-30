const { query, pool } = require('../config/database');

const EntryModel = {
  /**
   * Find entries with filters, search, sorting, and pagination
   */
  async findAll({
    search,
    category_id,
    status,
    priority,
    is_favorite,
    is_archived = false,
    start_date,
    end_date,
    due_status,
    sort_by = 'entry_date',
    sort_order = 'DESC',
    page = 1,
    limit = 50,
  } = {}) {
    const conditions = [];
    const values = [];
    let counter = 1;

    // Filter by archive status
    if (is_archived !== undefined) {
      conditions.push(`e.is_archived = $${counter++}`);
      values.push(is_archived === 'true' || is_archived === true);
    }

    // Filter by category
    if (category_id !== undefined && category_id !== '' && category_id !== null) {
      if (category_id === 'none' || category_id === '0') {
        conditions.push(`e.category_id IS NULL`);
      } else {
        conditions.push(`e.category_id = $${counter++}`);
        values.push(parseInt(category_id, 10));
      }
    }

    // Filter by status
    if (status && status !== 'all') {
      conditions.push(`e.status = $${counter++}`);
      values.push(status);
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      conditions.push(`e.priority = $${counter++}`);
      values.push(priority);
    }

    // Filter by favorite
    if (is_favorite !== undefined && is_favorite !== '') {
      conditions.push(`e.is_favorite = $${counter++}`);
      values.push(is_favorite === 'true' || is_favorite === true);
    }

    // Search query in title or description or tags
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(`(e.title ILIKE $${counter} OR e.description ILIKE $${counter} OR e.tags::text ILIKE $${counter})`);
      values.push(searchTerm);
      counter++;
    }

    // Date range filter
    if (start_date) {
      conditions.push(`e.entry_date >= $${counter++}`);
      values.push(start_date);
    }
    if (end_date) {
      conditions.push(`e.entry_date <= $${counter++}`);
      values.push(end_date);
    }

    // Due status helper filter
    if (due_status === 'overdue') {
      conditions.push(`e.due_date < CURRENT_DATE AND e.status != 'completed'`);
    } else if (due_status === 'today') {
      conditions.push(`e.due_date = CURRENT_DATE`);
    } else if (due_status === 'upcoming') {
      conditions.push(`e.due_date >= CURRENT_DATE AND e.due_date <= CURRENT_DATE + INTERVAL '7 days' AND e.status != 'completed'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sort validation
    const allowedSortFields = ['entry_date', 'due_date', 'created_at', 'priority', 'title', 'amount'];
    const sortField = allowedSortFields.includes(sort_by) ? `e.${sort_by}` : 'e.created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Count Query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM entries e
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.total || 0;

    // Data Query with Subquery for Items
    const dataSql = `
      SELECT 
        e.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'entry_id', item.entry_id,
              'title', item.title,
              'amount', item.amount,
              'quantity', item.quantity,
              'is_completed', item.is_completed,
              'sort_order', item.sort_order
            ) ORDER BY item.sort_order ASC, item.id ASC
          )
          FROM entry_items item
          WHERE item.entry_id = e.id
        ), '[]'::json) AS items
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      ${whereClause}
      ORDER BY e.is_favorite DESC, ${sortField} ${sortDirection} NULLS LAST
      LIMIT $${counter++} OFFSET $${counter++}
    `;

    values.push(limitNum, offset);
    const dataRes = await query(dataSql, values);

    return {
      entries: dataRes.rows,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  },

  /**
   * Find entry by ID with its sub-items
   */
  async findById(id) {
    const text = `
      SELECT 
        e.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'entry_id', item.entry_id,
              'title', item.title,
              'amount', item.amount,
              'quantity', item.quantity,
              'is_completed', item.is_completed,
              'sort_order', item.sort_order
            ) ORDER BY item.sort_order ASC, item.id ASC
          )
          FROM entry_items item
          WHERE item.entry_id = e.id
        ), '[]'::json) AS items
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = $1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Create new entry with optional sub-items
   */
  async create({
    category_id,
    title,
    description,
    entry_date,
    due_date,
    status = 'pending',
    priority = 'medium',
    amount,
    quantity,
    tags = [],
    is_favorite = false,
    is_archived = false,
    recurring = 'none',
    items = [],
  }) {
    const formattedTags = Array.isArray(tags)
      ? JSON.stringify(tags)
      : typeof tags === 'string'
      ? JSON.stringify(tags.split(',').map((t) => t.trim()).filter(Boolean))
      : '[]';

    // Calculate sum from items if amounts provided
    let calculatedAmount = amount !== undefined && amount !== '' && amount !== null ? parseFloat(amount) : null;
    let calculatedQuantity = quantity !== undefined && quantity !== '' && quantity !== null ? parseInt(quantity, 10) : null;

    if (Array.isArray(items) && items.length > 0) {
      const itemsSum = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      if (itemsSum > 0) {
        calculatedAmount = itemsSum;
      }
      const itemsQty = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);
      if (itemsQty > 0 && !calculatedQuantity) {
        calculatedQuantity = itemsQty;
      }
    }

    const text = `
      INSERT INTO entries (
        category_id,
        title,
        description,
        entry_date,
        due_date,
        status,
        priority,
        amount,
        quantity,
        tags,
        is_favorite,
        is_archived,
        recurring
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    const values = [
      category_id ? parseInt(category_id, 10) : null,
      title.trim(),
      description ? description.trim() : null,
      entry_date || new Date().toISOString().split('T')[0],
      due_date || null,
      status || 'pending',
      priority || 'medium',
      calculatedAmount,
      calculatedQuantity,
      formattedTags,
      is_favorite === true || is_favorite === 'true',
      is_archived === true || is_archived === 'true',
      recurring || 'none',
    ];

    const res = await query(text, values);
    const newEntryId = res.rows[0].id;

    // Insert Sub-Items if provided
    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.title && item.title.trim()) {
          await query(
            `INSERT INTO entry_items (entry_id, title, amount, quantity, is_completed, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              newEntryId,
              item.title.trim(),
              item.amount !== '' && item.amount !== null ? parseFloat(item.amount) : 0,
              item.quantity !== '' && item.quantity !== null ? parseInt(item.quantity, 10) : 1,
              item.is_completed === true || item.is_completed === 'true',
              i + 1,
            ]
          );
        }
      }
    }

    return this.findById(newEntryId);
  },

  /**
   * Update entry and optionally replace/update sub-items
   */
  async update(id, data) {
    const fields = [];
    const values = [];
    let counter = 1;

    const allowedFields = [
      'category_id',
      'title',
      'description',
      'entry_date',
      'due_date',
      'status',
      'priority',
      'amount',
      'quantity',
      'tags',
      'is_favorite',
      'is_archived',
      'recurring',
    ];

    // Check if items were provided in update
    if (Array.isArray(data.items)) {
      // Re-calculate amount from items if items have amounts
      const itemsSum = data.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      if (itemsSum > 0) {
        data.amount = itemsSum;
      }
    }

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${counter++}`);
        if (key === 'category_id') {
          values.push(data[key] ? parseInt(data[key], 10) : null);
        } else if (key === 'amount') {
          values.push(data[key] !== '' && data[key] !== null ? parseFloat(data[key]) : null);
        } else if (key === 'quantity') {
          values.push(data[key] !== '' && data[key] !== null ? parseInt(data[key], 10) : null);
        } else if (key === 'tags') {
          values.push(
            Array.isArray(data[key])
              ? JSON.stringify(data[key])
              : typeof data[key] === 'string'
              ? JSON.stringify(data[key].split(',').map((t) => t.trim()).filter(Boolean))
              : '[]'
          );
        } else if (key === 'is_favorite' || key === 'is_archived') {
          values.push(data[key] === true || data[key] === 'true');
        } else {
          values.push(data[key]);
        }
      }
    }

    if (fields.length > 0) {
      values.push(id);
      const text = `
        UPDATE entries
        SET ${fields.join(', ')}
        WHERE id = $${counter}
        RETURNING id
      `;
      await query(text, values);
    }

    // Sync sub-items if items array is explicitly provided
    if (Array.isArray(data.items)) {
      // Replace items
      await query(`DELETE FROM entry_items WHERE entry_id = $1`, [id]);
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (item.title && item.title.trim()) {
          await query(
            `INSERT INTO entry_items (entry_id, title, amount, quantity, is_completed, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              id,
              item.title.trim(),
              item.amount !== '' && item.amount !== null ? parseFloat(item.amount) : 0,
              item.quantity !== '' && item.quantity !== null ? parseInt(item.quantity, 10) : 1,
              item.is_completed === true || item.is_completed === 'true',
              i + 1,
            ]
          );
        }
      }
    }

    return this.findById(id);
  },

  /**
   * Quick toggle status
   */
  async updateStatus(id, status) {
    const text = `
      UPDATE entries
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const res = await query(text, [status, id]);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Quick toggle favorite
   */
  async updateFavorite(id, is_favorite) {
    const text = `
      UPDATE entries
      SET is_favorite = $1
      WHERE id = $2
      RETURNING *
    `;
    const res = await query(text, [is_favorite, id]);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Quick toggle archive
   */
  async updateArchive(id, is_archived) {
    const text = `
      UPDATE entries
      SET is_archived = $1
      WHERE id = $2
      RETURNING *
    `;
    const res = await query(text, [is_archived, id]);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Delete entry
   */
  async delete(id) {
    const text = `DELETE FROM entries WHERE id = $1 RETURNING id`;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },

  /**
   * Export all entries
   */
  async getAllForExport() {
    const text = `
      SELECT 
        e.id,
        e.title,
        e.description,
        c.name AS category_name,
        e.entry_date,
        e.due_date,
        e.status,
        e.priority,
        e.amount,
        e.quantity,
        e.tags,
        e.is_favorite,
        e.is_archived,
        e.recurring,
        e.created_at,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'title', item.title,
              'amount', item.amount,
              'quantity', item.quantity,
              'is_completed', item.is_completed
            ) ORDER BY item.sort_order ASC
          )
          FROM entry_items item
          WHERE item.entry_id = e.id
        ), '[]'::json) AS items
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      ORDER BY e.created_at DESC
    `;
    const res = await query(text);
    return res.rows;
  },

  /**
   * Get dashboard statistics with expense breakdown analytics
   */
  async getDashboardSummary() {
    // 1. Overview counts
    const countQuery = `
      SELECT
        COUNT(*)::int AS total_entries,
        COUNT(CASE WHEN is_archived = false THEN 1 END)::int AS active_entries,
        COUNT(CASE WHEN status = 'pending' AND is_archived = false THEN 1 END)::int AS pending_entries,
        COUNT(CASE WHEN status = 'in_progress' AND is_archived = false THEN 1 END)::int AS in_progress_entries,
        COUNT(CASE WHEN status = 'completed' AND is_archived = false THEN 1 END)::int AS completed_entries,
        COUNT(CASE WHEN is_favorite = true AND is_archived = false THEN 1 END)::int AS favorite_entries,
        COUNT(CASE WHEN is_archived = true THEN 1 END)::int AS archived_entries,
        COALESCE(SUM(CASE WHEN amount IS NOT NULL AND is_archived = false THEN amount ELSE 0 END), 0)::float AS total_expense_amount
      FROM entries
    `;
    const countRes = await query(countQuery);
    const summary = countRes.rows[0];

    // 2. Expense by Category Breakdown (Analytics)
    const expenseQuery = `
      SELECT 
        COALESCE(c.name, 'ไม่มีหมวดหมู่') AS category_name,
        COALESCE(c.color, '#64748B') AS category_color,
        COALESCE(c.icon, 'folder') AS category_icon,
        COUNT(e.id)::int AS entry_count,
        SUM(e.amount)::float AS total_amount
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.amount IS NOT NULL AND e.amount > 0 AND e.is_archived = false
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY total_amount DESC
    `;
    const expenseRes = await query(expenseQuery);

    // 3. Upcoming due entries (within next 7 days, not completed, not archived)
    const upcomingQuery = `
      SELECT 
        e.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'entry_id', item.entry_id,
              'title', item.title,
              'amount', item.amount,
              'quantity', item.quantity,
              'is_completed', item.is_completed,
              'sort_order', item.sort_order
            ) ORDER BY item.sort_order ASC
          )
          FROM entry_items item
          WHERE item.entry_id = e.id
        ), '[]'::json) AS items
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.due_date IS NOT NULL
        AND e.due_date >= CURRENT_DATE
        AND e.due_date <= CURRENT_DATE + INTERVAL '7 days'
        AND e.status != 'completed'
        AND e.is_archived = false
      ORDER BY e.due_date ASC
      LIMIT 5
    `;
    const upcomingRes = await query(upcomingQuery);

    // 4. Overdue entries (due_date < today, not completed, not archived)
    const overdueQuery = `
      SELECT 
        e.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'entry_id', item.entry_id,
              'title', item.title,
              'amount', item.amount,
              'quantity', item.quantity,
              'is_completed', item.is_completed,
              'sort_order', item.sort_order
            ) ORDER BY item.sort_order ASC
          )
          FROM entry_items item
          WHERE item.entry_id = e.id
        ), '[]'::json) AS items
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.due_date IS NOT NULL
        AND e.due_date < CURRENT_DATE
        AND e.status != 'completed'
        AND e.is_archived = false
      ORDER BY e.due_date ASC
      LIMIT 5
    `;
    const overdueRes = await query(overdueQuery);

    // 5. Recent entries
    const recentQuery = `
      SELECT 
        e.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', item.id,
              'entry_id', item.entry_id,
              'title', item.title,
              'amount', item.amount,
              'quantity', item.quantity,
              'is_completed', item.is_completed,
              'sort_order', item.sort_order
            ) ORDER BY item.sort_order ASC
          )
          FROM entry_items item
          WHERE item.entry_id = e.id
        ), '[]'::json) AS items
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.is_archived = false
      ORDER BY e.created_at DESC
      LIMIT 6
    `;
    const recentRes = await query(recentQuery);

    return {
      summary,
      expenseByCategory: expenseRes.rows,
      upcomingDue: upcomingRes.rows,
      overdue: overdueRes.rows,
      recentEntries: recentRes.rows,
    };
  },
};

module.exports = EntryModel;
