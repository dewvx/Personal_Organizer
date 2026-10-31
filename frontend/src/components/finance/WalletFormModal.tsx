import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Wallet, WalletType } from '../../types';
import { Button } from '../common/Button';

interface WalletFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Wallet>) => Promise<void>;
  initialData?: Wallet | null;
}

const walletTypes: { id: WalletType; label: string }[] = [
  { id: 'cash', label: 'เงินสด (Cash)' },
  { id: 'bank', label: 'บัญชีธนาคาร (Bank Account)' },
  { id: 'credit_card', label: 'บัตรเครดิต (Credit Card)' },
  { id: 'e_wallet', label: 'กระเป๋าอิเล็กทรอนิกส์ (E-Wallet)' },
  { id: 'savings', label: 'เงินออม / การลงทุน (Savings)' },
];

const colorPresets = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#64748B', // Slate
];

export const WalletFormModal: React.FC<WalletFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('cash');
  const [balance, setBalance] = useState<number | string>(0);
  const [color, setColor] = useState('#10B981');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setType(initialData.type || 'cash');
      setBalance(initialData.balance !== undefined ? initialData.balance : 0);
      setColor(initialData.color || '#10B981');
    } else {
      setName('');
      setType('cash');
      setBalance(0);
      setColor('#10B981');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        type,
        balance: parseFloat(String(balance)) || 0,
        color,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {initialData ? 'แก้ไขกระเป๋าเงิน' : 'เพิ่มกระเป๋าเงินใหม่ (New Wallet)'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              ชื่อกระเป๋าเงิน / บัญชี <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น บัญชีกสิกร, กระเป๋าตังค์, TrueMoney..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              ประเภทกระเป๋า
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WalletType)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {walletTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {initialData ? 'ปรับยอดคงเหลือปัจจุบัน (฿)' : 'ยอดเงินเริ่มต้น (Initial Balance ฿)'}
            </label>
            <input
              type="number"
              step="any"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              สีประจำกระเป๋า
            </label>
            <div className="flex items-center gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {initialData ? 'บันทึก' : 'สร้างกระเป๋า'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
