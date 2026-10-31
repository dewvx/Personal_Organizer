const GoalModel = require('../models/goalModel');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const GoalController = {
  async getAll(req, res, next) {
    try {
      const { status } = req.query;
      const goals = await GoalModel.findAll({ status });
      return successResponse(res, goals, 'Goals retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const goal = await GoalModel.findById(id);
      if (!goal) {
        return errorResponse(res, 'ไม่พบเป้าหมายที่ระบุ', 404);
      }
      return successResponse(res, goal, 'Goal retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { title } = req.body;
      if (!title || !title.trim()) {
        return errorResponse(res, 'กรุณาระบุชื่อเป้าหมาย', 400);
      }
      const goal = await GoalModel.create(req.body);
      return successResponse(res, goal, 'สร้างเป้าหมายเรียบร้อยแล้ว', 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const goal = await GoalModel.update(id, req.body);
      if (!goal) {
        return errorResponse(res, 'ไม่พบเป้าหมายที่ระบุ', 404);
      }
      return successResponse(res, goal, 'อัปเดตเป้าหมายเรียบร้อยแล้ว');
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await GoalModel.delete(id);
      if (!deleted) {
        return errorResponse(res, 'ไม่พบเป้าหมายที่ระบุ', 404);
      }
      return successResponse(res, null, 'ลบเป้าหมายเรียบร้อยแล้ว');
    } catch (err) {
      next(err);
    }
  },

  async getEntries(req, res, next) {
    try {
      const { id } = req.params;
      const entries = await GoalModel.getGoalEntries(id);
      return successResponse(res, entries, 'Goal entries retrieved successfully');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = GoalController;
