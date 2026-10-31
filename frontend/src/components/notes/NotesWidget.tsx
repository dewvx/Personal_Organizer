import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, ArrowRight, Pin } from 'lucide-react';
import { Note } from '../../types';
import { NoteService } from '../../services/noteService';
import { NoteFormModal } from './NoteFormModal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface NotesWidgetProps {
  onNavigateNotes?: () => void;
}

export const NotesWidget: React.FC<NotesWidgetProps> = ({ onNavigateNotes }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { showToast } = useToast();

  const loadRecentNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await NoteService.getAll({ limit: 4, is_archived: false });
      setNotes(res.notes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentNotes();
  }, [loadRecentNotes]);

  const handleSubmit = async (data: Partial<Note>) => {
    if (editingNote) {
      await NoteService.update(editingNote.id, data);
      showToast('อัปเดตบันทึกเรียบร้อย');
    } else {
      await NoteService.create(data);
      showToast('สร้างบันทึกใหม่สำเร็จ');
    }
    loadRecentNotes();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              บันทึกด่วน & ไดอารี่ (Recent Notes)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              จดความคิด ไอเดีย และความรู้สึกประจำวัน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingNote(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> จดโน้ต
          </Button>
          {onNavigateNotes && (
            <button
              onClick={onNavigateNotes}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="ดูทั้งหมด"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">ยังไม่มีบันทึกหรือไดอารี่</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingNote(null);
              setIsModalOpen(true);
            }}
          >
            เขียนบันทึกแรกเลย
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => {
                setEditingNote(note);
                setIsModalOpen(true);
              }}
              className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer transition-all hover:shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs">
                    {note.note_type === 'journal' ? 'ไดอารี่' : note.note_type === 'quick' ? 'จดด่วน' : 'โน้ต'}
                  </span>
                  {note.is_pinned && <Pin className="w-3 h-3 text-indigo-500 fill-current" />}
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                  {note.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {note.content || 'ไม่มีเนื้อหา'}
                </p>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                {note.note_date ? note.note_date.slice(0, 10) : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingNote}
      />
    </div>
  );
};
