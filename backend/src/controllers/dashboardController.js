const DashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/apiResponse');

const DashboardController = {
  async getSummary(req, res, next) {
    try {
      const summary = await DashboardService.getSummary();
      return successResponse(res, summary, 'Dashboard summary retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async getMonthlyReport(req, res, next) {
    try {
      const { year, month } = req.query;
      const report = await DashboardService.getMonthlyReport({ year, month });
      return successResponse(res, report, 'Monthly report retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async getLayout(req, res, next) {
    try {
      const layout = await DashboardService.getLayout();
      return successResponse(res, layout, 'Dashboard layout retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateLayout(req, res, next) {
    try {
      const layout = await DashboardService.updateLayout(req.body.layout);
      return successResponse(res, layout, 'Dashboard layout updated successfully');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = DashboardController;
