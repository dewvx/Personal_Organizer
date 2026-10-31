import React, { useState, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  LayoutGrid,
} from 'lucide-react';
import { DashboardWidgetItem } from '../../types';
import { DashboardService } from '../../services/dashboardService';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface DashboardLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: DashboardWidgetItem[];
  onLayoutUpdated: (newLayout: DashboardWidgetItem[]) => void;
}

const DEFAULT_LAYOUT: DashboardWidgetItem[] = [
  { id: 'stats', label: 'สถิติภาพรวม (Summary Stats)', visible: true, order: 1 },
  { id: 'habits', label: 'กิจวัตรประจำวัน (Daily Habits)', visible: true, order: 2 },
  { id: 'goals', label: 'เป้าหมายชีวิต (Life Goals)', visible: true, order: 3 },
  { id: 'urgent_tasks', label: 'งานใกล้ถึงกำหนด (Upcoming Due)', visible: true, order: 4 },
  { id: 'budget', label: 'งบประมาณรายจ่าย (Expense Analytics)', visible: true, order: 5 },
  { id: 'recent_entries', label: 'รายการล่าสุด (Recent Lists)', visible: true, order: 6 },
];

export const DashboardLayoutModal: React.FC<DashboardLayoutModalProps> = ({
  isOpen,
  onClose,
  currentLayout,
  onLayoutUpdated,
}) => {
  const [layout, setLayout] = useState<DashboardWidgetItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (currentLayout && currentLayout.length > 0) {
        setLayout([...currentLayout].sort((a, b) => a.order - b.order));
      } else {
        setLayout(DEFAULT_LAYOUT);
      }
    }
  }, [isOpen, currentLayout]);

  if (!isOpen) return null;

  const handleToggleVisible = (id: string) => {
    setLayout((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setLayout((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((item, i) => ({ ...item, order: i + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === layout.length - 1) return;
    setLayout((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((item, i) => ({ ...item, order: i + 1 }));
    });
  };

  const handleReset = () => {
    setLayout(DEFAULT_LAYOUT);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await DashboardService.updateLayout(layout);
      onLayoutUpdated(updated);
      showToast('บันทึกการจัดแต่ง Dashboard เรียบร้อย', 'success');
      onClose();
    } catch (err: any) {
      showToast('ไม่สามารถบันทึกรูปแบบ Dashboard ได้', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 text-left shadow-2xl transition-all w-full max-w-md border border-slate-200/80 dark:border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  จัดแต่งหน้า Dashboard (FEAT-E1)
                </h3>
                <p className="text-xs text-slate-400">เลือกเปิด/ปิด และเรียงลำดับการ์ด Widget</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Widget List */}
          <div className="py-4 space-y-2.5">
            {layout.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  item.visible
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700'
                    : 'bg-slate-100/50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center text-xs font-semibold text-slate-400">
                    {index + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Reorder Up */}
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="เลื่อนขึ้น"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Reorder Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === layout.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="เลื่อนลง"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisible(item.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.visible
                        ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                    title={item.visible ? 'ซ่อนวิดเจ็ต' : 'แสดงวิดเจ็ต'}
                  >
                    {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 px-2 py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตค่าเริ่มต้น</span>
            </button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
                ยกเลิก
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                leftIcon={<Check className="w-3.5 h-3.5 stroke-[3]" />}
              >
                บันทึกการจัดแต่ง
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
