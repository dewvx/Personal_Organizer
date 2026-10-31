import React from 'react';
import { Wallet as WalletIcon, Building2, CreditCard, Smartphone, PiggyBank, Edit2, Trash2 } from 'lucide-react';
import { Wallet, WalletType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface WalletCardProps {
  wallet: Wallet;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  onEdit: (wallet: Wallet) => void;
  onDelete: (id: number) => void;
}

const typeIcons: Record<WalletType, React.FC<{ className?: string }>> = {
  cash: WalletIcon,
  bank: Building2,
  credit_card: CreditCard,
  e_wallet: Smartphone,
  savings: PiggyBank,
};

const typeNames: Record<WalletType, string> = {
  cash: 'เงินสด',
  bank: 'ธนาคาร',
  credit_card: 'บัตรเครดิต',
  e_wallet: 'กระเป๋าอิเล็กทรอนิกส์',
  savings: 'เงินออม',
};

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const IconComponent = typeIcons[wallet.type] || WalletIcon;

  return (
    <div
      onClick={() => onSelect && onSelect(wallet.id)}
      className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-w-[200px] sm:min-w-[220px] shadow-xs ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: wallet.color || '#6366F1' }}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
              {wallet.name}
            </h4>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {typeNames[wallet.type] || wallet.type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(wallet);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="แก้ไข"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(wallet.id);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="ลบ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <span className="text-[10px] font-medium text-slate-400">ยอดคงเหลือ</span>
        <p
          className={`text-lg font-black tracking-tight ${
            wallet.balance < 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {formatCurrency(wallet.balance)}
        </p>
      </div>
    </div>
  );
};
