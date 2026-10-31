const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { uploadDir } = require('../middlewares/upload');

const AttachmentModel = {
  /**
   * Find attachments by entry ID
   */
  async findByEntryId(entryId) {
    const text = `
      SELECT id, entry_id, file_name, file_path, file_size, mime_type, created_at
      FROM entry_attachments
      WHERE entry_id = $1
      ORDER BY created_at ASC
    `;
    const res = await query(text, [entryId]);
    return res.rows.map((att) => ({
      ...att,
      url: `/uploads/${path.basename(att.file_path)}`,
    }));
  },

  /**
   * Find attachment by ID
   */
  async findById(id) {
    const text = `
      SELECT id, entry_id, file_name, file_path, file_size, mime_type, created_at
      FROM entry_attachments
      WHERE id = $1
    `;
    const res = await query(text, [id]);
    if (!res.rows[0]) return null;
    const att = res.rows[0];
    return {
      ...att,
      url: `/uploads/${path.basename(att.file_path)}`,
    };
  },

  /**
   * Create attachment
   */
  async create({ entry_id, file_name, file_path, file_size, mime_type }) {
    const text = `
      INSERT INTO entry_attachments (entry_id, file_name, file_path, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [entry_id, file_name, file_path, file_size, mime_type];
    const res = await query(text, values);
    const att = res.rows[0];
    return {
      ...att,
      url: `/uploads/${path.basename(att.file_path)}`,
    };
  },

  /**
   * Delete attachment and clean up disk file
   */
  async delete(id) {
    const attachment = await this.findById(id);
    if (!attachment) return false;

    // Delete from database
    const text = `DELETE FROM entry_attachments WHERE id = $1 RETURNING id`;
    const res = await query(text, [id]);

    // Delete file from disk if exists
    if (res.rowCount > 0 && attachment.file_path) {
      try {
        if (fs.existsSync(attachment.file_path)) {
          fs.unlinkSync(attachment.file_path);
        }
      } catch (err) {
        console.warn(`Could not delete file ${attachment.file_path}:`, err.message);
      }
      return true;
    }
    return false;
  },
};

module.exports = AttachmentModel;
