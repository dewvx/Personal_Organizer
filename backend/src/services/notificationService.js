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

  /**
   * Process and send smart reminders that are due right now
   */
  async checkAndSendReminders() {
    const ReminderModel = require('../models/reminderModel');
    const dueReminders = await ReminderModel.findDueReminders();
    if (dueReminders.length === 0) return { processed: 0 };

    let sentCount = 0;
    for (const r of dueReminders) {
      try {
        const title = `🔔 ${r.title}`;
        const body = r.message || (r.entry_title ? `เกี่ยวกับรายการ: "${r.entry_title}"` : 'ถึงเวลาที่กำหนดไว้แล้ว');
        const url = r.entry_id ? `/?tab=all&entry_id=${r.entry_id}` : '/?tab=reminders';

        await this.broadcastNotification({ title, body, url });
        await ReminderModel.markSent(r.id, r.repeat_type);
        sentCount++;
      } catch (err) {
        console.error(`Failed to broadcast reminder ${r.id}:`, err);
      }
    }

    return { processed: sentCount, total: dueReminders.length };
  },

  /**
   * Send Daily Digest (Morning briefing)
   */
  async sendDailyDigest() {
    const SettingModel = require('../models/settingModel');
    const enabled = await SettingModel.get('daily_digest_enabled');
    if (enabled !== 'true') return { skipped: true, reason: 'disabled' };

    // Count today's tasks & pending habits
    const tasksRes = await query(`
      SELECT COUNT(*)::int AS count
      FROM entries
      WHERE is_archived = false 
        AND status != 'completed'
        AND (due_date = CURRENT_DATE OR due_date < CURRENT_DATE)
    `);
    const todayTasks = tasksRes.rows[0]?.count || 0;

    const habitsRes = await query(`
      SELECT COUNT(*)::int AS count
      FROM habits h
      WHERE NOT EXISTS (
        SELECT 1 FROM habit_logs hl 
        WHERE hl.habit_id = h.id AND hl.log_date = CURRENT_DATE AND hl.is_completed = true
      )
    `);
    const pendingHabits = habitsRes.rows[0]?.count || 0;

    const body = `วันนี้มี ${todayTasks} งานที่ต้องทำ และอีก ${pendingHabits} กิจวัตรประจำวัน! ขอให้เป็นวันที่ยอดเยี่ยม 🚀`;
    return await this.broadcastNotification({
      title: '☀️ สรุปภารกิจประจำวัน (Daily Digest)',
      body,
      url: '/?tab=dashboard',
    });
  },

  /**
   * Send Weekly Summary (Sunday evening review)
   */
  async sendWeeklySummary() {
    const SettingModel = require('../models/settingModel');
    const enabled = await SettingModel.get('weekly_summary_enabled');
    if (enabled !== 'true') return { skipped: true, reason: 'disabled' };

    const completedRes = await query(`
      SELECT COUNT(*)::int AS count
      FROM entries
      WHERE status = 'completed'
        AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
    `);
    const completedTasks = completedRes.rows[0]?.count || 0;

    const body = `สัปดาห์นี้คุณทำภารกิจสำเร็จไปแล้ว ${completedTasks} รายการ! พร้อมลุยสัปดาห์หน้าแล้วหรือยัง ✨`;
    return await this.broadcastNotification({
      title: '📊 สรุปความคืบหน้ารายสัปดาห์ (Weekly Summary)',
      body,
      url: '/?tab=dashboard',
    });
  },
};

module.exports = NotificationService;
