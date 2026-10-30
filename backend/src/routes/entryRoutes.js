const express = require('express');
const EntryController = require('../controllers/entryController');

const router = express.Router();

// Export route (must be before /:id)
router.get('/export', EntryController.exportData);

// Main CRUD
router.get('/', EntryController.getAll);
router.get('/:id', EntryController.getById);
router.post('/', EntryController.create);
router.put('/:id', EntryController.update);
router.patch('/:id/status', EntryController.updateStatus);
router.patch('/:id/favorite', EntryController.updateFavorite);
router.patch('/:id/archive', EntryController.updateArchive);
router.delete('/:id', EntryController.delete);

// Sub-Item routes
router.patch('/items/:itemId/toggle', EntryController.toggleSubItem);
router.post('/:id/items', EntryController.addSubItem);
router.delete('/items/:itemId', EntryController.deleteSubItem);

module.exports = router;
