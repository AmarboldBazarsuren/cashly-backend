/**
 * Dashboard Controller
 * БАЙРШИЛ: Cashly.mn/Backend/src/controllers/admin/dashboardController.js
 * Admin panel-ийн dashboard статистик
 */

const User = require('../../models/User');
const Loan = require('../../models/Loan');
const Transaction = require('../../models/Transaction');
const WithdrawalRequest = require('../../models/WithdrawalRequest');
const Wallet = require('../../models/Wallet');
const logger = require('../../utils/logger');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Dashboard статистик
 * @access  Admin
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Нийт хэрэглэгчид
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const blockedUsers = await User.countDocuments({ status: 'blocked' });

    // KYC статистик
    const pendingKYC = await User.countDocuments({ kycStatus: 'pending' });
    const approvedKYC = await User.countDocuments({ kycStatus: 'approved' });
    const rejectedKYC = await User.countDocuments({ kycStatus: 'rejected' });

    // Зээлийн статистик
    const totalLoans = await Loan.countDocuments();
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });
    const activeLoans = await Loan.countDocuments({ status: { $in: ['active', 'extended'] } });
    const completedLoans = await Loan.countDocuments({ status: 'completed' });
    const overdueLoans = await Loan.countDocuments({ status: 'overdue' });

    // Зээлийн дүн
    const loanAmountStats = await Loan.aggregate([
      {
        $group: {
          _id: null,
          totalDisbursed: {
            $sum: {
              $cond: [
                { $in: ['$status', ['approved', 'active', 'extended', 'completed', 'overdue']] },
                '$principal',
                0
              ]
            }
          },
          totalOutstanding: {
            $sum: {
              $cond: [
                { $in: ['$status', ['active', 'extended', 'overdue']] },
                '$remainingAmount',
                0
              ]
            }
          },
          totalCollected: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    // Татах хүсэлтүүд
    const pendingWithdrawals = await WithdrawalRequest.countDocuments({ status: 'pending' });
    const totalWithdrawals = await WithdrawalRequest.countDocuments();

    // Хэтэвчний нийт үлдэгдэл
    const walletStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          totalDeposited: { $sum: '$totalDeposited' },
          totalWithdrawn: { $sum: '$totalWithdrawn' }
        }
      }
    ]);

    // Өнөөдрийн гүйлгээ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = await Transaction.countDocuments({
      createdAt: { $gte: today }
    });

    // Өнөөдрийн шинэ хэрэглэгч
    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: today }
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          blocked: blockedUsers,
          todayNew: todayNewUsers
        },
        kyc: {
          pending: pendingKYC,
          approved: approvedKYC,
          rejected: rejectedKYC
        },
        loans: {
          total: totalLoans,
          pending: pendingLoans,
          active: activeLoans,
          completed: completedLoans,
          overdue: overdueLoans
        },
        loanAmounts: {
          totalDisbursed: loanAmountStats[0]?.totalDisbursed || 0,
          totalOutstanding: loanAmountStats[0]?.totalOutstanding || 0,
          totalCollected: loanAmountStats[0]?.totalCollected || 0
        },
        withdrawals: {
          pending: pendingWithdrawals,
          total: totalWithdrawals
        },
        wallet: {
          totalBalance: walletStats[0]?.totalBalance || 0,
          totalDeposited: walletStats[0]?.totalDeposited || 0,
          totalWithdrawn: walletStats[0]?.totalWithdrawn || 0
        },
        today: {
          transactions: todayTransactions,
          newUsers: todayNewUsers
        }
      }
    });

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Статистик татахад алдаа гарлаа'
    });
  }
};