const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');

router.get('/vapid-public-key', NotificationController.getVapidPublicKey);
router.post('/subscribe', NotificationController.subscribe);
router.post('/unsubscribe', NotificationController.unsubscribe);
router.post('/test', NotificationController.sendTest);
router.post('/check-due', NotificationController.checkDue);

module.exports = router;
