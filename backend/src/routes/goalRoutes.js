const express = require('express');
const router = express.Router();
const GoalController = require('../controllers/goalController');

router.get('/', GoalController.getAll);
router.get('/:id', GoalController.getById);
router.get('/:id/entries', GoalController.getEntries);
router.post('/', GoalController.create);
router.put('/:id', GoalController.update);
router.delete('/:id', GoalController.delete);

module.exports = router;
