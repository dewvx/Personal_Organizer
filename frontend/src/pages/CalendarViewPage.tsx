import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import { EntryService } from '../services/entryService';
import { Entry } from '../types';
import { EntryCard } from '../components/entries/EntryCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { triggerHaptic } from '../utils/haptics';
import { useToast } from '../context/ToastContext';
import { getTodayDateString } from '../utils/dateUtils';

interface CalendarViewPageProps {
  onOpenNewEntry: (datePreset?: string) => void;
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (id: number) => void;
  onDuplicate?: (id: number) => void;
  onOpenShoppingMode?: (entry: Entry) => void;
}

export const CalendarViewPage: React.FC<CalendarViewPageProps> = ({
  onOpenNewEntry,
  onEditEntry,
  onDeleteEntry,
  onDuplicate,
  onOpenShoppingMode,
}) => {
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Load entries for calendar mapping based on visible month range
  const loadCalendarEntries = useCallback(async () => {
    try {
      setLoading(true);
      // Cover the month range plus buffer days for calendar grid padding
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      const bufferStart = new Date(firstDayOfMonth);
      bufferStart.setDate(bufferStart.getDate() - 7);
      const bufferEnd = new Date(lastDayOfMonth);
      bufferEnd.setDate(bufferEnd.getDate() + 7);

      const start_date = `${bufferStart.getFullYear()}-${String(bufferStart.getMonth() + 1).padStart(2, '0')}-${String(bufferStart.getDate()).padStart(2, '0')}`;
      const end_date = `${bufferEnd.getFullYear()}-${String(bufferEnd.getMonth() + 1).padStart(2, '0')}-${String(bufferEnd.getDate()).padStart(2, '0')}`;

      const res = await EntryService.getAll({
        is_archived: false,
        start_date,
        end_date,
        calendar_mode: true,
        limit: 1000,
      });
      setAllEntries(res.entries);
    } catch (err) {
      console.error('Failed to load calendar entries', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadCalendarEntries();
  }, [loadCalendarEntries]);

  const handleToggleStatus = async (id: number, currentStatus: Entry['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setAllEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: nextStatus } : e))
    );
    try {
      await EntryService.toggleStatus(id, nextStatus);
      showToast(nextStatus === 'completed' ? 'เสร็จสิ้นเรียบร้อย' : 'เปลี่ยนสถานะเป็นรอดำเนินการ');
    } catch {
      showToast('ไม่สามารถอัปเดตสถานะได้', 'error');
      loadCalendarEntries();
    }
  };

  const handleToggleFavorite = async (id: number, currentFavorite: boolean) => {
    setAllEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_favorite: !currentFavorite } : e))
    );
    try {
      await EntryService.toggleFavorite(id, !currentFavorite);
      showToast(!currentFavorite ? 'ปักหมุดรายการโปรด' : 'ยกเลิกรายการโปรด');
    } catch {
      showToast('ไม่สามารถอัปเดตรายการโปรดได้', 'error');
      loadCalendarEntries();
    }
  };

  const handleToggleArchive = async (id: number, currentArchived: boolean) => {
    try {
      await EntryService.toggleArchive(id, !currentArchived);
      showToast(!currentArchived ? 'เก็บเข้าคลังแล้ว' : 'นำออกจากคลังแล้ว');
      loadCalendarEntries();
    } catch {
      showToast('ไม่สามารถจัดการคลังได้', 'error');
    }
  };

  const handleToggleSubItem = async (itemId: number, currentCompleted: boolean) => {
    try {
      const updatedEntry = await EntryService.toggleSubItem(itemId, currentCompleted);
      setAllEntries((prev) =>
        prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
      );
    } catch {
      showToast('ไม่สามารถอัปเดตรายการย่อยได้', 'error');
      loadCalendarEntries();
    }
  };

  // Calendar math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    triggerHaptic('light');
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    triggerHaptic('light');
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    triggerHaptic('light');
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(getTodayDateString(now));
  };

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  const weekDayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // Map entries by date key (YYYY-MM-DD)
  const entriesByDate: Record<string, Entry[]> = {};
  allEntries.forEach((entry) => {
    const targetDate = entry.due_date
      ? entry.due_date.split('T')[0]
      : entry.entry_date
      ? entry.entry_date.split('T')[0]
      : null;

    if (targetDate) {
      if (!entriesByDate[targetDate]) {
        entriesByDate[targetDate] = [];
      }
      entriesByDate[targetDate].push(entry);
    }
  });

  const selectedDateEntries = entriesByDate[selectedDate] || [];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>ปฏิทินนัดหมายและกำหนดส่ง (Calendar)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            ภาพรวมกิจกรรม งาน และบิลที่ครบกำหนดในแต่ละวัน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={goToToday}
            className="text-xs"
          >
            วันนี้
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenNewEntry(selectedDate)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            สร้างในวันนี้
          </Button>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
        {/* Month Navigation Row */}
        <div className="flex items-center justify-between px-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {monthNamesThai[month]} {year + 543}
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              aria-label="Previous Month"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next Month"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1 border-b border-slate-100 dark:border-slate-800">
          {weekDayNames.map((day, idx) => (
            <div key={idx} className={idx === 0 || idx === 6 ? 'text-rose-400' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty_${idx}`} className="h-10 sm:h-12" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isToday = getTodayDateString() === dateStr;
            const dayEntries = entriesByDate[dateStr] || [];

            return (
              <button
                key={dateStr}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedDate(dateStr);
                }}
                className={`h-11 sm:h-14 rounded-2xl flex flex-col items-center justify-center p-1 relative transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200 dark:shadow-none scale-105 z-10'
                    : isToday
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs sm:text-sm">{dayNum}</span>

                {/* Entry indicator dots */}
                {dayEntries.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {dayEntries.slice(0, 3).map((entry, eIdx) => (
                      <span
                        key={eIdx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-white'
                            : ''
                        }`}
                        style={{
                          backgroundColor: isSelected ? '#ffffff' : (entry.category_color || '#6366F1'),
                        }}
                      />
                    ))}
                    {dayEntries.length > 3 && (
                      <span className={`text-[8px] font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                        +
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Entries Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            รายการของวันที่: <span className="text-indigo-600 dark:text-indigo-400">{selectedDate}</span>
          </h3>
          <span className="text-xs text-slate-400">
            {selectedDateEntries.length} รายการ
          </span>
        </div>

        {selectedDateEntries.length === 0 ? (
          <EmptyState
            title="ไม่มีรายการในวันนี้"
            description="กดปุ่ม 'สร้างในวันนี้' ด้านบนเพื่อบันทึกงานหรือรายการซื้อของในวันดังกล่าว"
            actionLabel="เพิ่มรายการของวันนี้"
            onAction={() => onOpenNewEntry(selectedDate)}
          />
        ) : (
          <div className="space-y-2.5">
            {selectedDateEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onToggleStatus={handleToggleStatus}
                onToggleFavorite={handleToggleFavorite}
                onToggleArchive={handleToggleArchive}
                onEdit={onEditEntry}
                onDelete={onDeleteEntry}
                onToggleSubItem={handleToggleSubItem}
                onDuplicate={onDuplicate}
                onOpenShoppingMode={onOpenShoppingMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
