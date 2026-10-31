const EntryModel = require('../models/entryModel');
const EntryItemModel = require('../models/entryItemModel');
const CategoryModel = require('../models/categoryModel');

const EntryService = {
  async getAllEntries(queryParams) {
    return await EntryModel.findAll(queryParams);
  },

  async getEntryById(id) {
    const entry = await EntryModel.findById(id);
    if (!entry) {
      const error = new Error(`Entry with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    return entry;
  },

  async createEntry(data) {
    if (!data.title || !data.title.trim()) {
      const error = new Error('Title is required.');
      error.statusCode = 400;
      throw error;
    }

    if (data.category_id) {
      const category = await CategoryModel.findById(data.category_id);
      if (!category) {
        const error = new Error(`Category with ID ${data.category_id} does not exist.`);
        error.statusCode = 400;
        throw error;
      }
    }

    return await EntryModel.create(data);
  },

  async updateEntry(id, data) {
    await this.getEntryById(id);

    if (data.title !== undefined && !data.title.trim()) {
      const error = new Error('Title cannot be empty.');
      error.statusCode = 400;
      throw error;
    }

    if (data.category_id) {
      const category = await CategoryModel.findById(data.category_id);
      if (!category) {
        const error = new Error(`Category with ID ${data.category_id} does not exist.`);
        error.statusCode = 400;
        throw error;
      }
    }

    return await EntryModel.update(id, data);
  },

  async toggleStatus(id, status) {
    await this.getEntryById(id);
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    return await EntryModel.updateStatus(id, status);
  },

  async toggleFavorite(id, isFavorite) {
    await this.getEntryById(id);
    return await EntryModel.updateFavorite(id, isFavorite);
  },

  async toggleArchive(id, isArchived) {
    await this.getEntryById(id);
    return await EntryModel.updateArchive(id, isArchived);
  },

  async deleteEntry(id) {
    await this.getEntryById(id);
    return await EntryModel.delete(id);
  },

  async duplicateEntry(id) {
    await this.getEntryById(id);
    return await EntryModel.duplicate(id);
  },

  async archiveAllCompleted() {
    return await EntryModel.archiveCompleted();
  },

  // --- Sub-items / Checklist actions ---

  async toggleSubItem(itemId, isCompleted) {
    const item = await EntryItemModel.toggleCompleted(itemId, isCompleted);
    if (!item) {
      const error = new Error(`Item with ID ${itemId} not found.`);
      error.statusCode = 404;
      throw error;
    }
    return await EntryModel.findById(item.entry_id);
  },

  async addSubItem(entryId, itemData) {
    await this.getEntryById(entryId);
    await EntryItemModel.create(entryId, itemData);
    return await EntryModel.findById(entryId);
  },

  async deleteSubItem(itemId) {
    await EntryItemModel.delete(itemId);
  },

  // --- Export Data ---
  async getAllForExport() {
    return await EntryModel.getAllForExport();
  },
};

module.exports = EntryService;
