import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Plus,
  Sliders,
  CheckCircle2,
  Clock,
  Archive,
  Search,
} from 'lucide-react';
import { Reminder, Entry, Note } from '../types';
import { ReminderService } from '../services/reminderService';
import { EntryService } from '../services/entryService';
import { NoteService } from '../services/noteService';
import { ReminderCard } from '../components/reminders/ReminderCard';
import { ReminderFormModal } from '../components/reminders/ReminderFormModal';
import { DigestSettingsPanel } from '../components/reminders/DigestSettingsPanel';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'sent'>('upcoming');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const { showToast } = useToast();

  const loadReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ReminderService.getAll({ is_sent: tab === 'sent' });
      setReminders(res.reminders);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถโหลดการแจ้งเตือนได้', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [tab, showToast]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  useEffect(() => {
    EntryService.getAll({ limit: 100 }).then((r) => setEntries(r.entries)).catch(() => {});
    NoteService.getAll({ limit: 100 }).then((r) => setNotes(r.notes)).catch(() => {});
  }, []);

  const handleSave = async (data: Partial<Reminder>) => {
    try {
      if (editingReminder) {
        await ReminderService.update(editingReminder.id, data);
        showToast('อัปเดตการแจ้งเตือนสำเร็จ');
      } else {
        await ReminderService.create(data);
        showToast('สร้างการแจ้งเตือนสำเร็จ');
      }
      loadReminders();
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleSnooze = async (id: number, minutes: number) => {
    try {
      await ReminderService.snooze(id, minutes);
      showToast(`เลื่อนการเตือนออกไป ${minutes} นาที`);
      loadReminders();
    } catch (err) {
      showToast('ไม่สามารถเลื่อนเวลาได้', 'error');
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await ReminderService.dismiss(id);
      showToast('ปิดการแจ้งเตือนเรียบร้อย');
      loadReminders();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await ReminderService.delete(deletingId);
      setDeletingId(null);
      showToast('ลบการแจ้งเตือนสำเร็จ');
      loadReminders();
    } catch (err) {
      showToast('ไม่สามารถลบได้', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
              ระบบเตือนความจำอัจฉริยะ (Smart Reminders)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            ตั้งเตือนตามเวลา เลื่อนเวลา (Snooze) และรับสรุปภารกิจประจำวัน (Daily Digest)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsDigestOpen(true)}>
            <Sliders className="w-4 h-4 mr-1.5" /> สรุปอัตโนมัติ (Digest)
          </Button>
          <Button
            onClick={() => {
              setEditingReminder(null);
              setIsFormOpen(true);
            }}
            className="shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4 mr-1.5" /> ตั้งเตือนใหม่
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-fit">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            tab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          ⏰ กำลังจะถึง (Upcoming)
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            tab === 'sent'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          ✓ เตือนแล้ว (Completed)
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <EmptyState
          title={tab === 'upcoming' ? 'ไม่มีการแจ้งเตือนที่รออยู่' : 'ไม่มีประวัติการแจ้งเตือน'}
          description={
            tab === 'upcoming'
              ? 'คุณสามารถตั้งเตือนความจำสำหรับงานสำคัญ นัดหมาย หรือการเงินได้เลย'
              : 'การแจ้งเตือนที่ผ่านไปแล้วจะแสดงที่นี่'
          }
          actionLabel="ตั้งเวลาเตือนแรก"
          onAction={() => {
            setEditingReminder(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              onEdit={(rem) => {
                setEditingReminder(rem);
                setIsFormOpen(true);
              }}
              onDelete={(id) => setDeletingId(id)}
              onSnooze={handleSnooze}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* Reminder Form Modal */}
      <ReminderFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReminder(null);
        }}
        onSubmit={handleSave}
        initialData={editingReminder}
        entries={entries}
        notes={notes}
      />

      {/* Digest Settings Panel */}
      <DigestSettingsPanel
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
      />

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="ยืนยันการลบการแจ้งเตือน"
        message="คุณต้องการลบการแจ้งเตือนนี้ใช่หรือไม่?"
        confirmLabel="ลบ"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
