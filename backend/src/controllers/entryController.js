const EntryService = require('../services/entryService');
const { successResponse } = require('../utils/apiResponse');

const EntryController = {
  async getAll(req, res, next) {
    try {
      const result = await EntryService.getAllEntries(req.query);
      return successResponse(res, result.entries, 'Entries retrieved successfully', 200, result.meta);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await EntryService.getEntryById(id);
      return successResponse(res, entry, 'Entry retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const entry = await EntryService.createEntry(req.body);
      return successResponse(res, entry, 'Entry created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await EntryService.updateEntry(id, req.body);
      return successResponse(res, entry, 'Entry updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const entry = await EntryService.toggleStatus(id, status);
      return successResponse(res, entry, 'Status updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateFavorite(req, res, next) {
    try {
      const { id } = req.params;
      const { is_favorite } = req.body;
      const entry = await EntryService.toggleFavorite(id, is_favorite);
      return successResponse(res, entry, 'Favorite status updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateArchive(req, res, next) {
    try {
      const { id } = req.params;
      const { is_archived } = req.body;
      const entry = await EntryService.toggleArchive(id, is_archived);
      return successResponse(res, entry, 'Archive status updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await EntryService.deleteEntry(id);
      return successResponse(res, null, 'Entry deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  // --- Sub-Item Endpoints ---

  async toggleSubItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const { is_completed } = req.body;
      const updatedEntry = await EntryService.toggleSubItem(itemId, is_completed);
      return successResponse(res, updatedEntry, 'Item status updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async addSubItem(req, res, next) {
    try {
      const { id } = req.params;
      const updatedEntry = await EntryService.addSubItem(id, req.body);
      return successResponse(res, updatedEntry, 'Item added successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async deleteSubItem(req, res, next) {
    try {
      const { itemId } = req.params;
      await EntryService.deleteSubItem(itemId);
      return successResponse(res, null, 'Item deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  // --- Export Endpoints ---

  async exportData(req, res, next) {
    try {
      const { format = 'json' } = req.query;
      const entries = await EntryService.getAllForExport();

      if (format === 'csv') {
        const headers = [
          'ID',
          'Title',
          'Category',
          'Status',
          'Priority',
          'Amount (THB)',
          'Quantity',
          'Entry Date',
          'Due Date',
          'Recurring',
          'Sub Items',
          'Description',
        ];

        const rows = entries.map((e) => {
          const subItemsText = (e.items || [])
            .map((item) => `[${item.is_completed ? 'X' : ' '}] ${item.title} (${item.amount || 0}B)`)
            .join('; ');

          return [
            e.id,
            `"${(e.title || '').replace(/"/g, '""')}"`,
            `"${(e.category_name || '').replace(/"/g, '""')}"`,
            e.status,
            e.priority,
            e.amount || '',
            e.quantity || '',
            e.entry_date ? e.entry_date.split('T')[0] : '',
            e.due_date ? e.due_date.split('T')[0] : '',
            e.recurring || 'none',
            `"${subItemsText.replace(/"/g, '""')}"`,
            `"${(e.description || '').replace(/"/g, '""')}"`,
          ].join(',');
        });

        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n'); // \uFEFF UTF-8 BOM for Thai Excel

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="personal_organizer_${new Date().toISOString().split('T')[0]}.csv"`);
        return res.status(200).send(csvContent);
      }

      // Default JSON export
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="personal_organizer_backup_${new Date().toISOString().split('T')[0]}.json"`);
      return res.status(200).json(entries);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = EntryController;
