const express = require('express');
const router = express.Router();
const NoteController = require('../controllers/noteController');

router.get('/journal/calendar', NoteController.getJournalCalendar);
router.get('/', NoteController.getAll);
router.get('/:id', NoteController.getById);
router.post('/', NoteController.create);
router.put('/:id', NoteController.update);
router.delete('/:id', NoteController.delete);
router.patch('/:id/pin', NoteController.togglePin);
router.patch('/:id/archive', NoteController.toggleArchive);

module.exports = router;
