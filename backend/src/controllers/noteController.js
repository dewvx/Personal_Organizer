const NoteModel = require('../models/noteModel');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const NoteController = {
  async getAll(req, res, next) {
    try {
      const result = await NoteModel.findAll(req.query);
      return successResponse(
        res,
        result.notes,
        'ดึงรายการโน้ตสำเร็จ',
        200,
        result.meta
      );
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const note = await NoteModel.findById(req.params.id);
      if (!note) {
        return errorResponse(res, `ไม่พบบันทึกหมายเลข ${req.params.id}`, 404);
      }
      return successResponse(res, note, 'ดึงข้อมูลบันทึกสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { title } = req.body;
      if (!title || !title.trim()) {
        return errorResponse(res, 'กรุณาระบุหัวข้อบันทึก (Title is required)', 400);
      }
      const note = await NoteModel.create(req.body);
      return successResponse(res, note, 'สร้างบันทึกใหม่สำเร็จ', 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await NoteModel.findById(req.params.id);
      if (!existing) {
        return errorResponse(res, `ไม่พบบันทึกหมายเลข ${req.params.id}`, 404);
      }
      const updated = await NoteModel.update(req.params.id, req.body);
      return successResponse(res, updated, 'อัปเดตบันทึกสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const deleted = await NoteModel.delete(req.params.id);
      if (!deleted) {
        return errorResponse(res, `ไม่พบบันทึกหมายเลข ${req.params.id}`, 404);
      }
      return successResponse(res, { id: req.params.id }, 'ลบบันทึกสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async togglePin(req, res, next) {
    try {
      const note = await NoteModel.togglePin(req.params.id);
      if (!note) {
        return errorResponse(res, `ไม่พบบันทึกหมายเลข ${req.params.id}`, 404);
      }
      const msg = note.is_pinned ? 'ปักหมุดบันทึกสำเร็จ' : 'ยกเลิกการปักหมุดสำเร็จ';
      return successResponse(res, note, msg);
    } catch (err) {
      next(err);
    }
  },

  async toggleArchive(req, res, next) {
    try {
      const note = await NoteModel.toggleArchive(req.params.id);
      if (!note) {
        return errorResponse(res, `ไม่พบบันทึกหมายเลข ${req.params.id}`, 404);
      }
      const msg = note.is_archived ? 'เก็บเข้าคลังเอกสารสำเร็จ' : 'นำออกจากคลังเอกสารสำเร็จ';
      return successResponse(res, note, msg);
    } catch (err) {
      next(err);
    }
  },

  async getJournalCalendar(req, res, next) {
    try {
      const result = await NoteModel.getJournalCalendar(req.query);
      return successResponse(res, result, 'ดึงปฏิทินไดอารี่สำเร็จ');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = NoteController;
