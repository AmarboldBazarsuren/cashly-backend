/**
 * Wallet Routes
 * БАЙРШИЛ: Cashly.mn/Backend/src/routes/walletRoutes.js
 * Хэтэвчний бүх route-ууд
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { withdrawalLimiter } = require('../middlewares/rateLimiter');
const { getWallet } = require('../controllers/wallet/getWalletController');
const { deposit } = require('../controllers/wallet/depositController');
const { requestWithdrawal, getWithdrawalRequests } = require('../controllers/wallet/withdrawalRequestController');

// Бүх route-д authentication шаардлагатай
router.use(protect);

// GET /api/wallet/balance - Хэтэвчний үлдэгдэл
router.get('/balance', getWallet);

// POST /api/wallet/deposit - Цэнэглэлт (test/manual)
router.post('/deposit', deposit);

// POST /api/wallet/request-withdrawal - Татах хүсэлт илгээх
router.post('/request-withdrawal', withdrawalLimiter, requestWithdrawal);

// GET /api/wallet/withdrawal-requests - Миний татах хүсэлтүүд
router.get('/withdrawal-requests', getWithdrawalRequests);

module.exports = router;