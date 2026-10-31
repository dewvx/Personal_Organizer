import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { Transaction, TransactionType, Wallet, Category } from '../../types';
import { Button } from '../common/Button';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Transaction>) => Promise<void>;
  initialData?: Transaction | null;
  wallets: Wallet[];
  categories: Category[];
  defaultWalletId?: number;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  wallets,
  categories,
  defaultWalletId,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [walletId, setWalletId] = useState<number>(0);
  const [toWalletId, setToWalletId] = useState<number | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [amount, setAmount] = useState<number | string>('');
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setWalletId(initialData.wallet_id || (wallets[0]?.id || 0));
      setToWalletId(initialData.to_wallet_id || undefined);
      setCategoryId(initialData.category_id || undefined);
      setAmount(initialData.amount || '');
      setNote(initialData.note || '');
      setTransactionDate(initialData.transaction_date ? initialData.transaction_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    } else {
      setType('expense');
      setWalletId(defaultWalletId || wallets[0]?.id || 0);
      setToWalletId(undefined);
      setCategoryId(categories[0]?.id || undefined);
      setAmount('');
      setNote('');
      setTransactionDate(new Date().toISOString().slice(0, 10));
    }
  }, [initialData, isOpen, defaultWalletId, wallets, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(String(amount));
    if (!walletId || isNaN(numAmount) || numAmount <= 0) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        type,
        wallet_id: walletId,
        to_wallet_id: type === 'transfer' ? toWalletId : null,
        category_id: type !== 'transfer' ? categoryId : null,
        amount: numAmount,
        note: note.trim() || null,
        transaction_date: transactionDate,
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
            {initialData ? 'แก้ไขรายการเงิน' : 'บันทึกรายการเงินใหม่ (New Transaction)'}
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
          {/* Type Segmented Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'expense', label: 'รายจ่าย (Expense)', icon: ArrowUpRight, activeClass: 'bg-rose-600 text-white border-rose-600' },
              { id: 'income', label: 'รายรับ (Income)', icon: ArrowDownLeft, activeClass: 'bg-emerald-600 text-white border-emerald-600' },
              { id: 'transfer', label: 'โอนเงิน (Transfer)', icon: ArrowLeftRight, activeClass: 'bg-blue-600 text-white border-blue-600' },
            ].map((t) => {
              const Icon = t.icon;
              const isCurrent = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as TransactionType)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                    isCurrent
                      ? `${t.activeClass} shadow-sm`
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="leading-tight text-[11px]">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              จำนวนเงิน (฿) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xl font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Wallet selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {type === 'transfer' ? 'โอนออกจากกระเป๋า' : 'กระเป๋าเงิน'}
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  ไปยังกระเป๋าปลายทาง
                </label>
                <select
                  value={toWalletId || ''}
                  onChange={(e) => setToWalletId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- เลือกกระเป๋าปลายทาง --</option>
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  หมวดหมู่ (Category)
                </label>
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Note & Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              บันทึกช่วยจำ (Note)
            </label>
            <input
              type="text"
              placeholder="เช่น ค่าอาหารกลางวัน, เงินเดือน, ซื้อของเข้าบ้าน..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              วันที่ทำรายการ (Date)
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {initialData ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
