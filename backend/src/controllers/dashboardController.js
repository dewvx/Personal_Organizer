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
};

module.exports = DashboardController;
