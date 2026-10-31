import React, { useState, useEffect } from 'react';
import { X, Check, Target, Calendar, Coins, Tag } from 'lucide-react';
import { Goal, GoalFormData, GoalStatus } from '../../types';
import { AVAILABLE_COLORS, AVAILABLE_ICONS } from '../../utils/categoryIcons';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { getTodayDateString } from '../../utils/dateUtils';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => Promise<void>;
  initialData?: Goal | null;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [icon, setIcon] = useState('target');
  const [color, setColor] = useState('#6366F1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setTargetDate(initialData.target_date ? String(initialData.target_date).split('T')[0] : '');
      setTargetAmount(
        initialData.target_amount !== null && initialData.target_amount !== undefined
          ? String(initialData.target_amount)
          : ''
      );
      setStatus(initialData.status || 'active');
      setIcon(initialData.icon || 'target');
      setColor(initialData.color || '#6366F1');
    } else {
      setTitle('');
      setDescription('');
      setTargetDate('');
      setTargetAmount('');
      setStatus('active');
      setIcon('target');
      setColor('#6366F1');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('กรุณาระบุชื่อเป้าหมาย');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        target_date: targetDate || undefined,
        target_amount: targetAmount !== '' ? parseFloat(targetAmount) : undefined,
        status,
        icon,
        color,
      });

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการบันทึกเป้าหมาย');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-2xl transition-all w-full max-w-lg border border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              <span>{initialData ? 'แก้ไขเป้าหมาย' : 'สร้างเป้าหมายใหม่'}</span>
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ชื่อเป้าหมาย <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="เช่น เก็บเงินซื้อคอนโด, วิ่งมาราธอน 42K, อ่านหนังสือ 12 เล่ม..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                รายละเอียด / บันทึกเพิ่มเติม (ไม่บังคับ)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="อธิบายเหตุผล วิธีการ หรือเป้าหมายย่อย..."
                className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Target Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>วันกำหนดเป้าหมาย (Target Date)</span>
                </label>
                <input
                  type="date"
                  value={targetDate}
                  min={getTodayDateString()}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  สถานะเป้าหมาย
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as GoalStatus)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="active">กำลังทำ (Active)</option>
                  <option value="paused">พักไว้ชั่วคราว (Paused)</option>
                  <option value="achieved">สำเร็จแล้ว (Achieved 🏆)</option>
                  <option value="cancelled">ยกเลิก (Cancelled)</option>
                </select>
              </div>
            </div>

            {/* Target Amount (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>เป้าหมายยอดเงินสะสม (฿ - ไม่บังคับ)</span>
              </label>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder="เช่น 100000 (หากเป็นเป้าหมายทางการเงิน)"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                หากระบุยอดเงิน ความคืบหน้ารวมจะคำนวณจากยอดเงินของรายการที่ผูกกับเป้าหมายนี้
              </p>
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                ธีมสี
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      color === c ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                ไอคอน
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40">
                {AVAILABLE_ICONS.map((item) => {
                  const IconComponent = item.icon;
                  const isSelected = icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      title={item.label}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {initialData ? 'บันทึกการแก้ไข' : 'สร้างเป้าหมาย'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
