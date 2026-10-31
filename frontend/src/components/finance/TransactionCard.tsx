import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Trash2, Edit2, Calendar, Tag } from 'lucide-react';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';

  return (
    <div className="group bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3 shadow-2xs">
      {/* Icon & Details */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isIncome
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
              : isExpense
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
          }`}
        >
          {isIncome && <ArrowDownLeft className="w-5 h-5" />}
          {isExpense && <ArrowUpRight className="w-5 h-5" />}
          {isTransfer && <ArrowLeftRight className="w-5 h-5" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {transaction.note || (isIncome ? 'รายรับ' : isExpense ? 'รายจ่าย' : 'โอนเงิน')}
            </h4>
            {transaction.category_name && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{
                  backgroundColor: `${transaction.category_color}18`,
                  color: transaction.category_color,
                }}
              >
                {transaction.category_name}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span>
              {isTransfer
                ? `${transaction.wallet_name || 'กระเป๋า'} ➔ ${transaction.to_wallet_name || 'กระเป๋าปลายทาง'}`
                : transaction.wallet_name || 'กระเป๋าเงิน'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {transaction.transaction_date ? transaction.transaction_date.slice(0, 10) : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Amount & Quick Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-sm sm:text-base font-black font-mono tracking-tight ${
            isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : isExpense
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}
        >
          {isIncome ? '+' : isExpense ? '-' : ''}
          {formatCurrency(transaction.amount)}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction.id)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
