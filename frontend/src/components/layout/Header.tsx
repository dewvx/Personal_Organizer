import React, { useState } from 'react';
import { Search, Sparkles, Plus, Calendar, Sun, Moon, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { EntryService } from '../../services/entryService';
import { useToast } from '../../context/ToastContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewEntry: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNewEntry,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setShowExportMenu(false);
      await EntryService.exportData(format);
      showToast(`ดาวน์โหลดไฟล์ ${format.toUpperCase()} เรียบร้อย`);
    } catch (err) {
      showToast('ไม่สามารถส่งออกข้อมูลได้', 'error');
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Mobile Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">Organizer</h1>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อรายการ, รายการย่อย หรือแท็ก..."
            className="w-full bg-slate-100/70 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800/90 focus:bg-white dark:focus:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
          />
        </div>

        {/* Right Action & Info */}
        <div className="flex items-center gap-2">
          {/* Today Date Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200/60 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayFormatted}</span>
          </div>

          {/* Export Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="ส่งออกและสำรองข้อมูล"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    ส่งออกข้อมูล (Export)
                  </div>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>ดาวน์โหลด Excel (CSV)</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <FileJson className="w-4 h-4 text-indigo-600" />
                    <span>สำรองข้อมูลแบบ JSON</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Desktop New Entry Button */}
          <Button
            size="sm"
            onClick={onOpenNewEntry}
            className="hidden md:inline-flex bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-200 dark:shadow-none font-medium"
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            สร้างรายการ
          </Button>
        </div>
      </div>
    </header>
  );
};
