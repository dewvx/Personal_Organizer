const cron = require('node-cron');
const NotificationService = require('./notificationService');

let scheduledJob = null;
let reminderCheckJob = null;
let dailyDigestJob = null;
let weeklySummaryJob = null;

const SchedulerService = {
  /**
   * Start scheduled notification checks
   */
  start() {
    const scheduleExpression = process.env.CRON_SCHEDULE || '0 8 * * *';

    if (scheduledJob) {
      console.log('📅 Scheduler is already running.');
      return;
    }

    console.log(`⏰ Initializing Notification Scheduler with cron: "${scheduleExpression}" (Timezone: Asia/Bangkok)...`);

    // 1. Task Due Check (Daily 08:00 AM)
    scheduledJob = cron.schedule(
      scheduleExpression,
      async () => {
        try {
          await NotificationService.checkDueAndNotify();
        } catch (err) {
          console.error('❌ [Scheduler] Error checking due tasks:', err.message);
        }
      },
      { scheduled: true, timezone: 'Asia/Bangkok' }
    );

    // 2. Smart Reminders minute-by-minute worker (* * * * *)
    reminderCheckJob = cron.schedule(
      '* * * * *',
      async () => {
        try {
          await NotificationService.checkAndSendReminders();
        } catch (err) {
          // Silent or log debug
        }
      },
      { scheduled: true, timezone: 'Asia/Bangkok' }
    );

    // 3. Daily Digest (07:30 AM every morning)
    dailyDigestJob = cron.schedule(
      '30 7 * * *',
      async () => {
        try {
          await NotificationService.sendDailyDigest();
        } catch (err) {
          console.error('❌ [Scheduler] Error sending daily digest:', err.message);
        }
      },
      { scheduled: true, timezone: 'Asia/Bangkok' }
    );

    // 4. Weekly Summary (Every Sunday at 20:00)
    weeklySummaryJob = cron.schedule(
      '0 20 * * 0',
      async () => {
        try {
          await NotificationService.sendWeeklySummary();
        } catch (err) {
          console.error('❌ [Scheduler] Error sending weekly summary:', err.message);
        }
      },
      { scheduled: true, timezone: 'Asia/Bangkok' }
    );

    console.log('✅ Automated Notification & Smart Reminder Schedulers started successfully.');
  },

  /**
   * Stop scheduled jobs (for graceful shutdown)
   */
  stop() {
    if (scheduledJob) scheduledJob.stop();
    if (reminderCheckJob) reminderCheckJob.stop();
    if (dailyDigestJob) dailyDigestJob.stop();
    if (weeklySummaryJob) weeklySummaryJob.stop();
    scheduledJob = null;
    reminderCheckJob = null;
    dailyDigestJob = null;
    weeklySummaryJob = null;
    console.log('🛑 Automated Schedulers stopped.');
  },
};

module.exports = SchedulerService;
