import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, ArrowRight, Clock } from 'lucide-react';
import { Reminder } from '../../types';
import { ReminderService } from '../../services/reminderService';
import { ReminderFormModal } from './ReminderFormModal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface RemindersWidgetProps {
  onNavigateReminders?: () => void;
}

export const RemindersWidget: React.FC<RemindersWidgetProps> = ({ onNavigateReminders }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  const loadReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ReminderService.getAll({ is_sent: false });
      setReminders(res.reminders.slice(0, 4));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleCreate = async (data: Partial<Reminder>) => {
    await ReminderService.create(data);
    showToast('สร้างการแจ้งเตือนสำเร็จ');
    loadReminders();
  };

  const handleDismiss = async (id: number) => {
    await ReminderService.dismiss(id);
    showToast('ปิดการแจ้งเตือนแล้ว');
    loadReminders();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              การแจ้งเตือนสำคัญ (Smart Reminders)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              เตือนตามเวลาและรอบที่กำหนด
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> ตั้งเตือน
          </Button>
          {onNavigateReminders && (
            <button
              onClick={onNavigateReminders}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="ดูทั้งหมด"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-500 mb-2">ไม่มีการแจ้งเตือนที่ค้างอยู่</p>
          <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(true)}>
            ตั้งเวลาเตือนใหม่
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => {
            const isDue = new Date(r.snooze_until || r.remind_at) <= new Date();
            const timeStr = new Date(r.snooze_until || r.remind_at).toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={r.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isDue
                    ? 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isDue ? 'bg-rose-500 animate-ping' : 'bg-indigo-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {r.title}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {timeStr}
                      {r.repeat_type !== 'none' && ` • ซ้ำ${r.repeat_type}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismiss(r.id)}
                  className="text-[10px] font-semibold px-2 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  เสร็จแล้ว
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ReminderFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};
