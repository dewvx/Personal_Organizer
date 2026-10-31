import React, { useState, useEffect, useCallback } from 'react';
import { Flame, Plus, Sparkles } from 'lucide-react';
import { Habit } from '../../types';
import { HabitService } from '../../services/habitService';
import { HabitCard } from './HabitCard';
import { HabitFormModal } from './HabitFormModal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

export const HabitsWidget: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { showToast } = useToast();

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await HabitService.getAll();
      setHabits(res);
    } catch (err) {
      console.error('Failed to load habits', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleToggleLog = async (id: number, date?: string) => {
    // Optimistic toggle
    const today = new Date().toISOString().split('T')[0];
    const targetDate = date || today;

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const matrix = h.weeklyMatrix.map((m) =>
          m.date === targetDate ? { ...m, is_completed: !m.is_completed } : m
        );
        const isCompletedNow = matrix.find((m) => m.date === targetDate)?.is_completed;
        const completedToday = targetDate === today ? isCompletedNow || false : h.completedToday;
        const currentStreak = completedToday
          ? h.currentStreak + 1
          : Math.max(0, h.currentStreak - 1);

        return {
          ...h,
          weeklyMatrix: matrix,
          completedToday,
          currentStreak,
          weeklyCompletedCount: matrix.filter((m) => m.is_completed).length,
        };
      })
    );

    try {
      await HabitService.toggleLog(id, targetDate);
    } catch (err) {
      showToast('ไม่สามารถอัปเดตกิจวัตรได้', 'error');
      loadHabits(); // Rollback on failure
    }
  };

  const handleCreateOrUpdate = async (data: Partial<Habit>) => {
    try {
      if (editingHabit) {
        await HabitService.update(editingHabit.id, data);
        showToast('แก้ไขกิจวัตรสำเร็จ');
      } else {
        await HabitService.create(data as any);
        showToast('สร้างกิจวัตรใหม่สำเร็จ');
      }
      setIsFormOpen(false);
      setEditingHabit(null);
      loadHabits();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกกิจวัตร', 'error');
      throw err;
    }
  };

  const handleDeleteHabit = async (id: number) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบกิจวัตรนี้?')) return;
    try {
      await HabitService.delete(id);
      showToast('ลบกิจวัตรเรียบร้อยแล้ว');
      loadHabits();
    } catch (err) {
      showToast('ไม่สามารถลบกิจวัตรได้', 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
          <div className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>ติดตามกิจวัตรประจำวัน (Habits & Streaks)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              สร้างวินัยและความต่อเนื่อง เช็คกิจวัตรได้ทันทีจากจุดนี้
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setEditingHabit(null);
            setIsFormOpen(true);
          }}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          เพิ่มกิจวัตร
        </Button>
      </div>

      {/* Habits Grid */}
      {habits.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">ยังไม่มีกิจวัตรประจำวัน</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            เริ่มต้นตั้งเป้าหมายเล็กๆ เช่น ดื่มน้ำ 8 แก้ว, ออกกำลังกาย หรืออ่านหนังสือ
          </p>
          <Button
            size="sm"
            onClick={() => {
              setEditingHabit(null);
              setIsFormOpen(true);
            }}
            className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            สร้างกิจวัตรแรก
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggleToday={(id) => handleToggleLog(id)}
              onToggleDate={(id, date) => handleToggleLog(id, date)}
              onEdit={(h) => {
                setEditingHabit(h);
                setIsFormOpen(true);
              }}
              onDelete={handleDeleteHabit}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <HabitFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingHabit}
      />
    </div>
  );
};
