const { query } = require('../config/database');

const CategoryModel = {
  /**
   * Get all categories with entries count (excluding archived entries or all entries)
   */
  async findAll() {
    const text = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.icon,
        c.color,
        c.monthly_budget,
        c.custom_schema,
        c.sort_order,
        c.created_at,
        c.updated_at,
        COUNT(e.id)::int AS entry_count,
        COUNT(CASE WHEN e.status = 'pending' AND e.is_archived = false THEN 1 END)::int AS pending_count,
        COALESCE(SUM(CASE 
          WHEN e.amount IS NOT NULL 
           AND e.is_archived = false 
           AND DATE_TRUNC('month', e.entry_date) = DATE_TRUNC('month', CURRENT_DATE) 
          THEN e.amount ELSE 0 END), 0)::float AS current_month_spent
      FROM categories c
      LEFT JOIN entries e ON c.id = e.category_id AND e.is_archived = false
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `;
    const res = await query(text);
    return res.rows;
  },

  /**
   * Find category by id
   */
  async findById(id) {
    const text = `
      SELECT 
        c.*,
        COUNT(e.id)::int AS entry_count,
        COALESCE(SUM(CASE 
          WHEN e.amount IS NOT NULL 
           AND e.is_archived = false 
           AND DATE_TRUNC('month', e.entry_date) = DATE_TRUNC('month', CURRENT_DATE) 
          THEN e.amount ELSE 0 END), 0)::float AS current_month_spent
      FROM categories c
      LEFT JOIN entries e ON c.id = e.category_id AND e.is_archived = false
      WHERE c.id = $1
      GROUP BY c.id
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Create a new category
   */
  async create({ name, description, icon, color, monthly_budget, custom_schema = [], sort_order = 0 }) {
    const text = `
      INSERT INTO categories (name, description, icon, color, monthly_budget, custom_schema, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      name.trim(),
      description ? description.trim() : null,
      icon || 'folder',
      color || '#6366F1',
      monthly_budget !== undefined && monthly_budget !== '' && monthly_budget !== null ? parseFloat(monthly_budget) : null,
      JSON.stringify(custom_schema || []),
      sort_order,
    ];
    const res = await query(text, values);
    return res.rows[0];
  },

  /**
   * Update category
   */
  async update(id, { name, description, icon, color, monthly_budget, custom_schema, sort_order }) {
    const fields = [];
    const values = [];
    let counter = 1;

    if (name !== undefined) {
      fields.push(`name = $${counter++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      fields.push(`description = $${counter++}`);
      values.push(description ? description.trim() : null);
    }
    if (icon !== undefined) {
      fields.push(`icon = $${counter++}`);
      values.push(icon);
    }
    if (color !== undefined) {
      fields.push(`color = $${counter++}`);
      values.push(color);
    }
    if (monthly_budget !== undefined) {
      fields.push(`monthly_budget = $${counter++}`);
      values.push(monthly_budget !== '' && monthly_budget !== null ? parseFloat(monthly_budget) : null);
    }
    if (custom_schema !== undefined) {
      fields.push(`custom_schema = $${counter++}`);
      values.push(JSON.stringify(custom_schema || []));
    }
    if (sort_order !== undefined) {
      fields.push(`sort_order = $${counter++}`);
      values.push(sort_order);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const text = `
      UPDATE categories
      SET ${fields.join(', ')}
      WHERE id = $${counter}
      RETURNING *
    `;
    const res = await query(text, values);
    return res.rows[0] || null;
  },

  /**
   * Delete category by id
   */
  async delete(id) {
    const text = `DELETE FROM categories WHERE id = $1 RETURNING id`;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },
};

module.exports = CategoryModel;
