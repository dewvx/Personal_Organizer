const AttachmentModel = require('../models/attachmentModel');
const EntryModel = require('../models/entryModel');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const AttachmentController = {
  /**
   * Upload attachments to entry
   */
  async upload(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await EntryModel.findById(id);
      if (!entry) {
        return errorResponse(res, 'ไม่พบรายการที่ระบุ', 404);
      }

      if (!req.files || req.files.length === 0) {
        return errorResponse(res, 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด', 400);
      }

      const createdAttachments = [];
      for (const file of req.files) {
        const attachment = await AttachmentModel.create({
          entry_id: parseInt(id, 10),
          file_name: Buffer.from(file.originalname, 'latin1').toString('utf8'), // handle UTF-8 Thai file names
          file_path: file.path,
          file_size: file.size,
          mime_type: file.mimetype,
        });
        createdAttachments.push(attachment);
      }

      return successResponse(
        res,
        createdAttachments,
        `อัปโหลดไฟล์สำเร็จ ${createdAttachments.length} ไฟล์`,
        201
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get attachments for an entry
   */
  async getByEntryId(req, res, next) {
    try {
      const { id } = req.params;
      const attachments = await AttachmentModel.findByEntryId(id);
      return successResponse(res, attachments, 'Attachments retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete an attachment
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await AttachmentModel.delete(id);
      if (!deleted) {
        return errorResponse(res, 'ไม่พบไฟล์แนบที่ระบุ', 404);
      }
      return successResponse(res, null, 'ลบไฟล์แนบเรียบร้อยแล้ว');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AttachmentController;
