const cron = require('node-cron');
const NotificationService = require('./notificationService');

let scheduledJob = null;

const SchedulerService = {
  /**
   * Start scheduled notification checks
   * Default: 08:00 AM every day (Asia/Bangkok)
   */
  start() {
    // Cron syntax: 0 8 * * * (At 08:00 every day)
    // Supports custom schedule from env e.g. CRON_SCHEDULE="0 8 * * *"
    const scheduleExpression = process.env.CRON_SCHEDULE || '0 8 * * *';

    if (scheduledJob) {
      console.log('📅 Scheduler is already running.');
      return;
    }

    console.log(`⏰ Initializing Notification Scheduler with cron: "${scheduleExpression}" (Timezone: Asia/Bangkok)...`);

    scheduledJob = cron.schedule(
      scheduleExpression,
      async () => {
        const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
        console.log(`\n🔔 [Scheduler] Running automated due tasks check at: ${now}`);
        try {
          const result = await NotificationService.checkDueAndNotify();
          console.log('✅ [Scheduler] Notification check completed:', result);
        } catch (err) {
          console.error('❌ [Scheduler] Error checking due tasks:', err.message);
        }
      },
      {
        scheduled: true,
        timezone: 'Asia/Bangkok',
      }
    );

    console.log('✅ Automated Notification Scheduler started successfully.');
  },

  /**
   * Stop scheduled job (for graceful shutdown)
   */
  stop() {
    if (scheduledJob) {
      scheduledJob.stop();
      scheduledJob = null;
      console.log('🛑 Automated Notification Scheduler stopped.');
    }
  },
};

module.exports = SchedulerService;
