/**
 * Loan Routes
 * БАЙРШИЛ: Cashly.mn/Backend/src/routes/loanRoutes.js
 * Зээлийн бүх route-ууд
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { loanApplicationLimiter } = require('../middlewares/rateLimiter');
const { applyLoan } = require('../controllers/loan/applyLoanController');
const { getUserLoans, getActiveLoans, getLoanDetails } = require('../controllers/loan/getUserLoansController');
const { extendLoan } = require('../controllers/loan/extendLoanController');
const { repayLoan } = require('../controllers/loan/repayLoanController');

// Бүх route-д authentication шаардлагатай
router.use(protect);

// POST /api/loan/apply - Зээлийн хүсэлт илгээх
router.post('/apply', loanApplicationLimiter, applyLoan);

// GET /api/loan/my-loans - Миний бүх зээлүүд
router.get('/my-loans', getUserLoans);

// GET /api/loan/active-loans - Идэвхтэй зээлүүд
router.get('/active-loans', getActiveLoans);

// GET /api/loan/:loanId - Зээлийн дэлгэрэнгүй
router.get('/:loanId', getLoanDetails);

// POST /api/loan/extend/:loanId - Зээл сунгах
router.post('/extend/:loanId', extendLoan);

// POST /api/loan/repay/:loanId - Зээл төлөх
router.post('/repay/:loanId', repayLoan);

module.exports = router;