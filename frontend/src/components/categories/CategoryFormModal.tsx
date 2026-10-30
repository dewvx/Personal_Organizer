import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Category } from '../../types';
import { AVAILABLE_COLORS, AVAILABLE_ICONS } from '../../utils/categoryIcons';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Category>) => Promise<void>;
  initialData?: Category | null;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('folder');
  const [color, setColor] = useState('#6366F1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setIcon(initialData.icon || 'folder');
      setColor(initialData.color || '#6366F1');
    } else {
      setName('');
      setDescription('');
      setIcon('folder');
      setColor('#6366F1');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อหมวดหมู่');
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
      });

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white p-5 sm:p-6 text-left shadow-xl transition-all w-full max-w-md border border-slate-100 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {initialData ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่ใหม่'}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <Input
              label="ชื่อหมวดหมู่ *"
              placeholder="เช่น งานประจำ, ช้อปปิ้ง, ค่าใช้จ่าย, ไอเดีย..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                คำอธิบายหมวดหมู่ (ไม่บังคับ)
              </label>
              <textarea
                rows={2}
                placeholder="คำอธิบายสั้น ๆ เกี่ยวกับหมวดหมู่นี้..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            {/* Color Palette Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">เลือกสีประจำหมวดหมู่</label>
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
              <label className="block text-xs font-semibold text-slate-600 mb-2">เลือกไอคอน</label>
              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
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
                          : 'text-slate-600 hover:bg-white hover:text-slate-900'
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
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={handleSubmit} isLoading={isSubmitting}>
              {initialData ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
