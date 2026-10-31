import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ListTodo,
  Coins,
  ArrowRight,
  Trash2,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Template } from '../../types';
import { TemplateService } from '../../services/templateService';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateApplied: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onTemplateApplied,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTemplateId, setExpandedTemplateId] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState<number | null>(null);
  const { showToast } = useToast();

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TemplateService.getAll(selectedCategory);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  if (!isOpen) return null;

  const handleApply = async (template: Template) => {
    try {
      setIsApplying(template.id);
      await TemplateService.apply(template.id);
      showToast(`สร้างรายการจากเทมเพลต "${template.title}" เรียบร้อยแล้ว!`, 'success');
      onTemplateApplied();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการนำเทมเพลตไปใช้งาน', 'error');
    } finally {
      setIsApplying(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await TemplateService.delete(id);
      showToast('ลบเทมเพลตเรียบร้อยแล้ว');
      loadTemplates();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'ไม่สามารถลบเทมเพลตได้', 'error');
    }
  };

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'ท่องเที่ยว', label: 'ท่องเที่ยว' },
    { id: 'การเงิน', label: 'การเงิน' },
    { id: 'งานบ้าน', label: 'งานบ้าน/ที่อยู่' },
    { id: 'สุขภาพ', label: 'สุขภาพ' },
    { id: 'ยานพาหนะ', label: 'ยานพาหนะ' },
    { id: 'การงาน', label: 'การทำงาน' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-5 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-2xl transition-all w-full max-w-3xl border border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  คลังเทมเพลตสำเร็จรูป (Life Templates)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  เริ่มต้นบันทึกอย่างรวดเร็วด้วยเช็กลิสต์และแผนงานมาตรฐานพร้อมใช้
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Categories */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800/80">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                ไม่พบเทมเพลตในหมวดหมู่นี้
              </div>
            ) : (
              templates.map((tpl) => {
                const isExpanded = expandedTemplateId === tpl.id;
                const itemsCount = tpl.items?.length || 0;

                return (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${tpl.color}15`, color: tpl.color }}
                        >
                          {renderCategoryIcon(tpl.icon, 'w-5 h-5')}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                              style={{
                                backgroundColor: `${tpl.color}15`,
                                color: tpl.color,
                                borderColor: `${tpl.color}30`,
                              }}
                            >
                              {tpl.category_name || 'ทั่วไป'}
                            </span>
                            {tpl.is_builtin ? (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                มาตรฐาน
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                สร้างเอง
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {tpl.title}
                          </h4>
                          {tpl.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {tpl.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApply(tpl)}
                          isLoading={isApplying === tpl.id}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-semibold"
                        >
                          <span>นำไปใช้</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>

                        {!tpl.is_builtin && (
                          <button
                            onClick={() => handleDelete(tpl.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="ลบเทมเพลตนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Meta stats & expand items toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium">
                          <ListTodo className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{itemsCount} เช็กลิสต์</span>
                        </span>

                        {tpl.estimated_amount > 0 && (
                          <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                            <Coins className="w-3.5 h-3.5 text-emerald-500" />
                            <span>ประมาณ {formatCurrency(tpl.estimated_amount)}</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>{isExpanded ? 'ซ่อนรายการย่อย' : 'ดูเช็กลิสต์ทั้งหมด'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expanded checklist preview */}
                    {isExpanded && tpl.items && tpl.items.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1.5 animate-in fade-in duration-100">
                        {tpl.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                              <span className="truncate">{item.title}</span>
                            </span>
                            {item.amount && item.amount > 0 ? (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2">
                                {formatCurrency(item.amount)}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              ปิด
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
