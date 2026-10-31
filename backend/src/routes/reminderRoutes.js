const express = require('express');
const router = express.Router();
const ReminderController = require('../controllers/reminderController');

router.get('/settings', ReminderController.getSettings);
router.put('/settings', ReminderController.updateSettings);

router.get('/', ReminderController.getAll);
router.get('/:id', ReminderController.getById);
router.post('/', ReminderController.create);
router.put('/:id', ReminderController.update);
router.delete('/:id', ReminderController.delete);
router.post('/:id/snooze', ReminderController.snooze);
router.post('/:id/dismiss', ReminderController.dismiss);

module.exports = router;
