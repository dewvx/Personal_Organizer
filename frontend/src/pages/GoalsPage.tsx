import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  Trophy,
  Activity,
  CheckCircle2,
  Clock,
  Coins,
  ListTodo,
  X,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Goal, GoalFormData, Entry } from '../types';
import { GoalService } from '../services/goalService';
import { EntryService } from '../services/entryService';
import { GoalCard } from '../components/goals/GoalCard';
import { GoalFormModal } from '../components/goals/GoalFormModal';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import { triggerHaptic } from '../utils/haptics';

interface GoalsPageProps {
  onOpenEntryForm?: (entry?: Entry | null) => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({ onOpenEntryForm }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'achieved' | 'paused'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Linked entries modal state
  const [selectedGoalForEntries, setSelectedGoalForEntries] = useState<Goal | null>(null);
  const [linkedEntries, setLinkedEntries] = useState<Entry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  const { showToast } = useToast();

  const loadGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await GoalService.getAll(statusFilter);
      setGoals(data);
    } catch (err) {
      showToast('ไม่สามารถโหลดข้อมูลเป้าหมายได้', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const loadGoalEntries = async (goal: Goal) => {
    try {
      setSelectedGoalForEntries(goal);
      setIsLoadingEntries(true);
      const entries = await GoalService.getEntries(goal.id);
      setLinkedEntries(entries);
    } catch (err) {
      showToast('ไม่สามารถโหลดรายการงานที่ผูกไว้ได้', 'error');
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleCreateOrUpdate = async (data: GoalFormData) => {
    try {
      if (editingGoal) {
        await GoalService.update(editingGoal.id, data);
        showToast('แก้ไขเป้าหมายเรียบร้อยแล้ว');
      } else {
        await GoalService.create(data);
        showToast('สร้างเป้าหมายใหม่เรียบร้อยแล้ว');
      }
      loadGoals();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกเป้าหมาย', 'error');
      throw err;
    }
  };

  const handleToggleStatus = async (goal: Goal) => {
    const nextStatus = goal.status === 'achieved' ? 'active' : 'achieved';
    try {
      await GoalService.update(goal.id, { status: nextStatus });
      showToast(
        nextStatus === 'achieved'
          ? '🎉 ยินดีด้วย! คุณทำเป้าหมายนี้สำเร็จแล้ว'
          : 'เปิดเป้าหมายให้กลับมาดำเนินการต่อแล้ว'
      );
      loadGoals();
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะเป้าหมาย', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await GoalService.delete(deletingId);
      setDeletingId(null);
      showToast('ลบเป้าหมายเรียบร้อยแล้ว');
      loadGoals();
    } catch (err) {
      showToast('ไม่สามารถลบเป้าหมายได้', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleLinkedEntry = async (entry: Entry) => {
    triggerHaptic('light');
    const newStatus = entry.status === 'completed' ? 'pending' : 'completed';
    try {
      await EntryService.update(entry.id, { status: newStatus });
      // Update local state
      setLinkedEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, status: newStatus } : e))
      );
      // Reload goals to update aggregated calculations
      loadGoals();
    } catch (err) {
      showToast('ไม่สามารถอัปเดตสถานะงานได้', 'error');
    }
  };

  // Metrics calculation
  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const achievedGoals = goals.filter((g) => g.status === 'achieved').length;
  const avgProgress =
    totalGoals > 0
      ? Math.round(goals.reduce((acc, g) => acc + (g.overall_progress || 0), 0) / totalGoals)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>เป้าหมาย & ความสำเร็จ (Goals & Milestones)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            วางแผน ติดตามความคืบหน้ารายการงาน ยอดเงินสะสม และบรรลุเป้าหมายสำคัญในชีวิต
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingGoal(null);
            setIsFormOpen(true);
          }}
          className="self-start sm:self-auto shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>สร้างเป้าหมายใหม่</span>
        </Button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Target className="w-4 h-4 text-indigo-500" />
            <span>เป้าหมายทั้งหมด</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            {totalGoals}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>กำลังดำเนินการ</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {activeGoals}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Trophy className="w-4 h-4 text-purple-500" />
            <span>สำเร็จแล้ว (Achieved)</span>
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
            {achievedGoals}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span>ความคืบหน้าเฉลี่ย</span>
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            {avgProgress}%
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'ทั้งหมด' },
          { id: 'active', label: 'กำลังทำ (Active)' },
          { id: 'achieved', label: 'สำเร็จแล้ว (Achieved 🏆)' },
          { id: 'paused', label: 'พักไว้ (Paused)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200/60 dark:border-slate-800"
            />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-7 h-7" />}
          title="ยังไม่มีเป้าหมายในหมวดนี้"
          description="เริ่มต้นกำหนดเป้าหมายเพื่อขับเคลื่อนชีวิต การงาน หรือการเงินของคุณให้ก้าวหน้า"
          actionLabel="สร้างเป้าหมายแรกของคุณ"
          onAction={() => {
            setEditingGoal(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => {
                setEditingGoal(g);
                setIsFormOpen(true);
              }}
              onDelete={(id) => setDeletingId(id)}
              onToggleStatus={handleToggleStatus}
              onViewEntries={loadGoalEntries}
            />
          ))}
        </div>
      )}

      {/* Goal Form Modal */}
      <GoalFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingGoal}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="ยืนยันการลบเป้าหมาย"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมายนี้? รายการงานที่ผูกไว้จะยังคงอยู่ แต่จะไม่ถูกเชื่อมโยงกับเป้าหมายนี้อีกต่อไป"
        confirmLabel="ลบเป้าหมาย"
        isDanger={true}
        isLoading={isDeleting}
      />

      {/* Linked Entries Drawer / Modal */}
      {selectedGoalForEntries && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedGoalForEntries(null)}
          />

          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-2xl transition-all w-full max-w-lg border border-slate-200/80 dark:border-slate-800 max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0 pr-2">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    รายการงานที่ผูกกับเป้าหมาย
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {selectedGoalForEntries.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedGoalForEntries(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress overview inside modal */}
              <div className="py-3 px-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl my-3 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">ความคืบหน้า</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {selectedGoalForEntries.overall_progress}% ({selectedGoalForEntries.completed_tasks}/{selectedGoalForEntries.total_tasks} สำเร็จ)
                  </div>
                </div>
                {selectedGoalForEntries.target_amount && (
                  <div className="text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400">ยอดเงินสะสม</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(selectedGoalForEntries.current_amount)}
                    </div>
                  </div>
                )}
              </div>

              {/* Entries List */}
              <div className="flex-1 overflow-y-auto space-y-2 py-1">
                {isLoadingEntries ? (
                  <div className="py-8 text-center text-xs text-slate-400">กำลังโหลดรายการงาน...</div>
                ) : linkedEntries.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    ยังไม่มีรายการงานที่ผูกกับเป้าหมายนี้
                  </div>
                ) : (
                  linkedEntries.map((entry) => {
                    const isCompleted = entry.status === 'completed';
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isCompleted
                            ? 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 text-slate-400'
                            : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => handleToggleLinkedEntry(entry)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <div className="min-w-0">
                            <span
                              className={`text-xs font-semibold block truncate ${
                                isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                              }`}
                            >
                              {entry.title}
                            </span>
                            {entry.category_name && (
                              <span className="text-[10px] text-slate-400">
                                {entry.category_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {entry.amount !== null && entry.amount !== undefined && (
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0 ml-2">
                            {formatCurrency(entry.amount)}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedGoalForEntries(null)}>
                  ปิด
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
