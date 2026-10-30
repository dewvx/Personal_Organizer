import React from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';
import { Category, EntryFilters } from '../../types';

interface EntryFilterBarProps {
  filters: EntryFilters;
  onChange: (newFilters: EntryFilters) => void;
  categories: Category[];
  totalCount?: number;
}

export const EntryFilterBar: React.FC<EntryFilterBarProps> = ({
  filters,
  onChange,
  categories,
  totalCount,
}) => {
  const statusTabs = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'pending', label: 'รอดำเนินการ' },
    { id: 'in_progress', label: 'กำลังทำ' },
    { id: 'completed', label: 'เสร็จแล้ว' },
  ];

  const dueTabs = [
    { id: 'all', label: 'ทุกวันกำหนด' },
    { id: 'overdue', label: 'เลยกำหนด' },
    { id: 'today', label: 'วันนี้' },
    { id: 'upcoming', label: '7 วันข้างหน้า' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-sm space-y-3">
      {/* Top Filter Row: Category Pills & Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = (filters.status || 'all') === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChange({ ...filters, status: tab.id === 'all' ? undefined : tab.id, page: 1 })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Due Date Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {dueTabs.map((due) => {
            const isActive = (filters.due_status || 'all') === due.id;
            return (
              <button
                key={due.id}
                onClick={() => onChange({ ...filters, due_status: due.id === 'all' ? undefined : (due.id as any), page: 1 })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {due.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Controls: Category Selector & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.category_id || ''}
              onChange={(e) => onChange({ ...filters, category_id: e.target.value || undefined, page: 1 })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="">ทุกหมวดหมู่ ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.entry_count ? `(${c.entry_count})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <select
            value={filters.priority || ''}
            onChange={(e) => onChange({ ...filters, priority: e.target.value || undefined, page: 1 })}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="">ทุกระดับความสำคัญ</option>
            <option value="urgent">ด่วนมาก</option>
            <option value="high">สูง</option>
            <option value="medium">ปานกลาง</option>
            <option value="low">ต่ำ</option>
          </select>
        </div>

        {/* Sort & Count */}
        <div className="flex items-center gap-3">
          {totalCount !== undefined && (
            <span className="text-slate-400 font-medium">พบ {totalCount} รายการ</span>
          )}

          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${filters.sort_by || 'entry_date'}_${filters.sort_order || 'DESC'}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('_');
                onChange({ ...filters, sort_by: sort_by as any, sort_order: sort_order as any });
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="entry_date_DESC">วันที่บันทึก (ใหม่ - เก่า)</option>
              <option value="entry_date_ASC">วันที่บันทึก (เก่า - ใหม่)</option>
              <option value="due_date_ASC">วันครบกำหนด (เร็วสุดก่อน)</option>
              <option value="priority_DESC">ความสำคัญ (ด่วนสุดก่อน)</option>
              <option value="title_ASC">ชื่อรายการ (ก - ฮ / A - Z)</option>
              <option value="amount_DESC">จำนวนเงิน (มาก - น้อย)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
