import React, { useState, useEffect, useCallback } from 'react';
import {
  Coins,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet as WalletIcon,
  Search,
  Filter,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  Wallet,
  Transaction,
  FinanceSummary,
  MonthlyFinanceReport,
  Category,
  TransactionType,
} from '../types';
import { FinanceService } from '../services/financeService';
import { CategoryService } from '../services/categoryService';
import { WalletCard } from '../components/finance/WalletCard';
import { WalletFormModal } from '../components/finance/WalletFormModal';
import { TransactionCard } from '../components/finance/TransactionCard';
import { TransactionFormModal } from '../components/finance/TransactionFormModal';
import { FinanceSummaryBar } from '../components/finance/FinanceSummaryBar';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

export const FinancePage: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deletingWalletId, setDeletingWalletId] = useState<number | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [wRes, sumRes, txRes, catRes] = await Promise.all([
        FinanceService.getWallets(),
        FinanceService.getSummary({ wallet_id: selectedWalletId }),
        FinanceService.getTransactions({
          wallet_id: selectedWalletId,
          type: typeFilter,
          search: searchQuery || undefined,
        }),
        CategoryService.getAll(),
      ]);

      setWallets(wRes);
      setSummary(sumRes);
      setTransactions(txRes.transactions);
      setCategories(catRes);
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถโหลดข้อมูลการเงินได้', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedWalletId, typeFilter, searchQuery, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Wallet Handlers
  const handleSaveWallet = async (data: Partial<Wallet>) => {
    try {
      if (editingWallet) {
        await FinanceService.updateWallet(editingWallet.id, data);
        showToast('อัปเดตกระเป๋าเงินสำเร็จ');
      } else {
        await FinanceService.createWallet(data);
        showToast('สร้างกระเป๋าเงินใหม่สำเร็จ');
      }
      loadData();
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกกระเป๋าเงิน', 'error');
    }
  };

  const handleConfirmDeleteWallet = async () => {
    if (!deletingWalletId) return;
    try {
      setIsDeleting(true);
      await FinanceService.deleteWallet(deletingWalletId);
      if (selectedWalletId === deletingWalletId) {
        setSelectedWalletId(undefined);
      }
      setDeletingWalletId(null);
      showToast('ลบกระเป๋าเงินสำเร็จ');
      loadData();
    } catch (err) {
      showToast('ไม่สามารถลบกระเป๋าเงินได้', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Transaction Handlers
  const handleSaveTransaction = async (data: Partial<Transaction>) => {
    try {
      if (editingTx) {
        await FinanceService.updateTransaction(editingTx.id, data);
        showToast('อัปเดตรายการเงินสำเร็จ');
      } else {
        await FinanceService.createTransaction(data);
        showToast('บันทึกรายการเงินใหม่สำเร็จ');
      }
      loadData();
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกรายการเงิน', 'error');
    }
  };

  const handleConfirmDeleteTx = async () => {
    if (!deletingTxId) return;
    try {
      setIsDeleting(true);
      await FinanceService.deleteTransaction(deletingTxId);
      setDeletingTxId(null);
      showToast('ลบรายการเงินสำเร็จ');
      loadData();
    } catch (err) {
      showToast('ไม่สามารถลบรายการเงินได้', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
              ระบบบัญชีและการเงิน (Income & Expense)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            บันทึกรายรับ-รายจ่าย แยกตามกระเป๋าเงินและหมวดหมู่ พร้อมสรุปยอดคงเหลือ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setEditingWallet(null);
              setIsWalletModalOpen(true);
            }}
          >
            <WalletIcon className="w-4 h-4 mr-1.5" /> + เพิ่มกระเป๋าเงิน
          </Button>
          <Button
            onClick={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            className="shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4 mr-1.5" /> บันทึกรายการเงิน
          </Button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <FinanceSummaryBar summary={summary} isLoading={isLoading} />

      {/* Wallets Horizontal Carousel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            กระเป๋าเงินของคุณ ({wallets.length})
          </h3>
          {selectedWalletId && (
            <button
              onClick={() => setSelectedWalletId(undefined)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              แสดงกระเป๋าทั้งหมด
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {wallets.map((w) => (
            <WalletCard
              key={w.id}
              wallet={w}
              isSelected={selectedWalletId === w.id}
              onSelect={(id) => setSelectedWalletId(selectedWalletId === id ? undefined : id)}
              onEdit={(wallet) => {
                setEditingWallet(wallet);
                setIsWalletModalOpen(true);
              }}
              onDelete={(id) => setDeletingWalletId(id)}
            />
          ))}
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'expense', label: 'รายจ่าย' },
              { id: 'income', label: 'รายรับ' },
              { id: 'transfer', label: 'โอนเงิน' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  typeFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาบันทึกธุรกรรม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="ไม่พบรายการเงิน"
            description="ยังไม่มีประวัติรายรับหรือรายจ่ายตามเงื่อนไขที่เลือก"
            actionLabel="บันทึกรายการแรก"
            onAction={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
          />
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                onEdit={(t) => {
                  setEditingTx(t);
                  setIsTxModalOpen(true);
                }}
                onDelete={(id) => setDeletingTxId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Wallet Modal */}
      <WalletFormModal
        isOpen={isWalletModalOpen}
        onClose={() => {
          setIsWalletModalOpen(false);
          setEditingWallet(null);
        }}
        onSubmit={handleSaveWallet}
        initialData={editingWallet}
      />

      {/* Transaction Modal */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleSaveTransaction}
        initialData={editingTx}
        wallets={wallets}
        categories={categories}
        defaultWalletId={selectedWalletId}
      />

      {/* Delete Wallet Confirm */}
      <ConfirmModal
        isOpen={!!deletingWalletId}
        title="ยืนยันการลบกระเป๋าเงิน"
        message="การลบกระเป๋าเงินจะลบประวัติธุรกรรมทั้งหมดที่เกี่ยวข้องกับกระเป๋านี้ด้วย คุณแน่ใจหรือไม่?"
        confirmLabel="ลบกระเป๋าเงิน"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteWallet}
        onCancel={() => setDeletingWalletId(null)}
      />

      {/* Delete Transaction Confirm */}
      <ConfirmModal
        isOpen={!!deletingTxId}
        title="ยืนยันการลบรายการเงิน"
        message="ยอดเงินในกระเป๋าจะถูกคำนวณย้อนกลับอัตโนมัติ คุณแน่ใจหรือไม่?"
        confirmLabel="ลบรายการ"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteTx}
        onCancel={() => setDeletingTxId(null)}
      />
    </div>
  );
};
