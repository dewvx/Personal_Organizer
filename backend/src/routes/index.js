const express = require('express');
const categoryRoutes = require('./categoryRoutes');
const entryRoutes = require('./entryRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.use('/categories', categoryRoutes);
router.use('/entries', entryRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
