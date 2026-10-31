import React from 'react';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Coins } from 'lucide-react';
import { FinanceSummary } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface FinanceSummaryBarProps {
  summary: FinanceSummary | null;
  isLoading?: boolean;
}

export const FinanceSummaryBar: React.FC<FinanceSummaryBarProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Balance */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
          <Coins className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-semibold">ยอดคงเหลือรวม</span>
        </div>
        <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-mono">
          {formatCurrency(summary.total_balance)}
        </p>
      </div>

      {/* Income */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
          <ArrowDownLeft className="w-4 h-4" />
          <span className="text-xs font-semibold">รายรับ (Income)</span>
        </div>
        <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
          +{formatCurrency(summary.total_income)}
        </p>
      </div>

      {/* Expense */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
          <ArrowUpRight className="w-4 h-4" />
          <span className="text-xs font-semibold">รายจ่าย (Expense)</span>
        </div>
        <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight font-mono">
          -{formatCurrency(summary.total_expense)}
        </p>
      </div>

      {/* Net Savings & Rate */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <PiggyBank className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold">เงินออมสุทธิ</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            {summary.savings_rate}%
          </span>
        </div>
        <p
          className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${
            summary.net_savings >= 0
              ? 'text-slate-800 dark:text-slate-100'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {formatCurrency(summary.net_savings)}
        </p>
      </div>
    </div>
  );
};
