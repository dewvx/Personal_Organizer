const bcrypt = require('bcryptjs');
const SettingModel = require('../models/settingModel');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { generateToken } = require('../middlewares/authGuard');

const PIN_SETTING_KEY = 'pin_hash';

const AuthController = {
  /**
   * Get PIN lock status
   */
  async getPinStatus(req, res, next) {
    try {
      const pinHash = await SettingModel.get(PIN_SETTING_KEY);
      return successResponse(res, { hasPin: Boolean(pinHash) }, 'PIN status retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Verify PIN for unlocking
   */
  async verifyPin(req, res, next) {
    try {
      const { pin } = req.body;
      if (!pin) {
        return errorResponse(res, 'กรุณาระบุรหัส PIN', 400);
      }

      const pinHash = await SettingModel.get(PIN_SETTING_KEY);
      if (!pinHash) {
        // No PIN configured, unlocked by default
        return successResponse(res, { verified: true, hasPin: false }, 'ไม่ได้ตั้งรหัส PIN');
      }

      const isMatch = await bcrypt.compare(String(pin), pinHash);
      if (!isMatch) {
        return errorResponse(res, 'รหัส PIN ไม่ถูกต้อง', 401);
      }

      const token = generateToken({ verified: true });
      return successResponse(res, { verified: true, hasPin: true, token }, 'ปลดล็อกสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Set or change PIN
   */
  async setPin(req, res, next) {
    try {
      const { pin, currentPin } = req.body;

      if (!pin || !/^\d{4}$/.test(String(pin))) {
        return errorResponse(res, 'รหัส PIN ต้องเป็นตัวเลข 4 หลัก', 400);
      }

      const existingHash = await SettingModel.get(PIN_SETTING_KEY);
      if (existingHash) {
        if (!currentPin) {
          return errorResponse(res, 'กรุณาระบุรหัส PIN ปัจจุบันเพื่อเปลี่ยนรหัส', 400);
        }
        const isMatch = await bcrypt.compare(String(currentPin), existingHash);
        if (!isMatch) {
          return errorResponse(res, 'รหัส PIN ปัจจุบันไม่ถูกต้อง', 401);
        }
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(String(pin), salt);

      await SettingModel.set(PIN_SETTING_KEY, newHash);
      const token = generateToken({ verified: true });
      return successResponse(res, { hasPin: true, token }, 'ตั้งค่ารหัส PIN เรียบร้อยแล้ว');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Disable / remove PIN
   */
  async disablePin(req, res, next) {
    try {
      const { currentPin } = req.body;
      const existingHash = await SettingModel.get(PIN_SETTING_KEY);

      if (!existingHash) {
        return successResponse(res, { hasPin: false }, 'ไม่ได้ตั้งค่ารหัส PIN อยู่แล้ว');
      }

      if (!currentPin) {
        return errorResponse(res, 'กรุณาระบุรหัส PIN ปัจจุบันเพื่อยกเลิก', 400);
      }

      const isMatch = await bcrypt.compare(String(currentPin), existingHash);
      if (!isMatch) {
        return errorResponse(res, 'รหัส PIN ปัจจุบันไม่ถูกต้อง', 401);
      }

      await SettingModel.delete(PIN_SETTING_KEY);
      return successResponse(res, { hasPin: false }, 'ยกเลิกรหัส PIN เรียบร้อยแล้ว');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
