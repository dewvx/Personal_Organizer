import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Sparkles,
  Archive,
  Pin,
  Tag,
  Filter,
} from 'lucide-react';
import { Note, NoteType, NoteMood, Entry, Goal } from '../types';
import { NoteService } from '../services/noteService';
import { EntryService } from '../services/entryService';
import { GoalService } from '../services/goalService';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteFormModal } from '../components/notes/NoteFormModal';
import { JournalCalendar } from '../components/notes/JournalCalendar';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'journal' | 'quick' | 'archive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Linked options
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const { showToast } = useToast();

  const loadNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const isArchived = activeTab === 'archive';
      const noteType = activeTab === 'journal' ? 'journal' : activeTab === 'quick' ? 'quick' : undefined;

      const res = await NoteService.getAll({
        search: searchQuery || undefined,
        note_type: noteType,
        is_archived: isArchived,
      });
      setNotes(res.notes);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถโหลดบันทึกได้', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, showToast]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Load entries and goals for dropdowns
  useEffect(() => {
    EntryService.getAll({ limit: 100 }).then((r) => setEntries(r.entries)).catch(() => {});
    GoalService.getAll().then((g) => setGoals(g)).catch(() => {});
  }, []);

  const handleCreateOrUpdate = async (data: Partial<Note>) => {
    try {
      if (editingNote) {
        await NoteService.update(editingNote.id, data);
        showToast('อัปเดตบันทึกเรียบร้อย');
      } else {
        await NoteService.create(data);
        showToast('สร้างบันทึกใหม่สำเร็จ');
      }
      loadNotes();
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleTogglePin = async (id: number) => {
    try {
      await NoteService.togglePin(id);
      loadNotes();
    } catch (err) {
      showToast('ไม่สามารถเปลี่ยนสถานะปักหมุดได้', 'error');
    }
  };

  const handleToggleArchive = async (id: number) => {
    try {
      await NoteService.toggleArchive(id);
      showToast('เปลี่ยนสถานะคลังเรียบร้อย');
      loadNotes();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await NoteService.delete(deletingId);
      setDeletingId(null);
      showToast('ลบบันทึกสำเร็จ');
      loadNotes();
    } catch (err) {
      showToast('ไม่สามารถลบบันทึกได้', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
              บันทึกโน้ต & ไดอารี่ (Notes & Journal)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            พื้นที่จับความคิด บันทึกประจำวัน พร้อมระบบติดตามอารมณ์ความรู้สึก
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingNote(null);
            setIsFormOpen(true);
          }}
          className="shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4 mr-1.5" /> เขียนบันทึกใหม่
        </Button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'ทั้งหมด (All Notes)' },
            { id: 'journal', label: '📖 ไดอารี่ (Journal)' },
            { id: 'quick', label: '⚡ จดด่วน (Scratchpad)' },
            { id: 'archive', label: '📦 คลังเอกสาร (Archive)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาบันทึก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* If Journal tab active, show calendar preview */}
      {activeTab === 'journal' && (
        <JournalCalendar
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d)}
          onEditNote={(n) => {
            setEditingNote(n);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          title="ไม่พบบันทึก"
          description={
            searchQuery
              ? `ไม่พบบันทึกที่ตรงกับคำค้นหา "${searchQuery}"`
              : activeTab === 'journal'
              ? 'ยังไม่มีบันทึกไดอารี่ เริ่มเขียนไดอารี่เพื่อบันทึกเรื่องราววันนี้ได้เลย'
              : 'ยังไม่มีโน้ตในหมวดนี้'
          }
          actionLabel="เขียนบันทึกแรก"
          onAction={() => {
            setEditingNote(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={(n) => {
                setEditingNote(n);
                setIsFormOpen(true);
              }}
              onDelete={(id) => setDeletingId(id)}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <NoteFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingNote(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingNote}
        entries={entries}
        goals={goals}
      />

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="ยืนยันการลบบันทึก"
        message="คุณต้องการลบบันทึกนี้อย่างถาวรหรือไม่? ไม่สามารถกู้คืนได้"
        confirmLabel="ลบบันทึก"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
