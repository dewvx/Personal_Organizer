import React from 'react';
import { Pin, Archive, Trash2, Edit3, Calendar, Tag, Target, CheckSquare } from 'lucide-react';
import { Note, NoteMood } from '../../types';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
  onToggleArchive: (id: number) => void;
}

const moodEmojis: Record<NoteMood, string> = {
  great: '😄',
  good: '🙂',
  neutral: '😐',
  bad: '🙁',
  terrible: '😫',
};

const typeLabels: Record<string, { label: string; bg: string; text: string }> = {
  journal: { label: 'ไดอารี่ (Journal)', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400' },
  quick: { label: 'จดด่วน (Scratchpad)', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400' },
  note: { label: 'โน้ตทั่วไป (Note)', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-400' },
};

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
}) => {
  const typeInfo = typeLabels[note.note_type] || typeLabels.note;

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
        note.is_pinned
          ? 'border-indigo-300 dark:border-indigo-700/80 shadow-sm ring-1 ring-indigo-400/20'
          : 'border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Top Accent Strip */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: note.color || '#6366F1' }}
      />

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Header Badges & Actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.text}`}
            >
              {typeInfo.label}
            </span>
            {note.mood && (
              <span className="text-base leading-none" title={`Mood: ${note.mood}`}>
                {moodEmojis[note.mood]}
              </span>
            )}
            {note.note_date && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {note.note_date}
              </span>
            )}
          </div>

          {/* Quick Pin Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            className={`p-1 rounded-lg transition-colors ${
              note.is_pinned
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                : 'text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300'
            }`}
            title={note.is_pinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดไว้บนสุด'}
          >
            <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3
          onClick={() => onEdit(note)}
          className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
        >
          {note.title}
        </h3>

        {/* Content Preview */}
        <p
          onClick={() => onEdit(note)}
          className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-4 whitespace-pre-line mb-3 cursor-pointer flex-1"
        >
          {note.content || <span className="text-slate-400 italic">ไม่มีเนื้อหาเพิ่มเติม</span>}
        </p>

        {/* Linked metadata (Entry or Goal) */}
        {(note.linked_entry_title || note.linked_goal_title) && (
          <div className="flex flex-wrap gap-1.5 mb-3 text-[11px]">
            {note.linked_entry_title && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <CheckSquare className="w-3 h-3 text-indigo-500" />
                {note.linked_entry_title}
              </span>
            )}
            {note.linked_goal_title && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                <Target className="w-3 h-3 text-purple-500" />
                {note.linked_goal_title}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400"
              >
                <Tag className="w-2.5 h-2.5 opacity-60" />
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onEdit(note)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          title="แก้ไขบันทึก"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onToggleArchive(note.id)}
          className={`p-1.5 rounded-lg transition-colors ${
            note.is_archived
              ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50'
              : 'text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
          }`}
          title={note.is_archived ? 'นำออกจากคลัง' : 'เก็บเข้าคลังเอกสาร'}
        >
          <Archive className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="ลบบันทึก"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
