const WalletModel = require('../models/walletModel');
const TransactionModel = require('../models/transactionModel');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const FinanceController = {
  // Wallets
  async getWallets(req, res, next) {
    try {
      const wallets = await WalletModel.findAll(req.query);
      return successResponse(res, wallets, 'ดึงรายการกระเป๋าเงินสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async getWalletById(req, res, next) {
    try {
      const wallet = await WalletModel.findById(req.params.id);
      if (!wallet) return errorResponse(res, 'ไม่พบกระเป๋าเงิน', 404);
      return successResponse(res, wallet, 'ดึงข้อมูลกระเป๋าเงินสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async createWallet(req, res, next) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) return errorResponse(res, 'กรุณาระบุชื่อกระเป๋าเงิน', 400);
      const wallet = await WalletModel.create(req.body);
      return successResponse(res, wallet, 'สร้างกระเป๋าเงินใหม่สำเร็จ', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateWallet(req, res, next) {
    try {
      const wallet = await WalletModel.update(req.params.id, req.body);
      if (!wallet) return errorResponse(res, 'ไม่พบกระเป๋าเงิน', 404);
      return successResponse(res, wallet, 'อัปเดตข้อมูลกระเป๋าเงินสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async deleteWallet(req, res, next) {
    try {
      const deleted = await WalletModel.delete(req.params.id);
      if (!deleted) return errorResponse(res, 'ไม่พบกระเป๋าเงิน', 404);
      return successResponse(res, { id: req.params.id }, 'ลบกระเป๋าเงินสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  // Transactions
  async getTransactions(req, res, next) {
    try {
      const result = await TransactionModel.findAll(req.query);
      return successResponse(res, result.transactions, 'ดึงรายการธุรกรรมสำเร็จ', 200, result.meta);
    } catch (err) {
      next(err);
    }
  },

  async getTransactionById(req, res, next) {
    try {
      const t = await TransactionModel.findById(req.params.id);
      if (!t) return errorResponse(res, 'ไม่พบรายการธุรกรรม', 404);
      return successResponse(res, t, 'ดึงข้อมูลธุรกรรมสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async createTransaction(req, res, next) {
    try {
      const { wallet_id, amount, type } = req.body;
      if (!wallet_id) return errorResponse(res, 'กรุณาเลือกกระเป๋าเงิน', 400);
      if (!amount || parseFloat(amount) <= 0) return errorResponse(res, 'กรุณาระบุจำนวนเงินที่ถูกต้อง (> 0)', 400);
      if (type === 'transfer' && !req.body.to_wallet_id) {
        return errorResponse(res, 'การโอนเงินต้องระบุกระเป๋าเงินปลายทาง', 400);
      }
      if (type === 'transfer' && parseInt(wallet_id, 10) === parseInt(req.body.to_wallet_id, 10)) {
        return errorResponse(res, 'ไม่สามารถโอนเงินเข้ากระเป๋าเดียวกันได้', 400);
      }

      const transaction = await TransactionModel.create(req.body);
      return successResponse(res, transaction, 'บันทึกธุรกรรมสำเร็จ', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateTransaction(req, res, next) {
    try {
      const existing = await TransactionModel.findById(req.params.id);
      if (!existing) return errorResponse(res, 'ไม่พบรายการธุรกรรม', 404);

      const transaction = await TransactionModel.update(req.params.id, req.body);
      return successResponse(res, transaction, 'อัปเดตธุรกรรมสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async deleteTransaction(req, res, next) {
    try {
      const deleted = await TransactionModel.delete(req.params.id);
      if (!deleted) return errorResponse(res, 'ไม่พบรายการธุรกรรม', 404);
      return successResponse(res, { id: req.params.id }, 'ลบธุรกรรมสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  // Summary & Reports
  async getSummary(req, res, next) {
    try {
      const summary = await TransactionModel.getSummary(req.query);
      return successResponse(res, summary, 'ดึงสรุปสถานะการเงินสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async getMonthlyReport(req, res, next) {
    try {
      const now = new Date();
      const year = req.query.year || now.getFullYear();
      const month = req.query.month || (now.getMonth() + 1);
      const report = await TransactionModel.getMonthlyBreakdown({
        year,
        month,
        wallet_id: req.query.wallet_id,
      });
      return successResponse(res, report, 'ดึงรายงานการเงินรายเดือนสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async getBudgets(req, res, next) {
    try {
      const now = new Date();
      const defaultYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const year_month = req.query.year_month || defaultYm;
      const budgets = await TransactionModel.getBudgets(year_month);
      return successResponse(res, budgets, 'ดึงงบประมาณสำเร็จ');
    } catch (err) {
      next(err);
    }
  },

  async upsertBudget(req, res, next) {
    try {
      const { category_id, year_month, budget_amount } = req.body;
      if (!category_id || !year_month || budget_amount === undefined) {
        return errorResponse(res, 'ข้อมูลไม่ครบถ้วน (category_id, year_month, budget_amount)', 400);
      }
      const saved = await TransactionModel.upsertBudget({
        category_id,
        year_month,
        budget_amount: parseFloat(budget_amount) || 0,
      });
      return successResponse(res, saved, 'บันทึกงบประมาณสำเร็จ');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = FinanceController;
