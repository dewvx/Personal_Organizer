import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  KanbanSquare,
  Target,
  Calendar,
  FolderTree,
  Star,
  Archive,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Category } from '../../types';
import { renderCategoryIcon } from '../../utils/categoryIcons';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string, categoryId?: number) => void;
  categories: Category[];
  activeCategoryId?: number;
  onOpenNewEntry: () => void;
  onOpenTemplates?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  categories,
  activeCategoryId,
  onOpenNewEntry,
  onOpenTemplates,
}) => {
  const mainNav = [
    { id: 'dashboard', label: 'ภาพรวม (Dashboard)', icon: LayoutDashboard },
    { id: 'all', label: 'รายการทั้งหมด (All Lists)', icon: CheckSquare },
    { id: 'kanban', label: 'กระดานคัมบัง (Kanban)', icon: KanbanSquare },
    { id: 'goals', label: 'เป้าหมายชีวิต (Goals)', icon: Target },
    { id: 'calendar', label: 'ปฏิทินนัดหมาย (Calendar)', icon: Calendar },
    { id: 'categories', label: 'จัดการหมวดหมู่ (Categories)', icon: FolderTree },
    { id: 'favorites', label: 'รายการโปรด (Favorites)', icon: Star },
    { id: 'archive', label: 'คลังเก็บเอกสาร (Archive)', icon: Archive },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-screen sticky top-0 flex-shrink-0 z-30 select-none transition-colors">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight tracking-tight">Organizer</h1>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">One App, All Your Lists</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 pb-2">
        <button
          onClick={onOpenNewEntry}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>สร้างรายการใหม่</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">เมนูหลัก</p>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id && !activeCategoryId;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {onOpenTemplates && (
              <button
                onClick={onOpenTemplates}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>คลังเทมเพลต (Templates)</span>
              </button>
            )}
          </nav>
        </div>

        {/* Categories Quick Filter */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">หมวดหมู่ของคุณ</p>
            <button
              onClick={() => onSelectTab('categories')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
            >
              แก้ไข
            </button>
          </div>
          <div className="space-y-1">
            {categories.map((cat) => {
              const isCatActive = currentTab === 'all' && activeCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectTab('all', cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isCatActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex items-center gap-1.5 truncate text-slate-700 dark:text-slate-300">
                      {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5 flex-shrink-0 text-slate-500')}
                      <span className="truncate">{cat.name}</span>
                    </div>
                  </div>
                  {cat.entry_count !== undefined && cat.entry_count > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {cat.entry_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs">
            ME
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Personal Organizer</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              PostgreSQL Connected
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
