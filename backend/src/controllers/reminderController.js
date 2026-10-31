const ReminderModel = require('../models/reminderModel');
const SettingModel = require('../models/settingModel');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const ReminderController = {
  async getAll(req, res, next) {
    try {
      const result = await ReminderModel.findAll(req.query);
      return successResponse(res, result.reminders, 'ดึงการแจ้งเตือนสำเร็จ', 200, result.meta);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const reminder = await ReminderModel.findById(req.params.id);
      if (!reminder) return errorResponse(res, 'ไม่พบการแจ้งเตือน', 404);
      return successResponse(res, reminder, 'ดึงข้อมูลการแจ้งเตือนสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { title, remind_at } = req.body;
      if (!title || !title.trim()) return errorResponse(res, 'กรุณาระบุหัวข้อการแจ้งเตือน', 400);
      if (!remind_at) return errorResponse(res, 'กรุณาระบุเวลาแจ้งเตือน', 400);

      const reminder = await ReminderModel.create(req.body);
      return successResponse(res, reminder, 'สร้างการแจ้งเตือนสำเร็จ', 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const reminder = await ReminderModel.update(req.params.id, req.body);
      if (!reminder) return errorResponse(res, 'ไม่พบการแจ้งเตือน', 404);
      return successResponse(res, reminder, 'อัปเดตการแจ้งเตือนสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await ReminderModel.delete(req.params.id);
      if (!deleted) return errorResponse(res, 'ไม่พบการแจ้งเตือน', 404);
      return successResponse(res, { id: req.params.id }, 'ลบการแจ้งเตือนสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async snooze(req, res, next) {
    try {
      const minutes = parseInt(req.body.minutes, 10) || 15;
      const reminder = await ReminderModel.snooze(req.params.id, minutes);
      if (!reminder) return errorResponse(res, 'ไม่พบการแจ้งเตือน', 404);
      return successResponse(res, reminder, `เลื่อนการแจ้งเตือนออกไป ${minutes} นาที`);
    } catch (err) {
      next(err);
    }
  },

  async dismiss(req, res, next) {
    try {
      const reminder = await ReminderModel.dismiss(req.params.id);
      if (!reminder) return errorResponse(res, 'ไม่พบการแจ้งเตือน', 404);
      return successResponse(res, reminder, 'ปิดการแจ้งเตือนเรียบร้อย');
    } catch (err) {
      next(err);
    }
  },

  // Reminder Settings (Daily Digest & Weekly Summary)
  async getSettings(req, res, next) {
    try {
      const dailyDigestEnabled = await SettingModel.get('daily_digest_enabled');
      const dailyDigestTime = await SettingModel.get('daily_digest_time');
      const weeklySummaryEnabled = await SettingModel.get('weekly_summary_enabled');
      const weeklySummaryDay = await SettingModel.get('weekly_summary_day');

      return successResponse(res, {
        daily_digest_enabled: dailyDigestEnabled === 'true',
        daily_digest_time: dailyDigestTime || '08:00',
        weekly_summary_enabled: weeklySummaryEnabled === 'true',
        weekly_summary_day: parseInt(weeklySummaryDay, 10) || 0, // 0 = Sunday
      }, 'ดึงการตั้งค่าเตือนความจำสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const {
        daily_digest_enabled,
        daily_digest_time,
        weekly_summary_enabled,
        weekly_summary_day,
      } = req.body;

      if (daily_digest_enabled !== undefined) {
        await SettingModel.set('daily_digest_enabled', String(daily_digest_enabled));
      }
      if (daily_digest_time !== undefined) {
        await SettingModel.set('daily_digest_time', String(daily_digest_time));
      }
      if (weekly_summary_enabled !== undefined) {
        await SettingModel.set('weekly_summary_enabled', String(weekly_summary_enabled));
      }
      if (weekly_summary_day !== undefined) {
        await SettingModel.set('weekly_summary_day', String(weekly_summary_day));
      }

      return successResponse(res, { success: true }, 'บันทึกการตั้งค่าเรียบร้อย');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ReminderController;
