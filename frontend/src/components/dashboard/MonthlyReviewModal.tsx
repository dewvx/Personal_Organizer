import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Coins,
  CheckCircle2,
  Flame,
  Target,
  Calendar,
  AlertCircle,
  Award,
} from 'lucide-react';
import { MonthlyReportData } from '../../types';
import { DashboardService } from '../../services/dashboardService';
import { formatCurrency } from '../../utils/formatters';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { Button } from '../common/Button';

interface MonthlyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const MonthlyReviewModal: React.FC<MonthlyReviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = useCallback(async (year: number, month: number) => {
    try {
      setLoading(true);
      const data = await DashboardService.getMonthlyReport(year, month);
      setReport(data);
    } catch (err) {
      console.error('Failed to load monthly report', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchReport(selectedYear, selectedMonth);
    }
  }, [isOpen, selectedYear, selectedMonth, fetchReport]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const thaiYear = selectedYear + 543;
  const monthName = THAI_MONTH_NAMES[selectedMonth - 1];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center print:p-0">
        <div
          id="monthly-report-printable"
          className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-7 text-left shadow-2xl transition-all w-full max-w-3xl border border-slate-200/80 dark:border-slate-800 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:p-8 print:w-full print:rounded-none"
        >
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 print:border-slate-300">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 print:hidden">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    รายงานสรุปประจำเดือน (Monthly Review)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {monthName} {thaiYear} ({selectedYear})
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation & Print Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto print:hidden">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[100px] text-center">
                  {monthName} {selectedYear}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-1.5"
                title="พิมพ์หรือบันทึกเป็น PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">พิมพ์ / PDF</span>
              </Button>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto py-5 space-y-6 print:overflow-visible">
            {loading ? (
              <div className="space-y-4 py-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
                <div className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ) : !report ? (
              <div className="py-12 text-center text-sm text-slate-400">
                ไม่สามารถโหลดข้อมูลรายงานได้
              </div>
            ) : (
              <>
                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Tasks Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>งานที่สำเร็จ</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                      {report.tasks.completed}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        / {report.tasks.total}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {report.tasks.completionRate}% ความสำเร็จ
                    </div>
                  </div>

                  {/* Financial Expense Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>ยอดรายจ่ายรวม</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 truncate">
                      {formatCurrency(report.financials.currentExpense)}
                    </div>
                    {report.financials.expenseDiffPercent !== null ? (
                      <div
                        className={`text-[11px] font-semibold flex items-center gap-0.5 mt-0.5 ${
                          report.financials.expenseDiff <= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {report.financials.expenseDiff <= 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        <span>
                          {Math.abs(report.financials.expenseDiffPercent)}% เทียบเดือนก่อน
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 mt-0.5">เดือนแรกที่มีข้อมูล</div>
                    )}
                  </div>

                  {/* Habits Consistency Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>ความสม่ำเสมอนิสัย</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                      {report.habits.consistencyRate}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      เช็คสำเร็จ {report.habits.completedLogs} ครั้ง
                    </div>
                  </div>

                  {/* Active Goals Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Target className="w-3.5 h-3.5 text-indigo-500" />
                      <span>เป้าหมายชีวิต</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                      {report.goals.length}
                    </div>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {report.goals.filter((g) => g.status === 'achieved').length} เป้าหมายสำเร็จแล้ว
                    </div>
                  </div>
                </div>

                {/* Expense Breakdown By Category */}
                <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>สัดส่วนค่าใช้จ่ายตามหมวดหมู่ (Expense by Category)</span>
                    <span className="text-xs font-normal text-slate-400">
                      รวม {formatCurrency(report.financials.currentExpense)}
                    </span>
                  </h4>

                  {report.financials.categories.length === 0 ? (
                    <div className="text-xs text-slate-400 py-3 text-center">
                      ไม่มีรายการค่าใช้จ่ายในเดือนนี้
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {report.financials.categories.map((cat) => (
                        <div key={cat.id || cat.category_name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              {renderCategoryIcon(cat.category_icon, 'w-3.5 h-3.5')}
                              <span>{cat.category_name}</span>
                              {cat.is_over_budget && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold">
                                  เกินงบ!
                                </span>
                              )}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {formatCurrency(cat.total_amount)}
                              <span className="text-slate-400 font-normal ml-1">
                                ({cat.percent_of_total}%)
                              </span>
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(cat.percent_of_total, 100)}%`,
                                backgroundColor: cat.category_color,
                              }}
                            />
                          </div>

                          {cat.monthly_budget && (
                            <div className="text-[10px] text-slate-400 flex justify-between">
                              <span>งบประมาณ {formatCurrency(cat.monthly_budget)}</span>
                              <span>ใช้ไปแล้ว {cat.budget_percent}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Key Accomplishments & Completed Entries */}
                <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>ผลงานเด่นที่สะสางสำเร็จในเดือนนี้ (Key Accomplishments)</span>
                  </h4>

                  {report.accomplishments.length === 0 ? (
                    <div className="text-xs text-slate-400 py-3 text-center">
                      ยังไม่มีรายการที่เสร็จสิ้นในเดือนนี้
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {report.accomplishments.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </span>
                            {item.category_name && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0"
                                style={{
                                  backgroundColor: `${item.category_color || '#6366F1'}15`,
                                  color: item.category_color || '#6366F1',
                                  borderColor: `${item.category_color || '#6366F1'}30`,
                                }}
                              >
                                {item.category_name}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
                            {item.entry_date}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between print:hidden">
            <span className="text-[11px] text-slate-400">
              Personal Organizer • Proactive Life Management
            </span>
            <Button variant="outline" onClick={onClose}>
              ปิด
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
