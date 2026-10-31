import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { NoteService } from '../../services/noteService';
import { JournalCalendarDay, Note } from '../../types';

interface JournalCalendarProps {
  onSelectDate: (date: string) => void;
  selectedDate: string;
  onEditNote: (note: any) => void;
}

const moodEmojis: Record<string, string> = {
  great: '😄',
  good: '🙂',
  neutral: '😐',
  bad: '🙁',
  terrible: '😫',
};

export const JournalCalendar: React.FC<JournalCalendarProps> = ({
  onSelectDate,
  selectedDate,
  onEditNote,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysData, setDaysData] = useState<Map<string, JournalCalendarDay>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  const loadCalendar = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await NoteService.getJournalCalendar({ year, month });
      const map = new Map<string, JournalCalendarDay>();
      res.forEach((d) => map.set(d.note_date, d));
      setDaysData(map);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  // Build calendar matrix
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Empty leading days
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const padD = String(d).padStart(2, '0');
    const padM = String(month).padStart(2, '0');
    days.push({
      dateStr: `${year}-${padM}-${padD}`,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {monthNamesThai[month - 1]} {year + 543} ({year})
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            วันนี้
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-2">
        <span>อา</span>
        <span>จ</span>
        <span>อ</span>
        <span>พ</span>
        <span>พฤ</span>
        <span>ศ</span>
        <span>ส</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((d, index) => {
          if (!d.isCurrentMonth) {
            return <div key={index} className="h-14 sm:h-16 rounded-xl bg-slate-50/40 dark:bg-slate-800/20" />;
          }

          const dayData = daysData.get(d.dateStr);
          const isSelected = selectedDate === d.dateStr;
          const isToday = new Date().toISOString().slice(0, 10) === d.dateStr;
          const dominantMood = dayData?.entries?.find((e) => e.mood)?.mood;

          return (
            <button
              key={index}
              onClick={() => onSelectDate(d.dateStr)}
              className={`h-14 sm:h-16 p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all relative ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/40'
                  : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              } ${isToday ? 'font-bold' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs ${
                    isToday
                      ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {d.dayNum}
                </span>

                {dominantMood && (
                  <span className="text-sm leading-none" title={`Mood: ${dominantMood}`}>
                    {moodEmojis[dominantMood]}
                  </span>
                )}
              </div>

              {/* Badges / dots */}
              {dayData && dayData.count > 0 && (
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                    {dayData.count} {dayData.count === 1 ? 'เรื่อง' : 'เรื่อง'}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
