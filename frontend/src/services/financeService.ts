import api from './api';
import {
  ApiResponse,
  Wallet,
  Transaction,
  TransactionFilters,
  FinanceSummary,
  MonthlyFinanceReport,
  CategoryBudget,
} from '../types';

export const FinanceService = {
  // Wallets
  async getWallets(params?: { is_archived?: boolean | string }): Promise<Wallet[]> {
    const res = await api.get<ApiResponse<Wallet[]>>('/finance/wallets', { params });
    return res.data.data;
  },

  async getWalletById(id: number): Promise<Wallet> {
    const res = await api.get<ApiResponse<Wallet>>(`/finance/wallets/${id}`);
    return res.data.data;
  },

  async createWallet(data: Partial<Wallet>): Promise<Wallet> {
    const res = await api.post<ApiResponse<Wallet>>('/finance/wallets', data);
    return res.data.data;
  },

  async updateWallet(id: number, data: Partial<Wallet>): Promise<Wallet> {
    const res = await api.put<ApiResponse<Wallet>>(`/finance/wallets/${id}`, data);
    return res.data.data;
  },

  async deleteWallet(id: number): Promise<void> {
    await api.delete(`/finance/wallets/${id}`);
  },

  // Transactions
  async getTransactions(filters?: TransactionFilters): Promise<{ transactions: Transaction[]; meta: any }> {
    const res = await api.get<ApiResponse<Transaction[]>>('/finance/transactions', { params: filters });
    return {
      transactions: res.data.data,
      meta: res.data.meta,
    };
  },

  async getTransactionById(id: number): Promise<Transaction> {
    const res = await api.get<ApiResponse<Transaction>>(`/finance/transactions/${id}`);
    return res.data.data;
  },

  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const res = await api.post<ApiResponse<Transaction>>('/finance/transactions', data);
    return res.data.data;
  },

  async updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction> {
    const res = await api.put<ApiResponse<Transaction>>(`/finance/transactions/${id}`, data);
    return res.data.data;
  },

  async deleteTransaction(id: number): Promise<void> {
    await api.delete(`/finance/transactions/${id}`);
  },

  // Reports & Budgets
  async getSummary(params?: { start_date?: string; end_date?: string; wallet_id?: number | string }): Promise<FinanceSummary> {
    const res = await api.get<ApiResponse<FinanceSummary>>('/finance/summary', { params });
    return res.data.data;
  },

  async getMonthlyReport(params?: { year?: number; month?: number; wallet_id?: number | string }): Promise<MonthlyFinanceReport> {
    const res = await api.get<ApiResponse<MonthlyFinanceReport>>('/finance/report/monthly', { params });
    return res.data.data;
  },

  async getBudgets(year_month?: string): Promise<CategoryBudget[]> {
    const res = await api.get<ApiResponse<CategoryBudget[]>>('/finance/budgets', { params: { year_month } });
    return res.data.data;
  },

  async upsertBudget(data: { category_id: number; year_month: string; budget_amount: number }): Promise<any> {
    const res = await api.post<ApiResponse<any>>('/finance/budgets', data);
    return res.data.data;
  },
};
