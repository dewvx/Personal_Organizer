import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Archive } from 'lucide-react';
import { EntryService } from '../services/entryService';
import { Category, Entry, EntryFilters } from '../types';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { EntryCard } from '../components/entries/EntryCard';
import { EntryFilterBar } from '../components/entries/EntryFilterBar';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { EntryCardSkeleton } from '../components/common/SkeletonLoader';

interface AllListsPageProps {
  categories: Category[];
  searchQuery: string;
  initialCategoryId?: number;
  onOpenNewEntry: (defaultCatId?: number) => void;
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (id: number) => void;
  onDuplicate?: (id: number) => void;
  onOpenShoppingMode?: (entry: Entry) => void;
}

export const AllListsPage: React.FC<AllListsPageProps> = ({
  categories,
  searchQuery,
  initialCategoryId,
  onOpenNewEntry,
  onEditEntry,
  onDeleteEntry,
  onDuplicate,
  onOpenShoppingMode,
}) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const [filters, setFilters] = useState<EntryFilters>({
    category_id: initialCategoryId ? String(initialCategoryId) : undefined,
    status: undefined,
    priority: undefined,
    is_archived: false,
    sort_by: 'entry_date',
    sort_order: 'DESC',
    page: 1,
    limit: 50,
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sync category prop if changed
  useEffect(() => {
    if (initialCategoryId) {
      setFilters((prev) => ({ ...prev, category_id: String(initialCategoryId) }));
    }
  }, [initialCategoryId]);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        ...filters,
        search: debouncedSearch || undefined,
      };
      const res = await EntryService.getAll(params);
      setEntries(res.entries);
      setTotal(res.meta?.total || res.entries.length);
    } catch (err: any) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลรายการได้');
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

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
      loadEntries();
    }
  };

  const handleToggleFavorite = async (id: number, currentFavorite: boolean) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_favorite: !currentFavorite } : e))
    );

    try {
      await EntryService.toggleFavorite(id, !currentFavorite);
      showToast(!currentFavorite ? 'ปักหมุดรายการโปรด' : 'ยกเลิกรายการโปรด');
    } catch (err) {
      showToast('ไม่สามารถอัปเดตรายการโปรดได้', 'error');
      loadEntries();
    }
  };

  const handleToggleArchive = async (id: number, currentArchived: boolean) => {
    try {
      await EntryService.toggleArchive(id, !currentArchived);
      showToast(!currentArchived ? 'เก็บเข้าคลังแล้ว' : 'นำออกจากคลังแล้ว');
      loadEntries();
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
      loadEntries();
    }
  };

  const selectedCategory = categories.find((c) => String(c.id) === String(filters.category_id));
  const completedCount = entries.filter((e) => e.status === 'completed').length;

  const handleArchiveAllCompleted = async () => {
    try {
      const res = await EntryService.archiveAllCompleted();
      showToast(`เก็บรายการที่เสร็จเข้าคลังแล้ว ${res.count} รายการ`);
      loadEntries();
    } catch (err) {
      showToast('ไม่สามารถเคลียร์รายการได้', 'error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {selectedCategory ? selectedCategory.name : 'รายการทั้งหมด (All Lists)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {selectedCategory
              ? selectedCategory.description || 'จัดการรายการในหมวดหมู่นี้'
              : 'ศูนย์รวมรายการ ทุกประเภทข้อมูลในชีวิตประจำวัน'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleArchiveAllCompleted}
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-300"
              leftIcon={<Archive className="w-4 h-4 text-slate-400" />}
            >
              เคลียร์ที่เสร็จ ({completedCount})
            </Button>
          )}
          <Button
            onClick={() => onOpenNewEntry(selectedCategory?.id)}
            size="md"
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium shadow-sm shadow-indigo-200 dark:shadow-none"
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            เพิ่มรายการ
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <EntryFilterBar
        filters={filters}
        onChange={setFilters}
        categories={categories}
        totalCount={total}
      />

      {/* Entry List */}
      {loading ? (
        <div className="space-y-3">
          <EntryCardSkeleton />
          <EntryCardSkeleton />
          <EntryCardSkeleton />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
          <Button onClick={loadEntries} size="sm" variant="secondary" className="mt-3">
            โหลดข้อมูลใหม่
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'ไม่พบรายการที่ตรงกับคำค้นหา' : 'ยังไม่มีรายการตามเงื่อนไขที่เลือก'}
          description={searchQuery ? `ลองค้นหาด้วยคำอื่น หรือล้างคำค้นหา "${searchQuery}"` : 'เริ่มต้นสร้างรายการใหม่ในหมวดหมู่นี้ได้ทันที'}
          actionLabel="สร้างรายการใหม่"
          onAction={() => onOpenNewEntry(selectedCategory?.id)}
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
