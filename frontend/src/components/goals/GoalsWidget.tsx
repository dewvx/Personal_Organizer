import React, { useState, useEffect, useCallback } from 'react';
import { Target, Plus, ArrowRight, Clock, Coins, Trophy, ListTodo } from 'lucide-react';
import { Goal, GoalFormData } from '../../types';
import { GoalService } from '../../services/goalService';
import { GoalFormModal } from './GoalFormModal';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface GoalsWidgetProps {
  onNavigateToGoals: () => void;
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({ onNavigateToGoals }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { showToast } = useToast();

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GoalService.getAll('active');
      setGoals(res.slice(0, 3)); // Show top 3 active goals on dashboard
    } catch (err) {
      console.error('Failed to load goals for widget', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreate = async (data: GoalFormData) => {
    try {
      await GoalService.create(data);
      showToast('สร้างเป้าหมายใหม่เรียบร้อยแล้ว');
      loadGoals();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างเป้าหมาย', 'error');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="h-6 w-36 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>เป้าหมายสำคัญ (Active Goals)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ติดตามความก้าวหน้าสู่เป้าหมายชีวิตของคุณ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้างเป้าหมาย</span>
          </button>
          <button
            onClick={onNavigateToGoals}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Goal Cards Grid or Empty */}
      {goals.length === 0 ? (
        <div className="text-center py-6 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
          <Target className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            ยังไม่มีเป้าหมายที่กำลังดำเนินการ
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            กำหนดเป้าหมายเพื่อผูกกับรายการงานและยอดเงินของคุณ
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เริ่มต้นตั้งเป้าหมาย</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {goals.map((g) => (
            <div
              key={g.id}
              onClick={onNavigateToGoals}
              className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-none hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${g.color}15`, color: g.color }}
                  >
                    {renderCategoryIcon(g.icon, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">
                      {g.title}
                    </h4>
                    {g.days_remaining !== null && g.days_remaining !== undefined && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {g.is_overdue
                            ? `เลยกำหนด ${Math.abs(g.days_remaining)} วัน`
                            : g.days_remaining === 0
                            ? 'ครบกำหนดวันนี้'
                            : `เหลือ ${g.days_remaining} วัน`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs font-extrabold" style={{ color: g.color }}>
                  {g.overall_progress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(g.overall_progress, 100)}%`, backgroundColor: g.color }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{g.completed_tasks}/{g.total_tasks} งานสำเร็จ</span>
                  {g.target_amount && (
                    <span>{formatCurrency(g.current_amount)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goal Form Modal */}
      <GoalFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};
