const TemplateModel = require('../models/templateModel');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const TemplateController = {
  async getAll(req, res, next) {
    try {
      const { category } = req.query;
      const templates = await TemplateModel.findAll({ category });
      return successResponse(res, templates, 'Templates retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const template = await TemplateModel.findById(id);
      if (!template) {
        return errorResponse(res, 'ไม่พบเทมเพลตที่ระบุ', 404);
      }
      return successResponse(res, template, 'Template retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { title } = req.body;
      if (!title || !title.trim()) {
        return errorResponse(res, 'กรุณาระบุชื่อเทมเพลต', 400);
      }
      const template = await TemplateModel.create(req.body);
      return successResponse(res, template, 'สร้างเทมเพลตเรียบร้อยแล้ว', 201);
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await TemplateModel.delete(id);
      return successResponse(res, null, 'ลบเทมเพลตเรียบร้อยแล้ว');
    } catch (err) {
      if (err.message.includes('ไม่สามารถลบ')) {
        return errorResponse(res, err.message, 403);
      }
      next(err);
    }
  },

  async apply(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await TemplateModel.apply(id);
      if (!entry) {
        return errorResponse(res, 'ไม่พบเทมเพลตที่ระบุ', 404);
      }
      return successResponse(res, entry, 'สร้างรายการจากเทมเพลตเรียบร้อยแล้ว', 201);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = TemplateController;
