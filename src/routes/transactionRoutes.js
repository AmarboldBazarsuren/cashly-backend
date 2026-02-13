/**
 * Transaction Routes
 * БАЙРШИЛ: Cashly.mn/Backend/src/routes/transactionRoutes.js
 * Гүйлгээний түүх route-ууд
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getTransactions, getTransactionDetails } = require('../controllers/transaction/getTransactionsController');

// Бүх route-д authentication шаардлагатай
router.use(protect);

// GET /api/transaction/history - Гүйлгээний түүх
router.get('/history', getTransactions);

// GET /api/transaction/:transactionId - Гүйлгээний дэлгэрэнгүй
router.get('/:transactionId', getTransactionDetails);

module.exports = router;