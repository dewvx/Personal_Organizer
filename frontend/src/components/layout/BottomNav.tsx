import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  KanbanSquare,
  FolderTree,
  Calendar,
  Plus,
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewEntry: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewEntry,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-1 py-1.5 pb-safe transition-colors">
      <div className="flex items-center justify-around relative">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-colors ${
            currentTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[9px] font-medium mt-0.5">ภาพรวม</span>
        </button>

        {/* All Lists */}
        <button
          onClick={() => onSelectTab('all')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-colors ${
            currentTab === 'all' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span className="text-[9px] font-medium mt-0.5">รายการ</span>
        </button>

        {/* Kanban Board */}
        <button
          onClick={() => onSelectTab('kanban')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-colors ${
            currentTab === 'kanban' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <KanbanSquare className="w-4 h-4" />
          <span className="text-[9px] font-medium mt-0.5">คัมบัง</span>
        </button>

        {/* Quick Add (+) Centered Button */}
        <div className="-mt-5 flex flex-col items-center">
          <button
            onClick={onOpenNewEntry}
            aria-label="สร้างรายการใหม่"
            className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300 dark:shadow-indigo-950 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Calendar */}
        <button
          onClick={() => onSelectTab('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-colors ${
            currentTab === 'calendar' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[9px] font-medium mt-0.5">ปฏิทิน</span>
        </button>

        {/* Categories */}
        <button
          onClick={() => onSelectTab('categories')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-colors ${
            currentTab === 'categories' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span className="text-[9px] font-medium mt-0.5">หมวดหมู่</span>
        </button>
      </div>
    </nav>
  );
};
