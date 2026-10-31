import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Habit } from '../../types';
import { AVAILABLE_COLORS, AVAILABLE_ICONS } from '../../utils/categoryIcons';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Habit>) => Promise<void>;
  initialData?: Habit | null;
}

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('check');
  const [color, setColor] = useState('#10B981');
  const [targetDays, setTargetDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setIcon(initialData.icon || 'check');
      setColor(initialData.color || '#10B981');
      setTargetDays(initialData.target_days || 7);
    } else {
      setName('');
      setDescription('');
      setIcon('check');
      setColor('#10B981');
      setTargetDays(7);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อกิจวัตร');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        target_days: targetDays,
        frequency: 'daily',
      });

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการบันทึกกิจวัตร');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-2xl transition-all w-full max-w-md border border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {initialData ? 'แก้ไขกิจวัตร' : 'สร้างกิจวัตรใหม่'}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
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

            <Input
              label="ชื่อกิจวัตร *"
              placeholder="เช่น ดื่มน้ำ 2 ลิตร, อ่านหนังสือ 20 นาที, วิ่ง..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                คำอธิบาย / เป้าหมายสั้น ๆ
              </label>
              <textarea
                rows={2}
                placeholder="เช่น เพื่อสุขภาพที่ดี ดื่มน้ำครบ 8 แก้ว..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            {/* Target days per week */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                เป้าหมายความถี่ต่อสัปดาห์: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{targetDays} วัน / สัปดาห์</span>
              </label>
              <input
                type="range"
                min="1"
                max="7"
                value={targetDays}
                onChange={(e) => setTargetDays(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Color Palette Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">เลือกสีประจำกิจวัตร</label>
              <div className="flex flex-wrap gap-2.5">
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      color === c ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-105'
                    }`}
                  >
                    {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">เลือกไอคอน</label>
              <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
                {AVAILABLE_ICONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      title={item.label}
                      onClick={() => setIcon(item.name)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={handleSubmit} isLoading={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {initialData ? 'บันทึกการแก้ไข' : 'สร้างกิจวัตร'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
