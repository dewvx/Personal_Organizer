const CategoryService = require('../services/categoryService');
const { successResponse } = require('../utils/apiResponse');

const CategoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await CategoryService.getAllCategories();
      return successResponse(res, categories, 'Categories retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await CategoryService.getCategoryById(id);
      return successResponse(res, category, 'Category retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const category = await CategoryService.createCategory(req.body);
      return successResponse(res, category, 'Category created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const category = await CategoryService.updateCategory(id, req.body);
      return successResponse(res, category, 'Category updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);
      return successResponse(res, null, 'Category deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = CategoryController;
