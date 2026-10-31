const { vapidPublicKey } = require('../config/webPush');
const PushModel = require('../models/pushModel');
const NotificationService = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const NotificationController = {
  /**
   * Get VAPID public key
   */
  getVapidPublicKey(req, res) {
    return successResponse(res, { publicKey: vapidPublicKey }, 'VAPID public key retrieved');
  },

  /**
   * Subscribe client to push notifications
   */
  async subscribe(req, res, next) {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return errorResponse(res, 'ข้อมูล Push Subscription ไม่ถูกต้อง', 400);
      }

      const subscription = await PushModel.saveSubscription({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });

      return successResponse(res, subscription, 'ลงทะเบียนรับการแจ้งเตือนสำเร็จ', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Unsubscribe client
   */
  async unsubscribe(req, res, next) {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return errorResponse(res, 'กรุณาระบุ endpoint', 400);
      }

      await PushModel.deleteSubscription(endpoint);
      return successResponse(res, null, 'ยกเลิกการแจ้งเตือนเรียบร้อย');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Send test push notification
   */
  async sendTest(req, res, next) {
    try {
      const { title, body } = req.body;
      const result = await NotificationService.broadcastNotification({
        title: title || '🔔 ทดสอบการแจ้งเตือน Personal Organizer',
        body: body || 'ระบบ Web Push Notification พร้อมใช้งานสมบูรณ์แบบ!',
        url: '/',
      });

      return successResponse(res, result, 'ส่งการแจ้งเตือนทดสอบเรียบร้อยแล้ว');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Check due tasks and notify
   */
  async checkDue(req, res, next) {
    try {
      const result = await NotificationService.checkDueAndNotify();
      return successResponse(res, result, 'ตรวจสอบและส่งการแจ้งเตือนงานที่ถึงกำหนดเรียบร้อย');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = NotificationController;
