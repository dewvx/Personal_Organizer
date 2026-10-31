import React, { useState } from 'react';
import {
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  Pause,
  Play,
  ListTodo,
  Coins,
  AlertCircle,
} from 'lucide-react';
import { Goal } from '../../types';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { formatCurrency } from '../../utils/formatters';
import { triggerHaptic } from '../../utils/haptics';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (goal: Goal) => void;
  onViewEntries: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewEntries,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const isAchieved = goal.status === 'achieved';
  const isPaused = goal.status === 'paused';
  const hasTargetAmount = goal.target_amount !== null && goal.target_amount !== undefined && goal.target_amount > 0;

  const statusBadge = {
    active: {
      label: 'กำลังทำ',
      className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    paused: {
      label: 'พักไว้',
      className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    achieved: {
      label: 'สำเร็จแล้ว 🏆',
      className: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    },
    cancelled: {
      label: 'ยกเลิก',
      className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    },
  }[goal.status] || {
    label: goal.status,
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600',
  };

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group ${
        isAchieved
          ? 'border-purple-200/80 dark:border-purple-900/60 bg-gradient-to-b from-purple-50/20 to-transparent'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{
              backgroundColor: `${goal.color}15`,
              color: goal.color,
            }}
          >
            {renderCategoryIcon(goal.icon, 'w-6 h-6')}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>

              {/* Overdue / Days Remaining Indicator */}
              {goal.target_date && goal.days_remaining !== null && goal.days_remaining !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                    goal.is_overdue
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      : goal.days_remaining <= 7
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    {goal.is_overdue
                      ? `เลยกำหนด ${Math.abs(goal.days_remaining)} วัน`
                      : goal.days_remaining === 0
                      ? 'ครบกำหนดวันนี้'
                      : `เหลือ ${goal.days_remaining} วัน`}
                  </span>
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                {goal.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 py-1.5 text-xs animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setShowMenu(false);
                    onToggleStatus(goal);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  {isAchieved ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-500" />
                      <span>เปิดทำต่อ (Active)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                      <span>ทำสำเร็จแล้ว! (Achieved)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onViewEntries(goal);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <ListTodo className="w-3.5 h-3.5 text-indigo-500" />
                  <span>ดูรายการงานที่ผูก ({goal.total_tasks})</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(goal);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>แก้ไขเป้าหมาย</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(goal.id);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบเป้าหมาย</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar & Numeric Metrics */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            ความคืบหน้ารวม
          </span>
          <span
            className="text-sm font-extrabold"
            style={{ color: isAchieved ? '#9333EA' : goal.color }}
          >
            {goal.overall_progress}%
          </span>
        </div>

        {/* Outer Bar */}
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(goal.overall_progress, 100)}%`,
              backgroundColor: isAchieved ? '#A855F7' : goal.color,
            }}
          />
        </div>

        {/* Sub Metrics: Target Amount and Linked Tasks */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Target / Current Amount */}
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-500" />
              <span>ยอดเงินสะสม</span>
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              {formatCurrency(goal.current_amount)}
              {hasTargetAmount && (
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  / {formatCurrency(goal.target_amount!)}
                </span>
              )}
            </span>
          </div>

          {/* Linked Tasks */}
          <div
            onClick={() => onViewEntries(goal)}
            className="flex flex-col cursor-pointer group/tasks hover:opacity-80 transition-opacity"
          >
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <ListTodo className="w-3 h-3 text-indigo-500" />
              <span>รายการงาน</span>
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
              <span>{goal.completed_tasks} / {goal.total_tasks} สำเร็จ</span>
              <span className="text-[10px] font-normal text-indigo-500 underline ml-auto">ดูรายการ</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
