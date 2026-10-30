import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Star,
  ListTodo,
  AlertTriangle,
  Coins,
  Plus,
  ArrowRight,
  PieChart,
} from 'lucide-react';
import { DashboardService } from '../services/dashboardService';
import { EntryService } from '../services/entryService';
import { DashboardSummaryData, Entry } from '../types';
import { formatCurrency } from '../utils/formatters';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/dashboard/StatCard';
import { EntryCard } from '../components/entries/EntryCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { StatCardSkeleton, EntryCardSkeleton } from '../components/common/SkeletonLoader';

interface DashboardPageProps {
  onOpenNewEntry: () => void;
  onNavigateTab: (tab: string, categoryId?: number) => void;
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (id: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenNewEntry,
  onNavigateTab,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await DashboardService.getSummary();
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'ไม่สามารถโหลดข้อมูลภาพรวมได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: Entry['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await EntryService.toggleStatus(id, nextStatus);
      showToast(nextStatus === 'completed' ? 'ทำเครื่องหมายว่าเสร็จแล้ว' : 'เปลี่ยนสถานะเป็นรอดำเนินการ');
      loadDashboard();
    } catch (err) {
      showToast('ไม่สามารถอัปเดตสถานะได้', 'error');
    }
  };

  const handleToggleFavorite = async (id: number, currentFavorite: boolean) => {
    try {
      await EntryService.toggleFavorite(id, !currentFavorite);
      showToast(!currentFavorite ? 'ปักหมุดรายการโปรดแล้ว' : 'ยกเลิกรายการโปรดแล้ว');
      loadDashboard();
    } catch (err) {
      showToast('ไม่สามารถอัปเดตสถานะโปรดได้', 'error');
    }
  };

  const handleToggleArchive = async (id: number, currentArchived: boolean) => {
    try {
      await EntryService.toggleArchive(id, !currentArchived);
      showToast(!currentArchived ? 'เก็บเข้าคลังเรียบร้อย' : 'นำออกจากคลังเรียบร้อย');
      loadDashboard();
    } catch (err) {
      showToast('ไม่สามารถจัดการคลังได้', 'error');
    }
  };

  const handleToggleSubItem = async (itemId: number, currentCompleted: boolean) => {
    try {
      await EntryService.toggleSubItem(itemId, currentCompleted);
      loadDashboard();
    } catch (err) {
      showToast('ไม่สามารถอัปเดตรายการย่อยได้', 'error');
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="space-y-3">
          <EntryCardSkeleton />
          <EntryCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center my-6">
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">โปรดตรวจสอบการเชื่อมต่อ PostgreSQL ใน backend/.env</p>
        <Button onClick={loadDashboard} size="sm" variant="secondary" className="mt-4">
          ลองใหม่อีกครั้ง
        </Button>
      </div>
    );
  }

  const summary = data?.summary;
  const overdueItems = data?.overdue || [];
  const upcomingItems = data?.upcomingDue || [];
  const recentItems = data?.recentEntries || [];
  const expenseByCategory = data?.expenseByCategory || [];
  const totalExpense = summary?.total_expense_amount || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-indigo-900/50">
        <div>
          <span className="inline-block text-[11px] font-semibold tracking-wider uppercase text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-full mb-1.5">
            ภาพรวมส่วนตัว (Dashboard)
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">ยินดีต้อนรับสู่ Personal Organizer</h2>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1">
            คุณมี {summary?.pending_entries || 0} รายการที่กำลังรอดำเนินการในขณะนี้
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onOpenNewEntry}
            size="md"
            className="bg-white text-indigo-900 hover:bg-indigo-50 shadow-none border-none font-semibold text-xs sm:text-sm"
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            สร้างรายการใหม่
          </Button>
        </div>
      </div>

      {/* Overdue Alert Banner (If Any) */}
      {overdueItems.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/80 flex items-center justify-center text-rose-600 dark:text-rose-300 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold">มี {overdueItems.length} รายการที่เลยวันกำหนดส่งแล้ว!</p>
              <p className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 mt-0.5">กรุณาตรวจสอบและดำเนินการให้เสร็จสิ้น</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('all')}
            className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 flex items-center gap-1"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="รายการทั้งหมด"
          value={summary?.total_entries || 0}
          subtitle="ในทุกหมวดหมู่"
          icon={ListTodo}
          colorClass="text-indigo-600 dark:text-indigo-400"
          bgClass="bg-indigo-50 dark:bg-indigo-950/50"
          onClick={() => onNavigateTab('all')}
        />
        <StatCard
          title="รอดำเนินการ"
          value={summary?.pending_entries || 0}
          subtitle="ยังไม่เสร็จสิ้น"
          icon={Clock}
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-50 dark:bg-amber-950/50"
          onClick={() => onNavigateTab('all')}
        />
        <StatCard
          title="เสร็จสิ้นแล้ว"
          value={summary?.completed_entries || 0}
          subtitle="เป้าหมายที่สำเร็จ"
          icon={CheckCircle2}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-50 dark:bg-emerald-950/50"
          onClick={() => onNavigateTab('all')}
        />
        <StatCard
          title="รายการโปรด"
          value={summary?.favorite_entries || 0}
          subtitle="ปักหมุดสำคัญ"
          icon={Star}
          colorClass="text-rose-600 dark:text-rose-400"
          bgClass="bg-rose-50 dark:bg-rose-950/50"
          onClick={() => onNavigateTab('favorites')}
        />
      </div>

      {/* ============================================================== */}
      {/* EXPENSE ANALYTICS & CATEGORY BREAKDOWN */}
      {/* ============================================================== */}
      {totalExpense > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  สรุปรายจ่ายและงบประมาณ (Expense Analytics)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ยอดรวมทั้งหมด {formatCurrency(totalExpense)} จาก {expenseByCategory.reduce((a, b) => a + b.entry_count, 0)} รายการ
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50">
              <PieChart className="w-4 h-4" />
              <span>{formatCurrency(totalExpense)}</span>
            </div>
          </div>

          {/* Category Expense Bars */}
          <div className="space-y-3">
            {expenseByCategory.map((cat, idx) => {
              const percentage = totalExpense > 0 ? Math.round((cat.total_amount / totalExpense) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.category_color }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        {renderCategoryIcon(cat.category_icon, 'w-3.5 h-3.5 text-slate-400')}
                        <span>{cat.category_name}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">({cat.entry_count} รายการ)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(cat.total_amount)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 w-9 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: cat.category_color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 1: Upcoming Due (7 Days) */}
      {upcomingItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>ใกล้ถึงกำหนด (7 วันข้างหน้า)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{upcomingItems.length} รายการ</span>
          </div>
          <div className="space-y-2.5">
            {upcomingItems.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onToggleStatus={handleToggleStatus}
                onToggleFavorite={handleToggleFavorite}
                onToggleArchive={handleToggleArchive}
                onEdit={onEditEntry}
                onDelete={onDeleteEntry}
                onToggleSubItem={handleToggleSubItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Recent Activity / Latest Entries */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>รายการล่าสุด (Recent Entries)</span>
          </h3>
          <button
            onClick={() => onNavigateTab('all')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentItems.length === 0 ? (
          <EmptyState
            title="ยังไม่มีรายการใด ๆ"
            description="กดปุ่ม 'สร้างรายการใหม่' เพื่อเริ่มต้นจดบันทึก To-do, สินค้า, หรือค่าใช้จ่าย"
            actionLabel="สร้างรายการแรก"
            onAction={onOpenNewEntry}
          />
        ) : (
          <div className="space-y-2.5">
            {recentItems.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onToggleStatus={handleToggleStatus}
                onToggleFavorite={handleToggleFavorite}
                onToggleArchive={handleToggleArchive}
                onEdit={onEditEntry}
                onDelete={onDeleteEntry}
                onToggleSubItem={handleToggleSubItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
