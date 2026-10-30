const CategoryModel = require('../models/categoryModel');

const CategoryService = {
  async getAllCategories() {
    return await CategoryModel.findAll();
  },

  async getCategoryById(id) {
    const category = await CategoryModel.findById(id);
    if (!category) {
      const error = new Error(`Category with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    return category;
  },

  async createCategory(data) {
    if (!data.name || !data.name.trim()) {
      const error = new Error('Category name is required.');
      error.statusCode = 400;
      throw error;
    }
    return await CategoryModel.create(data);
  },

  async updateCategory(id, data) {
    await this.getCategoryById(id);
    if (data.name !== undefined && !data.name.trim()) {
      const error = new Error('Category name cannot be empty.');
      error.statusCode = 400;
      throw error;
    }
    return await CategoryModel.update(id, data);
  },

  async deleteCategory(id) {
    await this.getCategoryById(id);
    return await CategoryModel.delete(id);
  },
};

module.exports = CategoryService;
