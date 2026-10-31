import React from 'react';
import { Bell, Clock, Check, RefreshCw, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { Reminder } from '../../types';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: number) => void;
  onSnooze: (id: number, minutes: number) => void;
  onDismiss: (id: number) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onEdit,
  onDelete,
  onSnooze,
  onDismiss,
}) => {
  const isOverdue = !reminder.is_sent && new Date(reminder.snooze_until || reminder.remind_at) < new Date();
  const remindDate = new Date(reminder.snooze_until || reminder.remind_at);

  return (
    <div
      className={`group p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
        reminder.is_sent
          ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60 opacity-70'
          : isOverdue
          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            reminder.is_sent
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              : isOverdue
              ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
              : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          <Bell className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h4
              className={`text-sm font-bold ${
                reminder.is_sent
                  ? 'text-slate-400 line-through'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {reminder.title}
            </h4>

            {reminder.repeat_type !== 'none' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <RefreshCw className="w-2.5 h-2.5" />
                {reminder.repeat_type === 'daily'
                  ? 'ทุกวัน'
                  : reminder.repeat_type === 'weekly'
                  ? 'ทุกสัปดาห์'
                  : 'ทุกเดือน'}
              </span>
            )}

            {reminder.is_snoozed && (
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                เลื่อนเตือนไว้
              </span>
            )}
          </div>

          {reminder.message && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 line-clamp-2">
              {reminder.message}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span
              className={`flex items-center gap-1 font-semibold ${
                isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''
              }`}
            >
              <Clock className="w-3 h-3" />
              {remindDate.toLocaleString('th-TH', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>

            {reminder.entry_title && (
              <span>• ผูกกับ: {reminder.entry_title}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
        {!reminder.is_sent && (
          <>
            {/* Snooze menu */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onSnooze(reminder.id, Number(e.target.value));
                  e.target.value = '';
                }
              }}
              className="text-[11px] font-medium py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              <option value="" disabled>
                เลื่อนเตือน (Snooze)...
              </option>
              <option value="15">+15 นาที</option>
              <option value="60">+1 ชั่วโมง</option>
              <option value="1440">+1 วัน (พรุ่งนี้)</option>
            </select>

            <button
              type="button"
              onClick={() => onDismiss(reminder.id)}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="ปิดการแจ้งเตือนนี้"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onEdit(reminder)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="แก้ไข"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(reminder.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          title="ลบ"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
