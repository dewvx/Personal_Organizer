import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Check,
  ShoppingCart,
  Zap,
  ShoppingBag,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { Entry, EntryItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { triggerHaptic } from '../../utils/haptics';

interface ShoppingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: Entry;
  onToggleItem: (itemId: number, currentCompleted: boolean) => void;
}

export const ShoppingModeModal: React.FC<ShoppingModeModalProps> = ({
  isOpen,
  onClose,
  entry,
  onToggleItem,
}) => {
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const wakeLockRef = useRef<any>(null);

  // Request Screen Wake Lock when modal is open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          if (isMounted) setWakeLockActive(true);
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    };

    requestWakeLock();

    return () => {
      isMounted = false;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      setWakeLockActive(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const items: EntryItem[] = entry.items || [];
  const completedItems = items.filter((i) => i.is_completed);
  const totalCount = items.length;
  const completedCount = completedItems.length;

  const totalSpent = completedItems.reduce((sum, item) => sum + (parseFloat(String(item.amount || 0)) || 0), 0);
  const totalEstimated = items.reduce((sum, item) => sum + (parseFloat(String(item.amount || 0)) || 0), 0);

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleItemClick = (item: EntryItem) => {
    if (!item.id) return;
    triggerHaptic(item.is_completed ? 'light' : 'success');
    onToggleItem(item.id, !item.is_completed);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-white flex flex-col animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800">
                โหมดซื้อของ (Shopping Focus)
              </span>
              {wakeLockActive && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <Zap className="w-3 h-3 fill-emerald-400 animate-pulse" />
                  <span>จอไม่ดับ</span>
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white truncate max-w-[220px] sm:max-w-md mt-0.5">
              {entry.title}
            </h2>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Live Spending & Progress Ticker */}
      <div className="bg-slate-900/60 p-4 border-b border-slate-800/80">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300 font-medium">
                หยิบใส่ตะกร้าแล้ว <strong className="text-white text-sm">{completedCount}</strong> จาก {totalCount} ชิ้น
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-sm">
              <Coins className="w-4 h-4" />
              <span>{formatCurrency(totalSpent)}</span>
              {totalEstimated > totalSpent && (
                <span className="text-[11px] text-slate-500 font-normal">/ {formatCurrency(totalEstimated)}</span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main List of Shopping Items (Large Thumb Friendly Touch Targets) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl w-full mx-auto space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p>ไม่มีรายการย่อยในบันทึกนี้</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => handleItemClick(item)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                item.is_completed
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                {/* Giant Checkbox */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                    item.is_completed
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950'
                      : 'border-2 border-slate-600 bg-slate-800/80 text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>

                <div className="truncate">
                  <h3
                    className={`text-base font-semibold leading-snug truncate ${
                      item.is_completed ? 'line-through text-slate-500' : 'text-white'
                    }`}
                  >
                    {item.title}
                  </h3>
                  {item.quantity && item.quantity > 1 && (
                    <span className="text-xs text-indigo-400 font-medium">
                      จำนวน: {item.quantity} ชิ้น
                    </span>
                  )}
                </div>
              </div>

              {/* Price Tag */}
              {item.amount && item.amount > 0 ? (
                <div
                  className={`px-3 py-1.5 rounded-xl font-bold text-sm flex-shrink-0 ${
                    item.is_completed
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                      : 'bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}
                >
                  {formatCurrency(item.amount)}
                </div>
              ) : null}
            </div>
          ))
        )}

        {/* All items completed celebration banner */}
        {totalCount > 0 && completedCount === totalCount && (
          <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-center space-y-1.5 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-emerald-200">ซื้อครบทุกรายการแล้ว! 🎉</h4>
            <p className="text-xs text-emerald-400">
              ยอดใช้จ่ายรวมทั้งสิ้น {formatCurrency(totalSpent)}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Floating Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic('success');
              onClose();
            }}
            className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition-all active:scale-[0.98]"
          >
            <span>เสร็จสิ้นการช้อปปิ้ง</span>
          </button>
        </div>
      </div>
    </div>
  );
};
