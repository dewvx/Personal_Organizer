import React from 'react';
import { Edit2, Trash2, ArrowRight, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Category } from '../../types';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { Card } from '../common/Card';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onViewEntries: (id: number) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  onViewEntries,
}) => {
  const budget = category.monthly_budget ? Number(category.monthly_budget) : null;
  const spent = category.current_month_spent ? Number(category.current_month_spent) : 0;
  const percent = budget ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const isOver = budget ? spent >= budget : false;
  const isWarning = budget ? spent >= budget * 0.8 && !isOver : false;

  return (
    <Card className="flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all p-4 sm:p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: `${category.color}18`,
              color: category.color,
            }}
          >
            {renderCategoryIcon(category.icon, 'w-6 h-6')}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(category)}
              aria-label="แก้ไขหมวดหมู่"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(category.id)}
              aria-label="ลบหมวดหมู่"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{category.name}</h3>
        {category.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}

        {/* Monthly Budget Tracker Bar (FEAT-C1) */}
        {budget !== null && budget > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                {isOver ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" /> เกินงบ!
                  </span>
                ) : isWarning ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> ใกล้เต็มงบ
                  </span>
                ) : (
                  <span>งบเดือนนี้:</span>
                )}
              </span>
              <span className={`font-bold ${isOver ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {spent.toLocaleString()} / {budget.toLocaleString()} ฿
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOver
                    ? 'bg-rose-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">
          {category.entry_count || 0} รายการ
        </span>

        <button
          onClick={() => onViewEntries(category.id)}
          className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
        >
          <span>ดูรายการ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
};
