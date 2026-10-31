const HabitModel = require('../models/habitModel');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const HabitController = {
  async getAll(req, res, next) {
    try {
      const habits = await HabitModel.findAll();
      return successResponse(res, habits, 'Habits retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const habit = await HabitModel.findById(id);
      if (!habit) {
        return errorResponse(res, 'ไม่พบกิจวัตรที่ระบุ', 404);
      }
      return successResponse(res, habit, 'Habit retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return errorResponse(res, 'กรุณาระบุชื่อกิจวัตร', 400);
      }
      const habit = await HabitModel.create(req.body);
      return successResponse(res, habit, 'สร้างกิจวัตรเรียบร้อยแล้ว', 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const habit = await HabitModel.update(id, req.body);
      if (!habit) {
        return errorResponse(res, 'ไม่พบกิจวัตรที่ระบุ', 404);
      }
      return successResponse(res, habit, 'อัปเดตกิจวัตรเรียบร้อยแล้ว');
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await HabitModel.delete(id);
      return successResponse(res, null, 'ลบกิจวัตรเรียบร้อยแล้ว');
    } catch (err) {
      next(err);
    }
  },

  async toggleLog(req, res, next) {
    try {
      const { id } = req.params;
      const { log_date } = req.body;
      const result = await HabitModel.toggleLog(id, log_date);
      return successResponse(res, result, 'อัปเดตความคืบหน้ากิจวัตรเรียบร้อย');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = HabitController;
