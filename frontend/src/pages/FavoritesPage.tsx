import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { EntryService } from '../services/entryService';
import { Entry } from '../types';
import { useToast } from '../context/ToastContext';
import { EntryCard } from '../components/entries/EntryCard';
import { EmptyState } from '../components/common/EmptyState';
import { EntryCardSkeleton } from '../components/common/SkeletonLoader';

interface FavoritesPageProps {
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (id: number) => void;
  onNavigateAll: () => void;
  onDuplicate?: (id: number) => void;
  onOpenShoppingMode?: (entry: Entry) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  onEditEntry,
  onDeleteEntry,
  onNavigateAll,
  onDuplicate,
  onOpenShoppingMode,
}) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await EntryService.getAll({ is_favorite: true, is_archived: false });
      setEntries(res.entries);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถโหลดรายการโปรดได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: Entry['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: nextStatus } : e))
    );
    try {
      await EntryService.toggleStatus(id, nextStatus);
      showToast(nextStatus === 'completed' ? 'เสร็จสิ้นเรียบร้อย' : 'เปลี่ยนสถานะเป็นรอดำเนินการ');
    } catch (err) {
      showToast('ไม่สามารถอัปเดตสถานะได้', 'error');
      loadFavorites();
    }
  };

  const handleToggleFavorite = async (id: number, currentFavorite: boolean) => {
    try {
      await EntryService.toggleFavorite(id, !currentFavorite);
      showToast(!currentFavorite ? 'ปักหมุดรายการโปรด' : 'ยกเลิกรายการโปรด');
      loadFavorites();
    } catch (err) {
      showToast('ไม่สามารถอัปเดตรายการโปรดได้', 'error');
    }
  };

  const handleToggleArchive = async (id: number, currentArchived: boolean) => {
    try {
      await EntryService.toggleArchive(id, !currentArchived);
      showToast('เก็บเข้าคลังแล้ว');
      loadFavorites();
    } catch (err) {
      showToast('ไม่สามารถจัดการคลังได้', 'error');
    }
  };

  const handleToggleSubItem = async (itemId: number, currentCompleted: boolean) => {
    try {
      const updatedEntry = await EntryService.toggleSubItem(itemId, currentCompleted);
      setEntries((prev) =>
        prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
      );
    } catch (err) {
      showToast('ไม่สามารถอัปเดตรายการย่อยได้', 'error');
      loadFavorites();
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          <span>รายการโปรดและปักหมุด (Favorites)</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          รายการสำคัญที่คุณต้องการเข้าถึงได้รวดเร็วที่สุด
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <EntryCardSkeleton />
          <EntryCardSkeleton />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<Star className="w-7 h-7 text-amber-500" />}
          title="ยังไม่มีรายการโปรด"
          description="กดไอคอนรูปดาว ⭐ บนรายการใดก็ได้ เพื่อปักหมุดไว้ที่หน้านี้"
          actionLabel="ไปที่รายการทั้งหมด"
          onAction={onNavigateAll}
        />
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => (
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
  );
};
