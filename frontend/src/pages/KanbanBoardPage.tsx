import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  KanbanSquare,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Filter,
  DollarSign,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  ShoppingCart,
  ListTodo,
} from 'lucide-react';
import { Entry, Category, EntryStatus } from '../types';
import { EntryService } from '../services/entryService';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { EntryCardSkeleton } from '../components/common/SkeletonLoader';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { formatDate } from '../utils/dateUtils';
import { triggerHaptic } from '../utils/haptics';

interface KanbanBoardPageProps {
  categories: Category[];
  onOpenNewEntry: (categoryPresetId?: number) => void;
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (id: number) => void;
  onOpenShoppingMode?: (entry: Entry) => void;
}

interface ColumnConfig {
  id: EntryStatus;
  title: string;
  icon: React.ReactNode;
  headerColor: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'pending',
    title: 'รอดำเนินการ (Pending)',
    icon: <Clock className="w-4 h-4 text-slate-500" />,
    headerColor: 'text-slate-700 dark:text-slate-200',
    bgColor: 'bg-slate-100/60 dark:bg-slate-900/60',
    borderColor: 'border-slate-200/80 dark:border-slate-800',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
  },
  {
    id: 'in_progress',
    title: 'กำลังทำ (In Progress)',
    icon: <PlayCircle className="w-4 h-4 text-amber-500" />,
    headerColor: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50/40 dark:bg-amber-950/20',
    borderColor: 'border-amber-200/70 dark:border-amber-900/40',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/50',
    badgeText: 'text-amber-800 dark:text-amber-300',
  },
  {
    id: 'completed',
    title: 'เสร็จสิ้น (Completed)',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    headerColor: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200/70 dark:border-emerald-900/40',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
  },
  {
    id: 'cancelled',
    title: 'ยกเลิก (Cancelled)',
    icon: <XCircle className="w-4 h-4 text-rose-500" />,
    headerColor: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-50/30 dark:bg-rose-950/20',
    borderColor: 'border-rose-200/70 dark:border-rose-900/40',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/50',
    badgeText: 'text-rose-800 dark:text-rose-300',
  },
];

export const KanbanBoardPage: React.FC<KanbanBoardPageProps> = ({
  categories,
  onOpenNewEntry,
  onEditEntry,
  onDeleteEntry,
  onOpenShoppingMode,
}) => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draggedEntryId, setDraggedEntryId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<EntryStatus | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await EntryService.getAll({
        is_archived: false,
        limit: 200,
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      setEntries(res.entries);
    } catch (err) {
      console.error('Failed to load kanban entries', err);
      showToast('ไม่สามารถโหลดข้อมูลกระดานคัมบังได้', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, showToast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Group entries by status column
  const columnData = useMemo(() => {
    const map: Record<EntryStatus, Entry[]> = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };
    entries.forEach((entry) => {
      if (map[entry.status]) {
        map[entry.status].push(entry);
      } else {
        map.pending.push(entry);
      }
    });
    return map;
  }, [entries]);

  // Move entry status (Optimistic UI update)
  const handleMoveStatus = async (entryId: number, newStatus: EntryStatus) => {
    const entryToMove = entries.find((e) => e.id === entryId);
    if (!entryToMove || entryToMove.status === newStatus) return;

    triggerHaptic('medium');
    const oldEntries = [...entries];

    // Optimistic update
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, status: newStatus } : e))
    );

    try {
      await EntryService.toggleStatus(entryId, newStatus);
      showToast(`ย้ายไปที่ ${COLUMNS.find((c) => c.id === newStatus)?.title.split(' ')[0]} แล้ว`);
    } catch (err) {
      // Rollback on error
      setEntries(oldEntries);
      showToast('ไม่สามารถย้ายสถานะได้', 'error');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>กระดานคัมบัง (Kanban Board)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            จัดระเบียบงานตามขั้นตอน ลากวางการ์ดเพื่อเปลี่ยนสถานะได้อย่างรวดเร็ว
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 font-medium outline-none cursor-pointer"
            >
              <option value="all">ทุกหมวดหมู่ ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            onClick={() => onOpenNewEntry(selectedCategory !== 'all' ? Number(selectedCategory) : undefined)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            สร้างการ์ดใหม่
          </Button>
        </div>
      </div>

      {/* Board 4 Columns Layout */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="space-y-3">
              <div className="h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <EntryCardSkeleton />
              <EntryCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const columnEntries = columnData[col.id] || [];
            const columnTotalAmount = columnEntries.reduce(
              (sum, item) => sum + (Number(item.amount) || 0),
              0
            );
            const isOver = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverColumn !== col.id) setDragOverColumn(col.id);
                }}
                onDragLeave={() => {
                  if (dragOverColumn === col.id) setDragOverColumn(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverColumn(null);
                  const entryId = Number(e.dataTransfer.getData('text/plain') || draggedEntryId);
                  if (entryId) {
                    handleMoveStatus(entryId, col.id);
                  }
                }}
                className={`rounded-3xl border ${col.borderColor} ${col.bgColor} p-3.5 flex flex-col transition-all min-h-[450px] ${
                  isOver ? 'ring-2 ring-indigo-500/50 scale-[1.01] shadow-lg' : ''
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between gap-2 pb-3 px-1 border-b border-slate-200/60 dark:border-slate-800/60 mb-3">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className={`font-bold text-xs sm:text-sm ${col.headerColor}`}>
                      {col.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {columnTotalAmount > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                        {columnTotalAmount.toLocaleString()}฿
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText}`}
                    >
                      {columnEntries.length}
                    </span>
                  </div>
                </div>

                {/* Cards List in Column */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                  {columnEntries.length === 0 ? (
                    <div className="border border-dashed border-slate-300/80 dark:border-slate-700/60 rounded-2xl py-8 px-4 text-center">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        ลากการ์ดมาวางที่นี่ หรือสร้างรายการใหม่
                      </p>
                    </div>
                  ) : (
                    columnEntries.map((entry) => (
                      <div
                        key={entry.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', String(entry.id));
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedEntryId(entry.id);
                          triggerHaptic('light');
                        }}
                        onDragEnd={() => {
                          setDraggedEntryId(null);
                          setDragOverColumn(null);
                        }}
                        className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:border-indigo-400 dark:hover:border-indigo-600 group relative ${
                          draggedEntryId === entry.id ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''
                        }`}
                      >
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          {entry.category_name ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border"
                              style={{
                                backgroundColor: `${entry.category_color || '#6366F1'}15`,
                                color: entry.category_color || '#6366F1',
                                borderColor: `${entry.category_color || '#6366F1'}30`,
                              }}
                            >
                              {renderCategoryIcon(entry.category_icon, 'w-2.5 h-2.5')}
                              <span>{entry.category_name}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">ทั่วไป</span>
                          )}

                          {/* Quick Mobile Status Move Selector */}
                          <select
                            value={entry.status}
                            onChange={(e) => handleMoveStatus(entry.id, e.target.value as EntryStatus)}
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                            title="เปลี่ยนสถานะ"
                          >
                            <option value="pending">รอดำเนินการ</option>
                            <option value="in_progress">กำลังทำ</option>
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="cancelled">ยกเลิก</option>
                          </select>
                        </div>

                        {/* Card Title */}
                        <h4
                          onClick={() => onEditEntry(entry)}
                          className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                        >
                          {entry.title}
                        </h4>

                        {/* Description Preview */}
                        {entry.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                            {entry.description}
                          </p>
                        )}

                        {/* Card Meta / Details */}
                        <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.due_date && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                                <Calendar className="w-3 h-3" />
                                {formatDate(entry.due_date)}
                              </span>
                            )}

                            {entry.items && entry.items.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                <ListTodo className="w-3 h-3" />
                                {entry.items.filter((i) => i.is_completed).length}/{entry.items.length}
                              </span>
                            )}

                            {entry.amount !== null && Number(entry.amount) > 0 && (
                              <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                {Number(entry.amount).toLocaleString()}฿
                              </span>
                            )}
                          </div>

                          {/* Quick Action Icons */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {onOpenShoppingMode && (entry.items?.length || entry.category_name?.toLowerCase().includes('shop') || entry.category_name?.includes('ช้อป')) && (
                              <button
                                onClick={() => onOpenShoppingMode(entry)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                                title="เปิดโหมดซื้อของ"
                              >
                                <ShoppingCart className="w-3 h-3 text-emerald-500" />
                              </button>
                            )}
                            <button
                              onClick={() => onEditEntry(entry)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="แก้ไข"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteEntry(entry.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
