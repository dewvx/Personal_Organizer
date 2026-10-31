const express = require('express');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/summary', DashboardController.getSummary);
router.get('/reports/monthly', DashboardController.getMonthlyReport);
router.get('/layout', DashboardController.getLayout);
router.put('/layout', DashboardController.updateLayout);

module.exports = router;
