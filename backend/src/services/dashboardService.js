const EntryModel = require('../models/entryModel');
const CategoryModel = require('../models/categoryModel');

const DashboardService = {
  async getSummary() {
    const summaryData = await EntryModel.getDashboardSummary();
    const categories = await CategoryModel.findAll();

    return {
      ...summaryData,
      categories,
    };
  },
};

module.exports = DashboardService;
