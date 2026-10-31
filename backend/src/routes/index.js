const express = require('express');
const categoryRoutes = require('./categoryRoutes');
const entryRoutes = require('./entryRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const authRoutes = require('./authRoutes');
const habitRoutes = require('./habitRoutes');
const goalRoutes = require('./goalRoutes');
const notificationRoutes = require('./notificationRoutes');
const templateRoutes = require('./templateRoutes');
const AttachmentController = require('../controllers/attachmentController');
const { requireAuth } = require('../middlewares/authGuard');

const router = express.Router();

// Public / Auth routes (has internal pin verification)
router.use('/auth', authRoutes);

// Protected routes (guarded by requireAuth if a PIN is configured)
router.use('/categories', requireAuth, categoryRoutes);
router.use('/entries', requireAuth, entryRoutes);
router.use('/dashboard', requireAuth, dashboardRoutes);
router.use('/habits', requireAuth, habitRoutes);
router.use('/goals', requireAuth, goalRoutes);
router.use('/notifications', notificationRoutes);
router.use('/templates', requireAuth, templateRoutes);
router.delete('/attachments/:id', requireAuth, AttachmentController.delete);

module.exports = router;
