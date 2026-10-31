import React, { useState, useEffect } from 'react';
import { X, Sparkles, Tag, Plus, Check } from 'lucide-react';
import { Note, NoteType, NoteMood, Entry, Goal } from '../../types';
import { MoodSelector } from './MoodSelector';
import { Button } from '../common/Button';

interface NoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Note>) => Promise<void>;
  initialData?: Note | null;
  entries?: Entry[];
  goals?: Goal[];
}

const colorPresets = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#64748B', // Slate
];

export const NoteFormModal: React.FC<NoteFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  entries = [],
  goals = [],
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('note');
  const [mood, setMood] = useState<NoteMood | null>(null);
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [color, setColor] = useState('#6366F1');
  const [isPinned, setIsPinned] = useState(false);
  const [linkedEntryId, setLinkedEntryId] = useState<number | undefined>(undefined);
  const [linkedGoalId, setLinkedGoalId] = useState<number | undefined>(undefined);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setNoteType(initialData.note_type || 'note');
      setMood(initialData.mood || null);
      setNoteDate(initialData.note_date ? initialData.note_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setColor(initialData.color || '#6366F1');
      setIsPinned(Boolean(initialData.is_pinned));
      setLinkedEntryId(initialData.linked_entry_id || undefined);
      setLinkedGoalId(initialData.linked_goal_id || undefined);
      setTags(initialData.tags || []);
    } else {
      setTitle('');
      setContent('');
      setNoteType('note');
      setMood(null);
      setNoteDate(new Date().toISOString().slice(0, 10));
      setColor('#6366F1');
      setIsPinned(false);
      setLinkedEntryId(undefined);
      setLinkedGoalId(undefined);
      setTags([]);
    }
    setTagInput('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        note_type: noteType,
        mood: noteType === 'journal' ? mood : null,
        note_date: noteDate,
        color,
        is_pinned: isPinned,
        linked_entry_id: linkedEntryId || null,
        linked_goal_id: linkedGoalId || null,
        tags,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {initialData ? 'แก้ไขบันทึก (Edit Note)' : 'สร้างบันทึกใหม่ (New Note)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Note Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              ประเภทบันทึก (Note Type)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'note', label: 'โน้ตทั่วไป (Note)' },
                { id: 'journal', label: 'ไดอารี่ (Journal)' },
                { id: 'quick', label: 'จดด่วน (Scratchpad)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNoteType(t.id as NoteType)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    noteType === t.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* If Journal, show Mood Selector & Date */}
          {noteType === 'journal' && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <MoodSelector value={mood} onChange={setMood} />
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  วันที่บันทึก (Entry Date)
                </label>
                <input
                  type="date"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              หัวข้อบันทึก (Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ระบุหัวข้อ หรือเรื่องราวที่ต้องการจด..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              เนื้อหาบันทึก (Content / Details)
            </label>
            <textarea
              rows={6}
              placeholder="เขียนบันทึก ความคิด หรือข้อความที่ต้องการที่นี่..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors resize-y leading-relaxed font-sans"
            />
          </div>

          {/* Links to Entry or Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entries.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  เชื่อมโยงกับรายการ (Link to Task)
                </label>
                <select
                  value={linkedEntryId || ''}
                  onChange={(e) => setLinkedEntryId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- ไม่เชื่อมโยง --</option>
                  {entries.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {goals.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  เชื่อมโยงกับเป้าหมาย (Link to Goal)
                </label>
                <select
                  value={linkedGoalId || ''}
                  onChange={(e) => setLinkedGoalId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- ไม่เชื่อมโยง --</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              ป้ายกำกับ (Tags)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="พิมพ์แท็ก เช่น work, memo..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddTag}>
                <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่ม
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-500 ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Color & Pin Option */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Color Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 mr-1">สีแถบ:</span>
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                    color === c ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>

            {/* Pin Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              ปักหมุดไว้ด้านบน (Pin to top)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {initialData ? 'บันทึกการแก้ไข' : 'สร้างบันทึก'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
