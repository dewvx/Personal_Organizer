const express = require('express');
const EntryController = require('../controllers/entryController');
const AttachmentController = require('../controllers/attachmentController');
const { upload } = require('../middlewares/upload');

const router = express.Router();

// Export, Import and Bulk routes (must be before /:id)
router.get('/export', EntryController.exportData);
router.post('/import', EntryController.importData);
router.patch('/bulk/archive-completed', EntryController.archiveCompleted);

// Main CRUD
router.get('/', EntryController.getAll);
router.get('/:id', EntryController.getById);
router.post('/', EntryController.create);
router.post('/:id/duplicate', EntryController.duplicate);
router.put('/:id', EntryController.update);
router.patch('/:id/status', EntryController.updateStatus);
router.patch('/:id/favorite', EntryController.updateFavorite);
router.patch('/:id/archive', EntryController.updateArchive);
router.delete('/:id', EntryController.delete);

// Sub-Item routes
router.patch('/items/:itemId/toggle', EntryController.toggleSubItem);
router.post('/:id/items', EntryController.addSubItem);
router.delete('/items/:itemId', EntryController.deleteSubItem);

// Attachment routes (FEAT-B2)
router.get('/:id/attachments', AttachmentController.getByEntryId);
router.post('/:id/attachments', upload.array('files', 5), AttachmentController.upload);
router.delete('/attachments/:id', AttachmentController.delete);

module.exports = router;
