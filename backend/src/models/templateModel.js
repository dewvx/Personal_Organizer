const { query } = require('../config/database');
const EntryModel = require('./entryModel');
const CategoryModel = require('./categoryModel');

const TemplateModel = {
  /**
   * Find all templates
   */
  async findAll({ category } = {}) {
    const conditions = [];
    const values = [];
    let counter = 1;

    if (category && category !== 'all') {
      conditions.push(`category_name = $${counter++}`);
      values.push(category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const text = `
      SELECT id, title, description, category_name, icon, color, priority, 
             estimated_amount, tags, items, is_builtin, created_at
      FROM templates
      ${whereClause}
      ORDER BY is_builtin DESC, id ASC
    `;
    const res = await query(text, values);
    return res.rows.map((row) => ({
      ...row,
      estimated_amount: row.estimated_amount ? parseFloat(row.estimated_amount) : 0,
      tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'),
      items: Array.isArray(row.items) ? row.items : JSON.parse(row.items || '[]'),
    }));
  },

  /**
   * Find template by ID
   */
  async findById(id) {
    const text = `SELECT * FROM templates WHERE id = $1`;
    const res = await query(text, [id]);
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      ...row,
      estimated_amount: row.estimated_amount ? parseFloat(row.estimated_amount) : 0,
      tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'),
      items: Array.isArray(row.items) ? row.items : JSON.parse(row.items || '[]'),
    };
  },

  /**
   * Create custom template
   */
  async create({
    title,
    description,
    category_name,
    icon = 'sparkles',
    color = '#6366F1',
    priority = 'medium',
    estimated_amount = 0,
    tags = [],
    items = [],
  }) {
    const text = `
      INSERT INTO templates (
        title, description, category_name, icon, color, priority, 
        estimated_amount, tags, items, is_builtin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
      RETURNING *
    `;
    const values = [
      title.trim(),
      description ? description.trim() : null,
      category_name ? category_name.trim() : null,
      icon,
      color,
      priority,
      estimated_amount ? parseFloat(estimated_amount) : 0,
      JSON.stringify(tags || []),
      JSON.stringify(items || []),
    ];
    const res = await query(text, values);
    return this.findById(res.rows[0].id);
  },

  /**
   * Delete custom template
   */
  async delete(id) {
    const template = await this.findById(id);
    if (!template) return false;
    if (template.is_builtin) {
      throw new Error('ไม่สามารถลบเทมเพลตมาตรฐานของระบบได้');
    }
    const res = await query('DELETE FROM templates WHERE id = $1', [id]);
    return res.rowCount > 0;
  },

  /**
   * Apply template to create a new live entry
   */
  async apply(id) {
    const template = await this.findById(id);
    if (!template) return null;

    // Find category ID matching template.category_name if available
    let matchedCategoryId = null;
    if (template.category_name) {
      const allCategories = await CategoryModel.findAll();
      const matched = allCategories.find(
        (c) => c.name.toLowerCase() === template.category_name.toLowerCase()
      );
      if (matched) {
        matchedCategoryId = matched.id;
      }
    }

    const createdEntry = await EntryModel.create({
      title: template.title,
      description: template.description,
      category_id: matchedCategoryId,
      priority: template.priority || 'medium',
      amount: template.estimated_amount || null,
      tags: template.tags || [],
      items: (template.items || []).map((item) => ({
        title: item.title,
        amount: item.amount || 0,
        quantity: item.quantity || 1,
        is_completed: false,
      })),
    });

    return createdEntry;
  },
};

module.exports = TemplateModel;
