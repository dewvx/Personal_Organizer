const { query, withTransaction } = require('../config/database');

const TransactionModel = {
  /**
   * Find transactions with filters, search, and pagination
   */
  async findAll({
    wallet_id,
    type,
    category_id,
    start_date,
    end_date,
    search,
    tag,
    page = 1,
    limit = 50,
    sort_by = 'transaction_date',
    sort_order = 'DESC',
  } = {}) {
    const conditions = [];
    const values = [];
    let counter = 1;

    if (wallet_id) {
      conditions.push(`(t.wallet_id = $${counter} OR t.to_wallet_id = $${counter})`);
      values.push(parseInt(wallet_id, 10));
      counter++;
    }

    if (type && type !== 'all') {
      conditions.push(`t.type = $${counter++}`);
      values.push(type);
    }

    if (category_id) {
      conditions.push(`t.category_id = $${counter++}`);
      values.push(parseInt(category_id, 10));
    }

    if (start_date) {
      conditions.push(`t.transaction_date >= $${counter++}`);
      values.push(start_date);
    }

    if (end_date) {
      conditions.push(`t.transaction_date <= $${counter++}`);
      values.push(end_date);
    }

    if (search && search.trim()) {
      conditions.push(`t.note ILIKE $${counter++}`);
      values.push(`%${search.trim()}%`);
    }

    if (tag && tag.trim()) {
      conditions.push(`t.tags @> $${counter++}::jsonb`);
      values.push(JSON.stringify([tag.trim()]));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count
    const countSql = `SELECT COUNT(*)::int AS total FROM transactions t ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.total || 0;

    const allowedSort = {
      transaction_date: 't.transaction_date',
      amount: 't.amount',
      created_at: 't.created_at',
    };
    const sortCol = allowedSort[sort_by] || 't.transaction_date';
    const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
      SELECT 
        t.*,
        w.name AS wallet_name,
        w.icon AS wallet_icon,
        w.color AS wallet_color,
        tw.name AS to_wallet_name,
        tw.icon AS to_wallet_icon,
        tw.color AS to_wallet_color,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color
      FROM transactions t
      JOIN wallets w ON w.id = t.wallet_id
      LEFT JOIN wallets tw ON tw.id = t.to_wallet_id
      LEFT JOIN categories c ON c.id = t.category_id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}, t.created_at DESC
      LIMIT $${counter++} OFFSET $${counter++}
    `;

    values.push(limitNum, offset);
    const res = await query(dataSql, values);

    return {
      transactions: res.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount) || 0,
      })),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Find single transaction by ID
   */
  async findById(id, client = null) {
    const q = client ? client.query.bind(client) : query;
    const sql = `
      SELECT 
        t.*,
        w.name AS wallet_name,
        w.icon AS wallet_icon,
        w.color AS wallet_color,
        tw.name AS to_wallet_name,
        tw.icon AS to_wallet_icon,
        tw.color AS to_wallet_color,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color
      FROM transactions t
      JOIN wallets w ON w.id = t.wallet_id
      LEFT JOIN wallets tw ON tw.id = t.to_wallet_id
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.id = $1
    `;
    const res = await q(sql, [id]);
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      amount: parseFloat(res.rows[0].amount) || 0,
    };
  },

  /**
   * Helper: apply delta to wallet balance inside transaction
   */
  async _adjustBalance(client, walletId, delta) {
    await client.query(
      `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
      [delta, walletId]
    );
  },

  /**
   * Create transaction atomically and update wallet balances
   */
  async create(data) {
    return await withTransaction(async (client) => {
      const {
        wallet_id,
        category_id = null,
        to_wallet_id = null,
        type = 'expense',
        amount,
        note = null,
        tags = [],
        transaction_date = new Date().toISOString().slice(0, 10),
        attachment_path = null,
      } = data;

      const numAmount = parseFloat(amount) || 0;

      const insertSql = `
        INSERT INTO transactions (
          wallet_id, category_id, to_wallet_id, type, amount,
          note, tags, transaction_date, attachment_path
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      const insertValues = [
        wallet_id,
        category_id || null,
        to_wallet_id || null,
        type,
        numAmount,
        note,
        JSON.stringify(tags || []),
        transaction_date,
        attachment_path,
      ];

      const res = await client.query(insertSql, insertValues);
      const newId = res.rows[0].id;

      // Update wallet balance based on type
      if (type === 'income') {
        await this._adjustBalance(client, wallet_id, numAmount);
      } else if (type === 'expense') {
        await this._adjustBalance(client, wallet_id, -numAmount);
      } else if (type === 'transfer' && to_wallet_id) {
        await this._adjustBalance(client, wallet_id, -numAmount);
        await this._adjustBalance(client, to_wallet_id, numAmount);
      }

      return await this.findById(newId, client);
    });
  },

  /**
   * Update transaction atomically and adjust wallet balance deltas
   */
  async update(id, data) {
    return await withTransaction(async (client) => {
      const old = await this.findById(id, client);
      if (!old) return null;

      // Revert old transaction's effect on balances
      if (old.type === 'income') {
        await this._adjustBalance(client, old.wallet_id, -old.amount);
      } else if (old.type === 'expense') {
        await this._adjustBalance(client, old.wallet_id, old.amount);
      } else if (old.type === 'transfer' && old.to_wallet_id) {
        await this._adjustBalance(client, old.wallet_id, old.amount);
        await this._adjustBalance(client, old.to_wallet_id, -old.amount);
      }

      const merged = {
        wallet_id: data.wallet_id !== undefined ? data.wallet_id : old.wallet_id,
        category_id: data.category_id !== undefined ? data.category_id : old.category_id,
        to_wallet_id: data.to_wallet_id !== undefined ? data.to_wallet_id : old.to_wallet_id,
        type: data.type !== undefined ? data.type : old.type,
        amount: data.amount !== undefined ? parseFloat(data.amount) : old.amount,
        note: data.note !== undefined ? data.note : old.note,
        tags: data.tags !== undefined ? data.tags : old.tags,
        transaction_date: data.transaction_date !== undefined ? data.transaction_date : old.transaction_date,
        attachment_path: data.attachment_path !== undefined ? data.attachment_path : old.attachment_path,
      };

      const updateSql = `
        UPDATE transactions
        SET wallet_id = $1, category_id = $2, to_wallet_id = $3, type = $4,
            amount = $5, note = $6, tags = $7, transaction_date = $8, attachment_path = $9
        WHERE id = $10
        RETURNING *
      `;
      const updateValues = [
        merged.wallet_id,
        merged.category_id || null,
        merged.to_wallet_id || null,
        merged.type,
        merged.amount,
        merged.note,
        JSON.stringify(merged.tags || []),
        merged.transaction_date,
        merged.attachment_path,
        id,
      ];
      await client.query(updateSql, updateValues);

      // Apply new transaction's effect
      if (merged.type === 'income') {
        await this._adjustBalance(client, merged.wallet_id, merged.amount);
      } else if (merged.type === 'expense') {
        await this._adjustBalance(client, merged.wallet_id, -merged.amount);
      } else if (merged.type === 'transfer' && merged.to_wallet_id) {
        await this._adjustBalance(client, merged.wallet_id, -merged.amount);
        await this._adjustBalance(client, merged.to_wallet_id, merged.amount);
      }

      return await this.findById(id, client);
    });
  },

  /**
   * Delete transaction atomically and revert wallet balance
   */
  async delete(id) {
    return await withTransaction(async (client) => {
      const old = await this.findById(id, client);
      if (!old) return null;

      // Revert balance
      if (old.type === 'income') {
        await this._adjustBalance(client, old.wallet_id, -old.amount);
      } else if (old.type === 'expense') {
        await this._adjustBalance(client, old.wallet_id, old.amount);
      } else if (old.type === 'transfer' && old.to_wallet_id) {
        await this._adjustBalance(client, old.wallet_id, old.amount);
        await this._adjustBalance(client, old.to_wallet_id, -old.amount);
      }

      await client.query(`DELETE FROM transactions WHERE id = $1`, [id]);
      return { id };
    });
  },

  /**
   * Financial Summary: Total income, expense, balance, savings rate, and month comparison
   */
  async getSummary({ start_date, end_date, wallet_id } = {}) {
    // Current period
    const conditions = [];
    const values = [];
    let counter = 1;

    if (wallet_id) {
      conditions.push(`(t.wallet_id = $${counter} OR t.to_wallet_id = $${counter})`);
      values.push(parseInt(wallet_id, 10));
      counter++;
    }

    if (start_date) {
      conditions.push(`t.transaction_date >= $${counter++}`);
      values.push(start_date);
    }
    if (end_date) {
      conditions.push(`t.transaction_date <= $${counter++}`);
      values.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const summarySql = `
      SELECT
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric AS total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric AS total_expense,
        COUNT(CASE WHEN t.type = 'income' THEN 1 END)::int AS income_count,
        COUNT(CASE WHEN t.type = 'expense' THEN 1 END)::int AS expense_count,
        COUNT(CASE WHEN t.type = 'transfer' THEN 1 END)::int AS transfer_count
      FROM transactions t
      ${whereClause}
    `;

    const summaryRes = await query(summarySql, values);
    const totalIncome = parseFloat(summaryRes.rows[0]?.total_income) || 0;
    const totalExpense = parseFloat(summaryRes.rows[0]?.total_expense) || 0;
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    // Total balance of all active wallets
    const walletBalanceSql = `
      SELECT COALESCE(SUM(balance), 0)::numeric AS total_balance
      FROM wallets
      WHERE is_archived = false
      ${wallet_id ? `AND id = ${parseInt(wallet_id, 10)}` : ''}
    `;
    const walletRes = await query(walletBalanceSql);
    const totalBalance = parseFloat(walletRes.rows[0]?.total_balance) || 0;

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      net_savings: netSavings,
      savings_rate: savingsRate,
      total_balance: totalBalance,
      counts: {
        income: summaryRes.rows[0]?.income_count || 0,
        expense: summaryRes.rows[0]?.expense_count || 0,
        transfer: summaryRes.rows[0]?.transfer_count || 0,
      },
    };
  },

  /**
   * Monthly report breakdown: by Category, by Day, and budgets comparison
   */
  async getMonthlyBreakdown({ year, month, wallet_id } = {}) {
    const padMonth = String(month).padStart(2, '0');
    const yearMonth = `${year}-${padMonth}`;
    const startDate = `${yearMonth}-01`;

    const walletFilter = wallet_id ? `AND t.wallet_id = ${parseInt(wallet_id, 10)}` : '';

    // 1. By Category expenses
    const categorySql = `
      SELECT 
        c.id AS category_id,
        COALESCE(c.name, 'ไม่ระบุหมวดหมู่') AS category_name,
        COALESCE(c.color, '#94A3B8') AS category_color,
        COALESCE(c.icon, 'tag') AS category_icon,
        COALESCE(b.budget_amount, c.monthly_budget, 0)::numeric AS budget,
        COALESCE(SUM(t.amount), 0)::numeric AS total_spent,
        COUNT(t.id)::int AS count
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN monthly_budgets b ON b.category_id = c.id AND b.year_month = $1
      WHERE t.type = 'expense'
        AND t.transaction_date >= $2::date
        AND t.transaction_date < ($2::date + INTERVAL '1 month')
        ${walletFilter}
      GROUP BY c.id, c.name, c.color, c.icon, b.budget_amount, c.monthly_budget
      ORDER BY total_spent DESC
    `;
    const categoryRes = await query(categorySql, [yearMonth, startDate]);

    // 2. Daily trend (income & expense per day)
    const dailySql = `
      SELECT 
        t.transaction_date,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric AS income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric AS expense
      FROM transactions t
      WHERE t.transaction_date >= $1::date
        AND t.transaction_date < ($1::date + INTERVAL '1 month')
        ${walletFilter}
      GROUP BY t.transaction_date
      ORDER BY t.transaction_date ASC
    `;
    const dailyRes = await query(dailySql, [startDate]);

    return {
      period: { year: parseInt(year, 10), month: parseInt(month, 10), year_month: yearMonth },
      categories: categoryRes.rows.map(row => ({
        ...row,
        budget: parseFloat(row.budget) || 0,
        total_spent: parseFloat(row.total_spent) || 0,
      })),
      daily: dailyRes.rows.map(row => ({
        date: row.transaction_date,
        income: parseFloat(row.income) || 0,
        expense: parseFloat(row.expense) || 0,
      })),
    };
  },

  /**
   * Budgets management
   */
  async getBudgets(year_month) {
    const sql = `
      SELECT 
        c.id AS category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE(b.budget_amount, c.monthly_budget, 0)::numeric AS budget_amount,
        COALESCE(
          (SELECT SUM(amount) FROM transactions 
           WHERE category_id = c.id 
             AND type = 'expense'
             AND transaction_date >= ($1 || '-01')::date
             AND transaction_date < (($1 || '-01')::date + INTERVAL '1 month')
          ), 0
        )::numeric AS current_spent
      FROM categories c
      LEFT JOIN monthly_budgets b ON b.category_id = c.id AND b.year_month = $1
      ORDER BY c.sort_order ASC, c.name ASC
    `;
    const res = await query(sql, [year_month]);
    return res.rows.map(row => ({
      ...row,
      budget_amount: parseFloat(row.budget_amount) || 0,
      current_spent: parseFloat(row.current_spent) || 0,
    }));
  },

  async upsertBudget({ category_id, year_month, budget_amount }) {
    const sql = `
      INSERT INTO monthly_budgets (category_id, year_month, budget_amount)
      VALUES ($1, $2, $3)
      ON CONFLICT (category_id, year_month)
      DO UPDATE SET budget_amount = EXCLUDED.budget_amount
      RETURNING *
    `;
    const res = await query(sql, [category_id, year_month, budget_amount]);
    return res.rows[0];
  },
};

module.exports = TransactionModel;
