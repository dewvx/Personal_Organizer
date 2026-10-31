const { query } = require('../config/database');

const PushModel = {
  /**
   * Save or update push subscription
   */
  async saveSubscription({ endpoint, p256dh, auth }) {
    const text = `
      INSERT INTO push_subscriptions (endpoint, p256dh, auth)
      VALUES ($1, $2, $3)
      ON CONFLICT (endpoint)
      DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const res = await query(text, [endpoint, p256dh, auth]);
    return res.rows[0];
  },

  /**
   * Delete subscription by endpoint
   */
  async deleteSubscription(endpoint) {
    const text = `DELETE FROM push_subscriptions WHERE endpoint = $1 RETURNING id`;
    const res = await query(text, [endpoint]);
    return res.rowCount > 0;
  },

  /**
   * Get all active subscriptions
   */
  async getAllSubscriptions() {
    const text = `SELECT id, endpoint, p256dh, auth, created_at FROM push_subscriptions ORDER BY created_at DESC`;
    const res = await query(text);
    return res.rows;
  },
};

module.exports = PushModel;
