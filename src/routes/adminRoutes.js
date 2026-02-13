/**
 * Admin Routes
 * БАЙРШИЛ: Cashly.mn/Backend/src/routes/adminRoutes.js
 * Admin panel-ийн бүх route-ууд
 */

const express = require('express');
const router = express.Router();
const { adminProtect, authorize } = require('../middlewares/auth');

// Controllers
const { adminLogin } = require('../controllers/admin/adminLoginController');
const { getDashboardStats } = require('../controllers/admin/dashboardController');
const { getPendingKYC, getKYCDetail } = require('../controllers/admin/pendingKYCController');
const { approveKYC, rejectKYC } = require('../controllers/admin/approveKYCController');
const { setCreditLimit, getUsersPaidCreditCheck } = require('../controllers/admin/setCreditLimitController');
const { getPendingLoans, getLoanDetail, getActiveLoans } = require('../controllers/admin/pendingLoansController');
const { approveLoan, rejectLoan } = require('../controllers/admin/approveLoanController');
const { getPendingWithdrawals, getWithdrawalDetail } = require('../controllers/admin/pendingWithdrawalsController');
const { approveWithdrawal, rejectWithdrawal } = require('../controllers/admin/approveWithdrawalController');
const { getAllUsers, getUserDetail, blockUser, unblockUser, updateUserBank } = require('../controllers/admin/getUsersController');

// Public routes
// POST /api/admin/login - Админ нэвтрэх
router.post('/login', adminLogin);

// Admin authentication шаардлагатай бүх route
router.use(adminProtect);

// Dashboard
// GET /api/admin/dashboard - Dashboard статистик
router.get('/dashboard', getDashboardStats);

// KYC Management
// GET /api/admin/pending-kyc - Pending KYC хүсэлтүүд
router.get('/pending-kyc', authorize('canApproveKYC'), getPendingKYC);

// GET /api/admin/kyc-detail/:userId - KYC дэлгэрэнгүй
router.get('/kyc-detail/:userId', authorize('canApproveKYC'), getKYCDetail);

// POST /api/admin/approve-kyc/:userId - KYC зөвшөөрөх
router.post('/approve-kyc/:userId', authorize('canApproveKYC'), approveKYC);

// POST /api/admin/reject-kyc/:userId - KYC татгалзах
router.post('/reject-kyc/:userId', authorize('canApproveKYC'), rejectKYC);

// Credit Limit Management
// GET /api/admin/users-paid-credit-check - 3000₮ төлсөн хэрэглэгчид
router.get('/users-paid-credit-check', authorize('canSetCreditLimit'), getUsersPaidCreditCheck);

// POST /api/admin/set-credit-limit/:userId - Зээлийн эрх тогтоох
router.post('/set-credit-limit/:userId', authorize('canSetCreditLimit'), setCreditLimit);

// Loan Management
// GET /api/admin/pending-loans - Pending зээлийн хүсэлтүүд
router.get('/pending-loans', authorize('canApproveLoan'), getPendingLoans);

// GET /api/admin/active-loans - Идэвхтэй зээлүүд
router.get('/active-loans', authorize('canViewReports'), getActiveLoans);

// GET /api/admin/loan-detail/:loanId - Зээлийн дэлгэрэнгүй
router.get('/loan-detail/:loanId', authorize('canApproveLoan'), getLoanDetail);

// POST /api/admin/approve-loan/:loanId - Зээл зөвшөөрөх
router.post('/approve-loan/:loanId', authorize('canApproveLoan'), approveLoan);

// POST /api/admin/reject-loan/:loanId - Зээл татгалзах
router.post('/reject-loan/:loanId', authorize('canApproveLoan'), rejectLoan);

// Withdrawal Management
// GET /api/admin/pending-withdrawals - Pending татах хүсэлтүүд
router.get('/pending-withdrawals', authorize('canApproveWithdrawal'), getPendingWithdrawals);

// GET /api/admin/withdrawal-detail/:withdrawalId - Татах хүсэлтийн дэлгэрэнгүй
router.get('/withdrawal-detail/:withdrawalId', authorize('canApproveWithdrawal'), getWithdrawalDetail);

// POST /api/admin/approve-withdrawal/:withdrawalId - Татах хүсэлт зөвшөөрөх
router.post('/approve-withdrawal/:withdrawalId', authorize('canApproveWithdrawal'), approveWithdrawal);

// POST /api/admin/reject-withdrawal/:withdrawalId - Татах хүсэлт татгалзах
router.post('/reject-withdrawal/:withdrawalId', authorize('canApproveWithdrawal'), rejectWithdrawal);

// User Management
// GET /api/admin/users - Бүх хэрэглэгчид
router.get('/users', authorize('canViewReports'), getAllUsers);

// GET /api/admin/user/:userId - Хэрэглэгчийн дэлгэрэнгүй
router.get('/user/:userId', authorize('canViewReports'), getUserDetail);

// PUT /api/admin/user/:userId/block - Хэрэглэгчийг блоклох
router.put('/user/:userId/block', authorize('canBlockUser'), blockUser);

// PUT /api/admin/user/:userId/unblock - Хэрэглэгчийг идэвхжүүлэх
router.put('/user/:userId/unblock', authorize('canBlockUser'), unblockUser);

// PUT /api/admin/user/:userId/update-bank - Банкны мэдээлэл засах
router.put('/user/:userId/update-bank', authorize('canApproveWithdrawal'), updateUserBank);

module.exports = router;