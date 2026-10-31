import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2, Settings2 } from 'lucide-react';
import { Category, CategoryCustomField } from '../../types';
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
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [customSchema, setCustomSchema] = useState<CategoryCustomField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setIcon(initialData.icon || 'folder');
      setColor(initialData.color || '#6366F1');
      setMonthlyBudget(initialData.monthly_budget !== null && initialData.monthly_budget !== undefined ? String(initialData.monthly_budget) : '');
      setCustomSchema(Array.isArray(initialData.custom_schema) ? initialData.custom_schema : []);
    } else {
      setName('');
      setDescription('');
      setIcon('folder');
      setColor('#6366F1');
      setMonthlyBudget('');
      setCustomSchema([]);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const addCustomField = () => {
    setCustomSchema((prev) => [
      ...prev,
      {
        id: `field_${Date.now()}`,
        name: '',
        type: 'text',
        options: [],
        required: false,
      },
    ]);
  };

  const removeCustomField = (id: string) => {
    setCustomSchema((prev) => prev.filter((f) => f.id !== id));
  };

  const updateCustomField = (id: string, updates: Partial<CategoryCustomField>) => {
    setCustomSchema((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

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
        monthly_budget: monthlyBudget ? parseFloat(monthlyBudget) : null,
        custom_schema: customSchema.filter((f) => f.name.trim() !== ''),
      });

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
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
        <div className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-2xl transition-all w-full max-w-md border border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {initialData ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่ใหม่'}
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

            <Input
              label="ชื่อหมวดหมู่ *"
              placeholder="เช่น งานประจำ, ช้อปปิ้ง, ค่าใช้จ่าย, สุขภาพ..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />

            <div>
              <Input
                label="งบประมาณรายจ่ายต่อเดือน (บาท) [ไม่บังคับ]"
                type="number"
                min="0"
                step="any"
                placeholder="เช่น 5,000 หรือ 10,000"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                ระบบจะคำนวณและแจ้งเตือนเมื่อรายจ่ายในเดือนนั้นเข้าใกล้ 80% หรือเกินงบ
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                คำอธิบายหมวดหมู่ (ไม่บังคับ)
              </label>
              <textarea
                rows={2}
                placeholder="คำอธิบายสั้น ๆ เกี่ยวกับหมวดหมู่นี้..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            {/* Color Palette Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">เลือกสีประจำหมวดหมู่</label>
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
              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40">
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

            {/* Custom Metadata Fields (FEAT-B4) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>ฟิลด์ข้อมูลเฉพาะหมวดหมู่ (Custom Fields)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">กำหนดฟิลด์เพิ่มเติมสำหรับรายการในหมวดหมู่นี้</p>
                </div>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มฟิลด์</span>
                </button>
              </div>

              {customSchema.length > 0 && (
                <div className="space-y-2 mt-2">
                  {customSchema.map((field) => (
                    <div
                      key={field.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="ชื่อฟิลด์ เช่น เลขไมล์, สำนักพิมพ์..."
                          value={field.name}
                          onChange={(e) => updateCustomField(field.id, { name: e.target.value })}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateCustomField(field.id, { type: e.target.value as any })}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                        >
                          <option value="text">ข้อความ (Text)</option>
                          <option value="number">ตัวเลข (Number)</option>
                          <option value="date">วันที่ (Date)</option>
                          <option value="boolean">เช็กบ็อกซ์ (Yes/No)</option>
                          <option value="select">ตัวเลือก (Select)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCustomField(field.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {field.type === 'select' && (
                        <input
                          type="text"
                          placeholder="ตัวเลือก คั่นด้วยจุลภาค เช่น ตัวเลือก 1, ตัวเลือก 2, ตัวเลือก 3"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) =>
                            updateCustomField(field.id, {
                              options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={handleSubmit} isLoading={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {initialData ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
