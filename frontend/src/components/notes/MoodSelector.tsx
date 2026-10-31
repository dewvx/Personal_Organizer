import React from 'react';
import { NoteMood } from '../../types';

interface MoodSelectorProps {
  value: NoteMood | null;
  onChange: (mood: NoteMood | null) => void;
}

const moods: { id: NoteMood; emoji: string; label: string; color: string }[] = [
  { id: 'great', emoji: '😄', label: 'ดีเยี่ยม', color: 'hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950/40 text-emerald-600' },
  { id: 'good', emoji: '🙂', label: 'ดี', color: 'hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-blue-950/40 text-blue-600' },
  { id: 'neutral', emoji: '😐', label: 'ปานกลาง', color: 'hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-800 text-slate-600' },
  { id: 'bad', emoji: '🙁', label: 'แย่', color: 'hover:bg-amber-50 hover:border-amber-400 dark:hover:bg-amber-950/40 text-amber-600' },
  { id: 'terrible', emoji: '😫', label: 'แย่มาก', color: 'hover:bg-rose-50 hover:border-rose-400 dark:hover:bg-rose-950/40 text-rose-600' },
];

export const MoodSelector: React.FC<MoodSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        อารมณ์ความรู้สึกวันนี้ (Mood Tracker)
      </label>
      <div className="grid grid-cols-5 gap-2">
        {moods.map((m) => {
          const isSelected = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(isSelected ? null : m.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 dark:border-indigo-500 shadow-sm scale-105'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              } ${m.color}`}
            >
              <span className="text-2xl mb-1">{m.emoji}</span>
              <span className="text-[11px] font-medium leading-none">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
