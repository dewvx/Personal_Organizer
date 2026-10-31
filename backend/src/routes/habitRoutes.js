const express = require('express');
const router = express.Router();
const HabitController = require('../controllers/habitController');

router.get('/', HabitController.getAll);
router.get('/:id', HabitController.getById);
router.post('/', HabitController.create);
router.put('/:id', HabitController.update);
router.delete('/:id', HabitController.delete);
router.post('/:id/toggle', HabitController.toggleLog);

module.exports = router;
