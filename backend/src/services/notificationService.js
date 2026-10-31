const { webPush } = require('../config/webPush');
const PushModel = require('../models/pushModel');
const { query } = require('../config/database');

const NotificationService = {
  /**
   * Broadcast push notification to all subscribers
   */
  async broadcastNotification({ title, body, url = '/' }) {
    const subscriptions = await PushModel.getAllSubscriptions();
    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0, cleaned: 0 };
    }

    const payload = JSON.stringify({
      title: title || 'Personal Organizer',
      body: body || 'คุณมีรายการที่ต้องจัดการ',
      url,
      timestamp: Date.now(),
    });

    let sent = 0;
    let failed = 0;
    let cleaned = 0;

    const promises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webPush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (err) {
        failed++;
        // If subscription is expired or invalid (HTTP 410 or 404), clean it from database
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushModel.deleteSubscription(sub.endpoint);
          cleaned++;
        }
      }
    });

    await Promise.all(promises);
    return { sent, failed, cleaned };
  },

  /**
   * Check for tasks due today or overdue and broadcast notification
   */
  async checkDueAndNotify() {
    const text = `
      SELECT id, title, due_date, priority
      FROM entries
      WHERE status != 'completed' 
        AND is_archived = false
        AND due_date IS NOT NULL
        AND due_date <= CURRENT_DATE
      ORDER BY due_date ASC, priority DESC
      LIMIT 5
    `;
    const res = await query(text);
    const dueEntries = res.rows;

    if (dueEntries.length === 0) {
      return { notified: false, message: 'ไม่มีรายการที่ครบกำหนดหรือค้างส่งในวันนี้' };
    }

    const count = dueEntries.length;
    const firstTitle = dueEntries[0].title;
    const body = count === 1
      ? `รายการ "${firstTitle}" ครบกำหนดส่งแล้ว!`
      : `คุณมี ${count} รายการที่ครบกำหนดส่ง เช่น "${firstTitle}"`;

    const result = await this.broadcastNotification({
      title: '⏰ แจ้งเตือนรายการถึงกำหนดส่ง',
      body,
      url: '/?due=today',
    });

    return {
      notified: true,
      dueCount: count,
      ...result,
    };
  },
};

module.exports = NotificationService;
