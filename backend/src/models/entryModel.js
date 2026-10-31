const fs = require('fs');
const { query, pool, withTransaction } = require('../config/database');

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const EntryModel = {
  /**
   * Find entries with filters, search, sorting, and pagination
   */
  async findAll({
    search,
    category_id,
    goal_id,
    status,
    priority,
    is_favorite,
    is_archived = false,
    start_date,
    end_date,
    calendar_mode,
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

    // Filter by goal
    if (goal_id !== undefined && goal_id !== '' && goal_id !== null) {
      conditions.push(`e.goal_id = $${counter++}`);
      values.push(parseInt(goal_id, 10));
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
    if (calendar_mode === 'true' || calendar_mode === true) {
      if (start_date && end_date) {
        conditions.push(`((e.entry_date >= $${counter} AND e.entry_date <= $${counter + 1}) OR (e.due_date >= $${counter} AND e.due_date <= $${counter + 1}))`);
        values.push(start_date, end_date);
        counter += 2;
      }
    } else {
      if (start_date) {
        conditions.push(`e.entry_date >= $${counter++}`);
        values.push(start_date);
      }
      if (end_date) {
        conditions.push(`e.entry_date <= $${counter++}`);
        values.push(end_date);
      }
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
        g.title AS goal_title,
        g.color AS goal_color,
        g.icon AS goal_icon,
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
        ), '[]'::json) AS items,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', att.id,
              'entry_id', att.entry_id,
              'file_name', att.file_name,
              'file_path', att.file_path,
              'file_size', att.file_size,
              'mime_type', att.mime_type,
              'created_at', att.created_at
            ) ORDER BY att.created_at ASC
          )
          FROM entry_attachments att
          WHERE att.entry_id = e.id
        ), '[]'::json) AS attachments
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN goals g ON e.goal_id = g.id
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
  async findById(id, client = null) {
    const queryRunner = client ? (text, params) => client.query(text, params) : query;
    const text = `
      SELECT 
        e.*,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        g.title AS goal_title,
        g.color AS goal_color,
        g.icon AS goal_icon,
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
        ), '[]'::json) AS items,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', att.id,
              'entry_id', att.entry_id,
              'file_name', att.file_name,
              'file_path', att.file_path,
              'file_size', att.file_size,
              'mime_type', att.mime_type,
              'created_at', att.created_at
            ) ORDER BY att.created_at ASC
          )
          FROM entry_attachments att
          WHERE att.entry_id = e.id
        ), '[]'::json) AS attachments
      FROM entries e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN goals g ON e.goal_id = g.id
      WHERE e.id = $1
    `;
    const res = await queryRunner(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Create new entry with optional sub-items (Atomic DB Transaction)
   */
  async create({
    category_id,
    goal_id,
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
    custom_values = {},
    items = [],
  }, existingClient = null) {
    const execute = async (client) => {
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
          goal_id,
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
          recurring,
          custom_values
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `;

      const values = [
        category_id ? parseInt(category_id, 10) : null,
        goal_id ? parseInt(goal_id, 10) : null,
        title.trim(),
        description ? description.trim() : null,
        entry_date || getLocalDateString(),
        due_date || null,
        status || 'pending',
        priority || 'medium',
        calculatedAmount,
        calculatedQuantity,
        formattedTags,
        is_favorite === true || is_favorite === 'true',
        is_archived === true || is_archived === 'true',
        recurring || 'none',
        JSON.stringify(custom_values || {}),
      ];

      const res = await client.query(text, values);
      const newEntryId = res.rows[0].id;

      // Insert Sub-Items atomically
      if (Array.isArray(items) && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.title && item.title.trim()) {
            await client.query(
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

      return this.findById(newEntryId, client);
    };

    if (existingClient) {
      return await execute(existingClient);
    }
    return await withTransaction(execute);
  },

  /**
   * Update entry and optionally replace/update sub-items (Atomic DB Transaction)
   */
  async update(id, data, existingClient = null) {
    const execute = async (client) => {
      const fields = [];
      const values = [];
      let counter = 1;

      const allowedFields = [
        'category_id',
        'goal_id',
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
        'custom_values',
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
          if (key === 'category_id' || key === 'goal_id') {
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
          } else if (key === 'custom_values') {
            values.push(JSON.stringify(data[key] || {}));
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
        await client.query(text, values);
      }

      // Sync sub-items atomically if items array is explicitly provided
      if (Array.isArray(data.items)) {
        // Replace items inside transaction
        await client.query(`DELETE FROM entry_items WHERE entry_id = $1`, [id]);
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          if (item.title && item.title.trim()) {
            await client.query(
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

      return this.findById(id, client);
    };

    if (existingClient) {
      return await execute(existingClient);
    }
    return await withTransaction(execute);
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
   * Delete entry and clean up associated physical files on disk
   */
  async delete(id) {
    // 1. Clean up attached physical files on disk to prevent orphan files
    try {
      const attRes = await query('SELECT file_path FROM entry_attachments WHERE entry_id = $1', [id]);
      if (attRes.rows && attRes.rows.length > 0) {
        for (const row of attRes.rows) {
          if (row.file_path && fs.existsSync(row.file_path)) {
            try {
              fs.unlinkSync(row.file_path);
            } catch (unlinkErr) {
              console.warn(`Failed to unlink file ${row.file_path}:`, unlinkErr.message);
            }
          }
        }
      }
    } catch (attErr) {
      console.warn('Warning querying attachments during entry delete:', attErr.message);
    }

    const text = `DELETE FROM entries WHERE id = $1 RETURNING id`;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },

  /**
   * Duplicate entry with its sub-items
   */
  async duplicate(id) {
    const original = await this.findById(id);
    if (!original) return null;

    const newTitle = `${original.title} (สำเนา)`;
    const newItems = (original.items || []).map((item) => ({
      title: item.title,
      amount: item.amount,
      quantity: item.quantity,
      is_completed: false,
    }));

    return await this.create({
      category_id: original.category_id,
      goal_id: original.goal_id,
      title: newTitle,
      description: original.description,
      entry_date: getLocalDateString(),
      due_date: original.due_date,
      status: 'pending',
      priority: original.priority,
      amount: original.amount,
      quantity: original.quantity,
      tags: original.tags,
      is_favorite: false,
      is_archived: false,
      recurring: original.recurring || 'none',
      items: newItems,
    });
  },

  /**
   * Archive all completed entries in one click
   */
  async archiveCompleted() {
    const text = `
      UPDATE entries
      SET is_archived = true
      WHERE status = 'completed' AND is_archived = false
      RETURNING id
    `;
    const res = await query(text);
    return res.rowCount;
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
        ), '[]'::json) AS items,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', att.id,
              'entry_id', att.entry_id,
              'file_name', att.file_name,
              'file_path', att.file_path,
              'file_size', att.file_size,
              'mime_type', att.mime_type,
              'created_at', att.created_at
            ) ORDER BY att.created_at ASC
          )
          FROM entry_attachments att
          WHERE att.entry_id = e.id
        ), '[]'::json) AS attachments
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
        ), '[]'::json) AS items,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', att.id,
              'entry_id', att.entry_id,
              'file_name', att.file_name,
              'file_path', att.file_path,
              'file_size', att.file_size,
              'mime_type', att.mime_type,
              'created_at', att.created_at
            ) ORDER BY att.created_at ASC
          )
          FROM entry_attachments att
          WHERE att.entry_id = e.id
        ), '[]'::json) AS attachments
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
        ), '[]'::json) AS items,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', att.id,
              'entry_id', att.entry_id,
              'file_name', att.file_name,
              'file_path', att.file_path,
              'file_size', att.file_size,
              'mime_type', att.mime_type,
              'created_at', att.created_at
            ) ORDER BY att.created_at ASC
          )
          FROM entry_attachments att
          WHERE att.entry_id = e.id
        ), '[]'::json) AS attachments
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
        ), '[]'::json) AS items,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', att.id,
              'entry_id', att.entry_id,
              'file_name', att.file_name,
              'file_path', att.file_path,
              'file_size', att.file_size,
              'mime_type', att.mime_type,
              'created_at', att.created_at
            ) ORDER BY att.created_at ASC
          )
          FROM entry_attachments att
          WHERE att.entry_id = e.id
        ), '[]'::json) AS attachments
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

  /**
   * Import entries backup (JSON/CSV rows) atomically
   */
  async importEntries(entriesData, { strategy = 'append' } = {}) {
    if (!Array.isArray(entriesData) || entriesData.length === 0) {
      throw new Error('No valid entries provided for import.');
    }

    return await withTransaction(async (client) => {
      if (strategy === 'overwrite') {
        // Clear all existing entries and entry_items
        await client.query('DELETE FROM entry_items');
        await client.query('DELETE FROM entries');
      }

      // Preload categories to map category_name -> id
      const catRes = await client.query('SELECT id, name FROM categories');
      const categoryMap = new Map();
      catRes.rows.forEach((c) => categoryMap.set(c.name.toLowerCase().trim(), c.id));

      let importedCount = 0;
      let categoriesCreated = 0;

      for (const item of entriesData) {
        if (!item.title || !String(item.title).trim()) continue;

        let categoryId = item.category_id || null;
        if (!categoryId && item.category_name && String(item.category_name).trim()) {
          const catName = String(item.category_name).trim();
          const lookupKey = catName.toLowerCase();
          if (categoryMap.has(lookupKey)) {
            categoryId = categoryMap.get(lookupKey);
          } else {
            // Create category automatically
            const newCatRes = await client.query(
              `INSERT INTO categories (name, icon, color) VALUES ($1, 'folder', '#6366F1') RETURNING id`,
              [catName]
            );
            categoryId = newCatRes.rows[0].id;
            categoryMap.set(lookupKey, categoryId);
            categoriesCreated++;
          }
        }

        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        const validPriorities = ['low', 'medium', 'high', 'urgent'];

        const status = validStatuses.includes(item.status) ? item.status : 'pending';
        const priority = validPriorities.includes(item.priority) ? item.priority : 'medium';

        let tagsFormatted = '[]';
        if (Array.isArray(item.tags)) {
          tagsFormatted = JSON.stringify(item.tags);
        } else if (typeof item.tags === 'string') {
          try {
            const parsed = JSON.parse(item.tags);
            tagsFormatted = Array.isArray(parsed) ? JSON.stringify(parsed) : '[]';
          } catch {
            tagsFormatted = JSON.stringify(item.tags.split(',').map((t) => t.trim()).filter(Boolean));
          }
        }

        const entryRes = await client.query(
          `INSERT INTO entries (
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
          RETURNING id`,
          [
            categoryId,
            String(item.title).trim(),
            item.description ? String(item.description).trim() : null,
            item.entry_date || getLocalDateString(),
            item.due_date || null,
            status,
            priority,
            item.amount !== '' && item.amount !== null && item.amount !== undefined ? parseFloat(item.amount) : null,
            item.quantity !== '' && item.quantity !== null && item.quantity !== undefined ? parseInt(item.quantity, 10) : null,
            tagsFormatted,
            item.is_favorite === true || item.is_favorite === 'true',
            item.is_archived === true || item.is_archived === 'true',
            item.recurring || 'none',
          ]
        );

        const newEntryId = entryRes.rows[0].id;
        importedCount++;

        // Import Sub-items if provided
        if (Array.isArray(item.items) && item.items.length > 0) {
          for (let i = 0; i < item.items.length; i++) {
            const sub = item.items[i];
            if (sub.title && String(sub.title).trim()) {
              await client.query(
                `INSERT INTO entry_items (entry_id, title, amount, quantity, is_completed, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                  newEntryId,
                  String(sub.title).trim(),
                  sub.amount !== '' && sub.amount !== null ? parseFloat(sub.amount) : 0,
                  sub.quantity !== '' && sub.quantity !== null ? parseInt(sub.quantity, 10) : 1,
                  sub.is_completed === true || sub.is_completed === 'true',
                  i + 1,
                ]
              );
            }
          }
        }
      }

      return {
        importedCount,
        categoriesCreated,
        strategy,
      };
    });
  },
};

module.exports = EntryModel;
