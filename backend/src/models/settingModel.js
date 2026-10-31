const { query } = require('../config/database');

const SettingModel = {
  /**
   * Get setting by key
   */
  async get(key) {
    const res = await query('SELECT value FROM app_settings WHERE key = $1', [key]);
    return res.rows[0] ? res.rows[0].value : null;
  },

  /**
   * Set or update setting by key
   */
  async set(key, value) {
    const res = await query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, String(value)]
    );
    return res.rows[0];
  },

  /**
   * Delete setting by key
   */
  async delete(key) {
    const res = await query('DELETE FROM app_settings WHERE key = $1 RETURNING key', [key]);
    return res.rowCount > 0;
  },
};

module.exports = SettingModel;
