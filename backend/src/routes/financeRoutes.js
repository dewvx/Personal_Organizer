const express = require('express');
const router = express.Router();
const FinanceController = require('../controllers/financeController');

// Summary & Reports
router.get('/summary', FinanceController.getSummary);
router.get('/report/monthly', FinanceController.getMonthlyReport);
router.get('/budgets', FinanceController.getBudgets);
router.post('/budgets', FinanceController.upsertBudget);

// Wallets
router.get('/wallets', FinanceController.getWallets);
router.get('/wallets/:id', FinanceController.getWalletById);
router.post('/wallets', FinanceController.createWallet);
router.put('/wallets/:id', FinanceController.updateWallet);
router.delete('/wallets/:id', FinanceController.deleteWallet);

// Transactions
router.get('/transactions', FinanceController.getTransactions);
router.get('/transactions/:id', FinanceController.getTransactionById);
router.post('/transactions', FinanceController.createTransaction);
router.put('/transactions/:id', FinanceController.updateTransaction);
router.delete('/transactions/:id', FinanceController.deleteTransaction);

module.exports = router;
