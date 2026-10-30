import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Coins,
  Package,
  Tag,
  Star,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Repeat,
  ListPlus,
} from 'lucide-react';
import { Category, Entry, EntryItem, EntryPriority, EntryStatus, RecurringInterval } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { formatCurrency } from '../../utils/formatters';

interface EntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Entry>) => Promise<void>;
  initialData?: Entry | null;
  categories: Category[];
  defaultCategoryId?: number;
}

export const EntryFormModal: React.FC<EntryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  defaultCategoryId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [entryDate, setEntryDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<EntryStatus>('pending');
  const [priority, setPriority] = useState<EntryPriority>('medium');
  const [amount, setAmount] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [recurring, setRecurring] = useState<RecurringInterval>('none');
  const [tagsInput, setTagsInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Dynamic Sub-items state
  const [subItems, setSubItems] = useState<EntryItem[]>([]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategoryId(initialData.category_id || '');
      setEntryDate(initialData.entry_date ? initialData.entry_date.split('T')[0] : '');
      setDueDate(initialData.due_date ? initialData.due_date.split('T')[0] : '');
      setStatus(initialData.status || 'pending');
      setPriority(initialData.priority || 'medium');
      setAmount(initialData.amount !== null && initialData.amount !== undefined ? initialData.amount.toString() : '');
      setQuantity(initialData.quantity !== null && initialData.quantity !== undefined ? initialData.quantity.toString() : '');
      setRecurring(initialData.recurring || 'none');
      setTagsInput(Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '');
      setIsFavorite(initialData.is_favorite || false);
      setSubItems(initialData.items && initialData.items.length > 0 ? initialData.items : []);
      setShowAdvanced(
        !!(
          initialData.amount ||
          initialData.quantity ||
          (initialData.tags && initialData.tags.length > 0) ||
          initialData.recurring !== 'none'
        )
      );
    } else {
      setTitle('');
      setDescription('');
      setCategoryId(defaultCategoryId || (categories[0]?.id || ''));
      setEntryDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setStatus('pending');
      setPriority('medium');
      setAmount('');
      setQuantity('');
      setRecurring('none');
      setTagsInput('');
      setIsFavorite(false);
      setSubItems([]);
      setShowAdvanced(false);
    }
    setError('');
  }, [initialData, isOpen, defaultCategoryId, categories]);

  // Sub-items handlers
  const handleAddSubItem = () => {
    setSubItems((prev) => [
      ...prev,
      {
        title: '',
        quantity: 1,
        amount: null,
        is_completed: false,
      },
    ]);
  };

  const handleUpdateSubItem = (index: number, field: keyof EntryItem, val: any) => {
    setSubItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveSubItem = (index: number) => {
    setSubItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculated sum from sub-items
  const itemsSum = subItems.reduce((acc, item) => acc + (parseFloat(String(item.amount || 0)) || 0), 0);
  const itemsQty = subItems.reduce((acc, item) => acc + (parseInt(String(item.quantity || 1), 10) || 1), 0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('กรุณาระบุชื่อรายการ');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      // Final amount: either user manual amount, or auto-calculated from sub-items
      const finalAmount = itemsSum > 0 ? itemsSum : amount !== '' ? parseFloat(amount) : null;
      const finalQuantity = subItems.length > 0 ? itemsQty : quantity !== '' ? parseInt(quantity, 10) : null;

      const validSubItems = subItems
        .filter((item) => item.title && item.title.trim())
        .map((item, idx) => ({
          ...item,
          title: item.title.trim(),
          amount: item.amount != null && String(item.amount) !== '' ? parseFloat(String(item.amount)) : 0,
          quantity: item.quantity != null && String(item.quantity) !== '' ? parseInt(String(item.quantity), 10) : 1,
          sort_order: idx + 1,
        }));

      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId ? Number(categoryId) : null,
        entry_date: entryDate || new Date().toISOString().split('T')[0],
        due_date: dueDate || null,
        status,
        priority,
        amount: finalAmount,
        quantity: finalQuantity,
        tags: parsedTags,
        is_favorite: isFavorite,
        recurring,
        items: validSubItems,
      });

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
        <div className="relative transform overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-xl transition-all w-full max-w-xl border border-slate-100 dark:border-slate-800 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {initialData ? 'แก้ไขรายการ' : 'สร้างรายการใหม่'}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <Input
                label="ชื่อรายการ *"
                placeholder="เช่น ซื้อของที่ตลาด, ส่งรายงานประจำเดือน, ชำระค่าบริการ..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">หมวดหมู่</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">(ไม่มีหมวดหมู่)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">สถานะ</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EntryStatus)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="pending">รอดำเนินการ (Pending)</option>
                  <option value="in_progress">กำลังดำเนินการ (In Progress)</option>
                  <option value="completed">เสร็จสิ้น (Completed)</option>
                  <option value="cancelled">ยกเลิก (Cancelled)</option>
                </select>
              </div>
            </div>

            {/* Priority & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">ระดับความสำคัญ</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as EntryPriority)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="low">ต่ำ (Low)</option>
                  <option value="medium">ปานกลาง (Medium)</option>
                  <option value="high">สูง (High)</option>
                  <option value="urgent">ด่วนมาก (Urgent)</option>
                </select>
              </div>

              <div>
                <Input
                  label="วันครบกำหนด (Due Date)"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* ============================================================== */}
            {/* SUB-ITEMS / CHECKLIST / DETAILED EXPENSES SECTION */}
            {/* ============================================================== */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>รายการย่อย / รายการซื้อของ / รายจ่ายแยกชิ้น</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    เช่น 1. ผัก 50฿, 2. ผลไม้ 100฿ ระบบจะคำนวณยอดเงินรวมให้อัตโนมัติ
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSubItem}
                  className="text-xs bg-white dark:bg-slate-800 shadow-none border-indigo-200 dark:border-indigo-800"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  เพิ่มรายการย่อย
                </Button>
              </div>

              {subItems.length > 0 && (
                <div className="space-y-2 pt-1">
                  {subItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
                    >
                      <span className="text-xs font-bold text-slate-400 w-5 text-center">
                        {idx + 1}
                      </span>
                      {/* Sub-item Title */}
                      <input
                        type="text"
                        placeholder="ชื่อสินค้า/งานย่อย เช่น ผักกาดขาว"
                        value={item.title}
                        onChange={(e) => handleUpdateSubItem(idx, 'title', e.target.value)}
                        className="flex-1 text-xs bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                      />
                      {/* Sub-item Qty */}
                      <div className="w-16">
                        <input
                          type="number"
                          min="1"
                          placeholder="จน."
                          title="จำนวนชิ้น"
                          value={item.quantity || ''}
                          onChange={(e) => handleUpdateSubItem(idx, 'quantity', e.target.value)}
                          className="w-full text-xs text-center py-1 px-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                      {/* Sub-item Amount / Price */}
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="฿ ราคา"
                          title="ราคา / ค่าใช้จ่าย (บาท)"
                          value={item.amount !== null && item.amount !== undefined ? item.amount : ''}
                          onChange={(e) => handleUpdateSubItem(idx, 'amount', e.target.value)}
                          className="w-full text-xs text-right py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-semibold focus:outline-none"
                        />
                      </div>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Real-time sum calculation indicator */}
                  {itemsSum > 0 && (
                    <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
                      <span className="font-medium">ยอดรวมคำนวณจากรายการย่อย ({subItems.length} ชิ้น):</span>
                      <span className="font-bold text-sm">{formatCurrency(itemsSum)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description / Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                รายละเอียด / บันทึกเพิ่มเติม
              </label>
              <textarea
                rows={2}
                placeholder="ระบุข้อความ รายละเอียด หรือไอเดียเพิ่มเติม..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            {/* Advanced / Flexible Fields Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 py-1"
              >
                <span>ตัวเลือกขั้นสูง (ทำซ้ำอัตโนมัติ, งบประมาณคงที่, แท็ก)</span>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/80 space-y-3 animate-in fade-in duration-150">
                  {/* Recurring Task Option */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-indigo-500" />
                      <span>ทำซ้ำอัตโนมัติ (Recurring)</span>
                    </label>
                    <select
                      value={recurring}
                      onChange={(e) => setRecurring(e.target.value as RecurringInterval)}
                      className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-600 focus:outline-none"
                    >
                      <option value="none">ไม่ทำซ้ำ (ครั้งเดียว)</option>
                      <option value="daily">ทำซ้ำทุกวัน (Daily)</option>
                      <option value="weekly">ทำซ้ำทุกสัปดาห์ (Weekly)</option>
                      <option value="monthly">ทำซ้ำทุกเดือน (Monthly)</option>
                    </select>
                  </div>

                  {subItems.length === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="จำนวนเงินรวม (บาท) — กรอกแบบกำหนดเอง"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        leftIcon={<Coins className="w-4 h-4" />}
                      />

                      <Input
                        label="จำนวนชิ้นรวม — กรอกแบบกำหนดเอง"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        leftIcon={<Package className="w-4 h-4" />}
                      />
                    </div>
                  )}

                  <div>
                    <Input
                      label="แท็ก (คั่นด้วยจุลภาค)"
                      placeholder="market, vegetables, personal"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      leftIcon={<Tag className="w-4 h-4" />}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Favorite Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isFavorite
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                <span>ปักหมุดเป็นรายการโปรด (Favorite)</span>
              </button>
            </div>
          </form>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={handleSubmit} isLoading={isSubmitting}>
              {initialData ? 'บันทึกการแก้ไข' : 'สร้างรายการ'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
