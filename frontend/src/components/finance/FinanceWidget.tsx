import React, { useState, useEffect, useCallback } from 'react';
import { Coins, Plus, ArrowRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { FinanceSummary, Transaction, Wallet } from '../../types';
import { FinanceService } from '../../services/financeService';
import { TransactionFormModal } from './TransactionFormModal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface FinanceWidgetProps {
  onNavigateFinance?: () => void;
}

export const FinanceWidget: React.FC<FinanceWidgetProps> = ({ onNavigateFinance }) => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sumRes, txRes, wRes] = await Promise.all([
        FinanceService.getSummary(),
        FinanceService.getTransactions({ limit: 4 }),
        FinanceService.getWallets(),
      ]);
      setSummary(sumRes);
      setRecentTx(txRes.transactions);
      setWallets(wRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTx = async (data: Partial<Transaction>) => {
    await FinanceService.createTransaction(data);
    showToast('บันทึกรายการเงินสำเร็จ');
    loadData();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              สถานะการเงิน (Finance Tracker)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              รายรับ รายจ่าย และยอดเงินคงเหลือ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> บันทึกเงิน
          </Button>
          {onNavigateFinance && (
            <button
              onClick={onNavigateFinance}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="ดูหน้าการเงินเต็มรูปแบบ"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-medium">คงเหลือรวม</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
              {formatCurrency(summary.total_balance)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">รายรับ</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              +{formatCurrency(summary.total_income)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">รายจ่าย</span>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
              -{formatCurrency(summary.total_expense)}
            </p>
          </div>
        </div>
      )}

      {/* Recent Tx List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : recentTx.length === 0 ? (
        <div className="text-center py-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-500 mb-2">ยังไม่มีรายการเงินในระบบ</p>
          <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(true)}>
            เพิ่มรายการแรก
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {recentTx.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    tx.type === 'income'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                  }`}
                >
                  {tx.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {tx.note || (tx.type === 'income' ? 'รายรับ' : 'รายจ่าย')}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {tx.wallet_name} {tx.category_name ? `• ${tx.category_name}` : ''}
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold font-mono shrink-0 ${
                  tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTx}
        wallets={wallets}
        categories={[]}
      />
    </div>
  );
};
