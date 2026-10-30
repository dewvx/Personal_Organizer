const { query } = require('../config/database');

const EntryItemModel = {
  /**
   * Get all items for an entry
   */
  async findByEntryId(entryId) {
    const text = `
      SELECT *
      FROM entry_items
      WHERE entry_id = $1
      ORDER BY sort_order ASC, id ASC
    `;
    const res = await query(text, [entryId]);
    return res.rows;
  },

  /**
   * Create an item for an entry
   */
  async create(entryId, { title, amount = 0, quantity = 1, is_completed = false, sort_order = 0 }) {
    const text = `
      INSERT INTO entry_items (entry_id, title, amount, quantity, is_completed, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      entryId,
      title.trim(),
      amount !== '' && amount !== null ? parseFloat(amount) : 0,
      quantity !== '' && quantity !== null ? parseInt(quantity, 10) : 1,
      is_completed === true || is_completed === 'true',
      sort_order || 0,
    ];
    const res = await query(text, values);

    // Auto-sync parent entry's total amount
    await this.syncParentAmount(entryId);

    return res.rows[0];
  },

  /**
   * Toggle item completion
   */
  async toggleCompleted(itemId, isCompleted) {
    const text = `
      UPDATE entry_items
      SET is_completed = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const res = await query(text, [isCompleted, itemId]);
    return res.rows[0] || null;
  },

  /**
   * Update item
   */
  async update(itemId, { title, amount, quantity, is_completed, sort_order }) {
    const fields = [];
    const values = [];
    let counter = 1;

    if (title !== undefined) {
      fields.push(`title = $${counter++}`);
      values.push(title.trim());
    }
    if (amount !== undefined) {
      fields.push(`amount = $${counter++}`);
      values.push(amount !== '' && amount !== null ? parseFloat(amount) : 0);
    }
    if (quantity !== undefined) {
      fields.push(`quantity = $${counter++}`);
      values.push(quantity !== '' && quantity !== null ? parseInt(quantity, 10) : 1);
    }
    if (is_completed !== undefined) {
      fields.push(`is_completed = $${counter++}`);
      values.push(is_completed === true || is_completed === 'true');
    }
    if (sort_order !== undefined) {
      fields.push(`sort_order = $${counter++}`);
      values.push(parseInt(sort_order, 10));
    }

    if (fields.length === 0) return null;

    values.push(itemId);
    const text = `
      UPDATE entry_items
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${counter}
      RETURNING *
    `;
    const res = await query(text, values);
    const item = res.rows[0];
    if (item) {
      await this.syncParentAmount(item.entry_id);
    }
    return item || null;
  },

  /**
   * Delete item
   */
  async delete(itemId) {
    const findText = `SELECT entry_id FROM entry_items WHERE id = $1`;
    const findRes = await query(findText, [itemId]);
    const entryId = findRes.rows[0]?.entry_id;

    const text = `DELETE FROM entry_items WHERE id = $1 RETURNING id`;
    const res = await query(text, [itemId]);

    if (entryId) {
      await this.syncParentAmount(entryId);
    }

    return res.rowCount > 0;
  },

  /**
   * Auto-sync parent entry's total amount from sub-items if items have amount
   */
  async syncParentAmount(entryId) {
    const sumText = `
      SELECT COALESCE(SUM(amount), 0)::float AS total_items_amount, COUNT(*)::int AS items_count
      FROM entry_items
      WHERE entry_id = $1
    `;
    const sumRes = await query(sumText, [entryId]);
    const { total_items_amount, items_count } = sumRes.rows[0];

    if (items_count > 0 && total_items_amount > 0) {
      await query(
        `UPDATE entries SET amount = $1 WHERE id = $2`,
        [total_items_amount, entryId]
      );
    }
  },
};

module.exports = EntryItemModel;
