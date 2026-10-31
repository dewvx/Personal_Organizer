const { query } = require('../config/database');

const WalletModel = {
  /**
   * Find all wallets with current calculated balance
   */
  async findAll({ is_archived = false } = {}) {
    const conditions = [];
    const values = [];

    if (is_archived !== 'all' && is_archived !== undefined) {
      conditions.push(`is_archived = $1`);
      values.push(is_archived === 'true' || is_archived === true);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        w.*,
        (SELECT COUNT(*)::int FROM transactions t WHERE t.wallet_id = w.id OR t.to_wallet_id = w.id) AS transaction_count
      FROM wallets w
      ${whereClause}
      ORDER BY w.sort_order ASC, w.created_at ASC
    `;

    const res = await query(sql, values);
    return res.rows.map(row => ({
      ...row,
      balance: parseFloat(row.balance) || 0,
    }));
  },

  /**
   * Find wallet by ID
   */
  async findById(id) {
    const sql = `SELECT * FROM wallets WHERE id = $1`;
    const res = await query(sql, [id]);
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      balance: parseFloat(res.rows[0].balance) || 0,
    };
  },

  /**
   * Create a new wallet
   */
  async create(data) {
    const {
      name,
      type = 'cash',
      balance = 0,
      icon = 'wallet',
      color = '#6366F1',
      sort_order = 0,
    } = data;

    const sql = `
      INSERT INTO wallets (name, type, balance, icon, color, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [name, type, balance || 0, icon, color, sort_order || 0];
    const res = await query(sql, values);
    return {
      ...res.rows[0],
      balance: parseFloat(res.rows[0].balance) || 0,
    };
  },

  /**
   * Update wallet
   */
  async update(id, data) {
    const allowed = ['name', 'type', 'balance', 'icon', 'color', 'is_archived', 'sort_order'];
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
      UPDATE wallets
      SET ${setClauses.join(', ')}
      WHERE id = $${counter}
      RETURNING *
    `;
    const res = await query(sql, values);
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      balance: parseFloat(res.rows[0].balance) || 0,
    };
  },

  /**
   * Delete wallet
   */
  async delete(id) {
    const res = await query(`DELETE FROM wallets WHERE id = $1 RETURNING id`, [id]);
    return res.rows[0] || null;
  },
};

module.exports = WalletModel;
