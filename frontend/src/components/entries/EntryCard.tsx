import React, { useState } from 'react';
import {
  Check,
  Star,
  Clock,
  Coins,
  Package,
  MoreVertical,
  Archive,
  Trash2,
  Edit2,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Repeat,
  Share2,
  Copy,
  ShoppingCart,
  Target,
  Paperclip,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Entry, EntryItem, EntryAttachment } from '../../types';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { getDueStatus, formatDate } from '../../utils/dateUtils';
import { formatCurrency, getPriorityConfig } from '../../utils/formatters';
import { triggerHaptic } from '../../utils/haptics';
import { shareEntry } from '../../utils/shareUtils';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../common/Badge';
import { ImageViewerModal } from './ImageViewerModal';
import { AttachmentService } from '../../services/attachmentService';
import { TemplateService } from '../../services/templateService';

interface EntryCardProps {
  entry: Entry;
  onToggleStatus: (id: number, currentStatus: Entry['status']) => void;
  onToggleFavorite: (id: number, currentFavorite: boolean) => void;
  onToggleArchive: (id: number, currentArchived: boolean) => void;
  onEdit: (entry: Entry) => void;
  onDelete: (id: number) => void;
  onToggleSubItem?: (itemId: number, currentCompleted: boolean) => void;
  onDuplicate?: (id: number) => void;
  onOpenShoppingMode?: (entry: Entry) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onToggleStatus,
  onToggleFavorite,
  onToggleArchive,
  onEdit,
  onDelete,
  onToggleSubItem,
  onDuplicate,
  onOpenShoppingMode,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewingAttachment, setViewingAttachment] = useState<EntryAttachment | null>(null);
  const { showToast } = useToast();

  const handleShare = async () => {
    triggerHaptic('light');
    setShowMenu(false);
    const result = await shareEntry(entry);
    if (result === 'copied') {
      showToast('คัดลอกข้อความแชร์ลง Clipboard แล้ว พร้อมส่งใน LINE');
    }
  };

  const handleSaveAsTemplate = async () => {
    try {
      setShowMenu(false);
      triggerHaptic('success');
      await TemplateService.create({
        title: entry.title,
        description: entry.description || undefined,
        category_name: entry.category_name,
        items: entry.items?.map((i) => ({
          title: i.title,
          amount: i.amount || 0,
          quantity: i.quantity || 1,
        })),
        tags: entry.tags,
        estimated_amount: entry.amount || 0,
      });
      showToast(`บันทึก "${entry.title}" เป็นเทมเพลตเรียบร้อยแล้ว`, 'success');
    } catch (err) {
      console.error('Failed to save template', err);
      showToast('ไม่สามารถบันทึกเป็นเทมเพลตได้', 'error');
    }
  };

  const isCompleted = entry.status === 'completed';
  const dueInfo = getDueStatus(entry.due_date, isCompleted);
  const priorityConfig = getPriorityConfig(entry.priority);

  const items = entry.items || [];
  const completedItemsCount = items.filter((i) => i.is_completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedItemsCount / items.length) * 100) : 0;

  const recurringLabels = {
    daily: 'ทำซ้ำทุกวัน',
    weekly: 'ทำซ้ำทุกสัปดาห์',
    monthly: 'ทำซ้ำทุกเดือน',
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-sm hover:shadow-md ${
        isCompleted
          ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-85'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Quick Complete Parent Checkbox */}
        <button
          onClick={() => {
            triggerHaptic(isCompleted ? 'light' : 'success');
            onToggleStatus(entry.id, entry.status);
          }}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-200 dark:shadow-none'
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-transparent'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Category & Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
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
                <span className="truncate max-w-[120px]">{entry.category_name}</span>
              </span>
            )}

            {/* Goal Link Badge */}
            {entry.goal_title && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${entry.goal_color || '#8B5CF6'}15`,
                  color: entry.goal_color || '#8B5CF6',
                  borderColor: `${entry.goal_color || '#8B5CF6'}30`,
                }}
              >
                <Target className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{entry.goal_title}</span>
              </span>
            )}

            {/* Recurring Badge */}
            {entry.recurring && entry.recurring !== 'none' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Repeat className="w-3 h-3" />
                <span>{recurringLabels[entry.recurring]}</span>
              </span>
            )}

            {/* Priority Badge */}
            {entry.priority !== 'medium' && (
              <Badge variant="custom" className={priorityConfig.badgeClass}>
                {priorityConfig.label}
              </Badge>
            )}

            {/* Due Date Indicator */}
            {dueInfo && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${dueInfo.color}`}
              >
                <Clock className="w-3 h-3" />
                <span>{dueInfo.label}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onEdit(entry)}
            className={`text-sm sm:text-base font-semibold cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
              isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {entry.title}
          </h3>

          {/* Description / Notes */}
          {entry.description && (
            <p
              onClick={() => onEdit(entry)}
              className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed cursor-pointer"
            >
              {entry.description}
            </p>
          )}

          {/* SUB-ITEMS / CHECKLIST SECTION */}
          {items.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              {/* Header with progress */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>รายการย่อย ({completedItemsCount}/{items.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenShoppingMode && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onOpenShoppingMode(entry);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors shadow-xs"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>โหมดซื้อของ</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2.5">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Sub-item list */}
              {isExpanded && (
                <div className="space-y-1.5 pt-1">
                  {items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 transition-colors"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={item.is_completed || false}
                          onChange={() => {
                            if (item.id && onToggleSubItem) {
                              onToggleSubItem(item.id, !item.is_completed);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                        />
                        <span
                          className={`truncate ${
                            item.is_completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {idx + 1}. {item.title}
                        </span>
                      </label>

                      <div className="flex items-center gap-2 flex-shrink-0 text-[11px]">
                        {item.quantity && item.quantity > 1 ? (
                          <span className="text-slate-400 dark:text-slate-500">x{item.quantity}</span>
                        ) : null}
                        {item.amount && item.amount > 0 ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.amount)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ATTACHMENT SLIPS / RECEIPTS PREVIEW */}
          {entry.attachments && entry.attachments.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 flex-shrink-0">
                <Paperclip className="w-3 h-3" />
                <span>สลิป/เอกสาร ({entry.attachments.length}):</span>
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                {entry.attachments.map((att) => {
                  const isPdf = att.mime_type === 'application/pdf' || att.file_name.toLowerCase().endsWith('.pdf');
                  const url = AttachmentService.getAttachmentUrl(att);

                  return (
                    <button
                      key={att.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingAttachment(att);
                      }}
                      className="group/att flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-all text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[140px] truncate"
                      title={`${att.file_name} (คลิกดูภาพขยาย)`}
                    >
                      {isPdf ? (
                        <FileText className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      ) : (
                        <img
                          src={url}
                          alt={att.file_name}
                          className="w-4 h-4 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <span className="truncate">{att.file_name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Pills Row (Total Amount, Quantity, Date, Tags) */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Total Amount Pill */}
            {entry.amount !== null && entry.amount !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200/60 dark:border-amber-800/50">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>รวม {formatCurrency(entry.amount)}</span>
              </span>
            )}

            {/* Quantity */}
            {entry.quantity !== null && entry.quantity !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/60 dark:border-blue-800/50">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                <span>{entry.quantity} รายการ</span>
              </span>
            )}

            {/* Date (Clickable to edit/change date) */}
            {entry.entry_date && (
              <button
                type="button"
                onClick={() => onEdit(entry)}
                title="คลิกเพื่อแก้ไขวันที่หรือรายละเอียดรายการ"
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-1.5 py-0.5 rounded-md transition-colors"
              >
                <Calendar className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                <span>{formatDate(entry.entry_date)}</span>
              </button>
            )}

            {/* Tags */}
            {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                {entry.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Custom Metadata Values (FEAT-B4) */}
            {entry.custom_values && Object.keys(entry.custom_values).length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                {Object.entries(entry.custom_values).map(([key, val]) => {
                  if (val === null || val === undefined || val === '') return null;
                  return (
                    <span
                      key={key}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-900/50"
                    >
                      {typeof val === 'boolean' ? (val ? '✓ ผ่าน' : '✕ ไม่ผ่าน') : String(val)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons (Right Side) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Favorite Star Button */}
          <button
            onClick={() => onToggleFavorite(entry.id, entry.is_favorite)}
            aria-label={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-1.5 rounded-lg transition-colors ${
              entry.is_favorite
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'
            }`}
          >
            <Star
              className={`w-4 h-4 ${entry.is_favorite ? 'fill-amber-400' : ''}`}
            />
          </button>

          {/* More Action Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>แชร์รายการ (LINE)</span>
                  </button>

                  {/* Save as Template button */}
                  <button
                    onClick={handleSaveAsTemplate}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>บันทึกเป็นเทมเพลต (Template)</span>
                  </button>

                  {/* Duplicate button */}
                  {onDuplicate && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        triggerHaptic('light');
                        onDuplicate(entry.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>คัดลอกรายการ (Duplicate)</span>
                    </button>
                  )}

                  {/* Shopping Focus Mode button */}
                  {onOpenShoppingMode && (items.length > 0 || entry.category_name?.toLowerCase().includes('shop') || entry.category_name?.includes('ซื้อ')) && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        triggerHaptic('light');
                        onOpenShoppingMode(entry);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                      <span>เปิดโหมดซื้อของ</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(entry);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>แก้ไขรายการ</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onToggleArchive(entry.id, entry.is_archived);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <Archive className="w-3.5 h-3.5 text-slate-400" />
                    <span>{entry.is_archived ? 'นำออกจากคลัง' : 'เก็บเข้าคลัง (Archive)'}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(entry.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>ลบรายการนี้</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image / Attachment Lightbox Modal */}
      <ImageViewerModal
        attachment={viewingAttachment}
        onClose={() => setViewingAttachment(null)}
      />
    </div>
  );
};
