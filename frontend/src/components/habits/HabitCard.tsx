import React from 'react';
import { Flame, Check, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Habit } from '../../types';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { triggerHaptic } from '../../utils/haptics';

interface HabitCardProps {
  habit: Habit;
  onToggleToday: (id: number) => void;
  onToggleDate: (id: number, date: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: number) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onToggleToday,
  onToggleDate,
  onEdit,
  onDelete,
}) => {
  const dayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group">
      {/* Top Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Main Toggle Today Checkbox Button */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              onToggleToday(habit.id);
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
              habit.completedToday
                ? 'shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500 scale-105'
                : 'border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400'
            }`}
            style={{
              backgroundColor: habit.completedToday ? habit.color : `${habit.color}15`,
              color: habit.completedToday ? '#ffffff' : habit.color,
            }}
            title={habit.completedToday ? 'เสร็จแล้ววันนี้! คลิกเพื่อยกเลิก' : 'คลิกเพื่อเช็คว่าทำเสร็จแล้ววันนี้'}
          >
            {habit.completedToday ? (
              <Check className="w-6 h-6 stroke-[3]" />
            ) : (
              renderCategoryIcon(habit.icon, 'w-5 h-5')
            )}
          </button>

          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {habit.name}
            </h4>
            {habit.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {habit.description}
              </p>
            )}
          </div>
        </div>

        {/* Streak & Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Streak Counter */}
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              habit.currentStreak > 0
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 animate-in zoom-in-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${habit.currentStreak > 0 ? 'fill-amber-500 text-amber-500 animate-bounce' : ''}`} />
            <span>{habit.currentStreak} วัน</span>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <button
              onClick={() => onEdit(habit)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title="แก้ไข"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(habit.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
              title="ลบ"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Progress Dot Matrix */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1 px-1">
          <span>7 วันล่าสุด:</span>
          <span>{habit.weeklyCompletedCount} / 7 วัน</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {habit.weeklyMatrix.map((dayLog) => {
            const dateObj = new Date(dayLog.date);
            const dayOfWeek = dayLabels[dateObj.getDay()];
            const isToday = dayLog.date === new Date().toISOString().split('T')[0];

            return (
              <button
                key={dayLog.date}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onToggleDate(habit.id, dayLog.date);
                }}
                className={`h-9 rounded-xl flex flex-col items-center justify-center transition-all ${
                  dayLog.is_completed
                    ? 'text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                } ${isToday ? 'ring-2 ring-indigo-500/50 font-bold' : ''}`}
                style={{
                  backgroundColor: dayLog.is_completed ? habit.color : undefined,
                }}
                title={`${dayLog.date}: ${dayLog.is_completed ? 'ทำแล้ว' : 'ยังไม่ได้ทำ'}`}
              >
                <span className="text-[9px] opacity-80">{dayOfWeek}</span>
                {dayLog.is_completed ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
