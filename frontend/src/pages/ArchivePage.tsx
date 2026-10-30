import React, { useState, useEffect } from 'react';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { EntryService } from '../services/entryService';
import { Entry } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EntryCardSkeleton } from '../components/common/SkeletonLoader';
import { renderCategoryIcon } from '../../src/utils/categoryIcons';
import { formatDate } from '../../src/utils/dateUtils';

interface ArchivePageProps {
  onNavigateAll: () => void;
}

export const ArchivePage: React.FC<ArchivePageProps> = ({ onNavigateAll }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const loadArchived = async () => {
    try {
      setLoading(true);
      const res = await EntryService.getAll({ is_archived: true });
      setEntries(res.entries);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถโหลดคลังเก็บเอกสารได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchived();
  }, []);

  const handleRestore = async (id: number) => {
    try {
      await EntryService.toggleArchive(id, false);
      showToast('นำรายการกลับคืนสู่หน้ารายการปกติแล้ว');
      loadArchived();
    } catch (err) {
      showToast('ไม่สามารถนำรายการกลับคืนได้', 'error');
    }
  };

  const handlePermanentDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await EntryService.delete(deletingId);
      showToast('ลบรายการถาวรเรียบร้อย');
      setDeletingId(null);
      loadArchived();
    } catch (err) {
      showToast('ไม่สามารถลบรายการได้', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Archive className="w-5 h-5 text-slate-600" />
          <span>คลังเก็บเอกสาร (Archive)</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          รายการที่คุณจัดเก็บไว้เพื่อลดความแออัด สามารถนำกลับคืนมาใช้งานได้ทุกเมื่อ
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <EntryCardSkeleton />
          <EntryCardSkeleton />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<Archive className="w-7 h-7 text-slate-400" />}
          title="ไม่มีรายการในคลังเก็บเอกสาร"
          description="รายการที่ถูกกด 'เก็บเข้าคลัง' จากหน้ารายการจะปรากฏที่นี่"
          actionLabel="กลับไปหน้ารายการหลัก"
          onAction={onNavigateAll}
        />
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="flex items-center justify-between gap-3 p-4 sm:p-5 bg-white/90 border-slate-200"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {entry.category_name && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: `${entry.category_color || '#6366F1'}15`,
                        color: entry.category_color || '#6366F1',
                        borderColor: `${entry.category_color || '#6366F1'}30`,
                      }}
                    >
                      {renderCategoryIcon(entry.category_icon, 'w-3 h-3')}
                      <span>{entry.category_name}</span>
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">บันทึกเมื่อ {formatDate(entry.entry_date)}</span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">{entry.title}</h3>
                {entry.description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{entry.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRestore(entry.id)}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-indigo-600" />}
                >
                  <span className="hidden sm:inline">นำกลับคืน</span>
                </Button>

                <button
                  onClick={() => setDeletingId(entry.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="ลบถาวร"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="ยืนยันการลบรายการถาวร"
        message="การกระทำนี้ไม่สามารถย้อนกลับได้ คุณต้องการลบรายการนี้ออกจากฐานข้อมูลอย่างถาวรหรือไม่?"
        confirmLabel="ลบถาวร"
        isLoading={isDeleting}
        onConfirm={handlePermanentDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
