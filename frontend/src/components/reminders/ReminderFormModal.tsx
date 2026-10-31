import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, Clock, RefreshCw } from 'lucide-react';
import { Reminder, ReminderRepeat, Entry, Note } from '../../types';
import { Button } from '../common/Button';

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Reminder>) => Promise<void>;
  initialData?: Reminder | null;
  entries?: Entry[];
  notes?: Note[];
  defaultEntryId?: number;
  defaultNoteId?: number;
}

export const ReminderFormModal: React.FC<ReminderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  entries = [],
  notes = [],
  defaultEntryId,
  defaultNoteId,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [remindDate, setRemindDate] = useState('');
  const [remindTime, setRemindTime] = useState('09:00');
  const [repeatType, setRepeatType] = useState<ReminderRepeat>('none');
  const [entryId, setEntryId] = useState<number | undefined>(defaultEntryId);
  const [noteId, setNoteId] = useState<number | undefined>(defaultNoteId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setMessage(initialData.message || '');
      setRepeatType(initialData.repeat_type || 'none');
      setEntryId(initialData.entry_id || undefined);
      setNoteId(initialData.note_id || undefined);

      if (initialData.remind_at) {
        const d = new Date(initialData.remind_at);
        setRemindDate(d.toISOString().slice(0, 10));
        setRemindTime(
          `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        );
      }
    } else {
      // Default: 1 hour from now or tomorrow morning
      const now = new Date();
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);

      setTitle('');
      setMessage('');
      setRemindDate(now.toISOString().slice(0, 10));
      setRemindTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setRepeatType('none');
      setEntryId(defaultEntryId);
      setNoteId(defaultNoteId);
    }
  }, [initialData, isOpen, defaultEntryId, defaultNoteId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !remindDate || !remindTime) return;

    try {
      setIsSubmitting(true);
      const isoRemindAt = new Date(`${remindDate}T${remindTime}:00`).toISOString();

      await onSubmit({
        title: title.trim(),
        message: message.trim() || null,
        remind_at: isoRemindAt,
        repeat_type: repeatType,
        entry_id: entryId || null,
        note_id: noteId || null,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {initialData ? 'แก้ไขการแจ้งเตือน' : 'ตั้งการเตือนความจำใหม่ (New Reminder)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              หัวข้อการแจ้งเตือน (Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ส่งรายงานสรุป, จ่ายค่าบัตรเครดิต, ทานยา..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              ข้อความแจ้งเตือนเพิ่มเติม (Message)
            </label>
            <textarea
              rows={2}
              placeholder="รายละเอียดที่ต้องการให้แสดงตอนเตือน..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                วันที่เตือน (Date) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={remindDate}
                onChange={(e) => setRemindDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                เวลา (Time) <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={remindTime}
                onChange={(e) => setRemindTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              การทำซ้ำ (Repeat Frequency)
            </label>
            <select
              value={repeatType}
              onChange={(e) => setRepeatType(e.target.value as ReminderRepeat)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="none">เตือนครั้งเดียว (No repeat)</option>
              <option value="daily">ทุกวัน (Daily)</option>
              <option value="weekly">ทุกสัปดาห์ (Weekly)</option>
              <option value="monthly">ทุกเดือน (Monthly)</option>
            </select>
          </div>

          {/* Links to Entry */}
          {entries.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                ผูกกับรายการ (Link to Task)
              </label>
              <select
                value={entryId || ''}
                onChange={(e) => setEntryId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- ไม่ผูกกับรายการ --</option>
                {entries.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {initialData ? 'บันทึก' : 'ตั้งเวลาเตือน'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
