/**
 * Approve/Reject Loan Controller
 * БАЙРШИЛ: Cashly.mn/Backend/src/controllers/admin/approveLoanController.js
 * Зээлийн хүсэлт зөвшөөрөх эсвэл татгалзах
 */

const Loan = require('../../models/Loan');
const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');
const { sendLoanApprovedNotification, sendLoanRejectedNotification } = require('../../services/notificationService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/admin/approve-loan/:loanId
 * @desc    Зээл зөвшөөрөх - хэтэвчинд мөнгө оруулна
 * @access  Admin
 */
exports.approveLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const adminId = req.admin._id;

    const loan = await Loan.findById(loanId).populate('user');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Зээл олдсонгүй'
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Зөвхөн pending статустай зээл зөвшөөрч болно'
      });
    }

    // User-ийн credit limit шалгах
    const user = await User.findById(loan.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    // Хэтэвч олох эсвэл үүсгэх
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: user._id });
    }

    // Зээлийн мөнгийг хэтэвчинд оруулах
    const balanceBefore = wallet.balance;
    wallet.balance += loan.principal;
    await wallet.save();

    // Transaction үүсгэх
    const transaction = await Transaction.create({
      user: user._id,
      type: 'loan_disbursement',
      amount: loan.principal,
      status: 'completed',
      balanceBefore,
      balanceAfter: wallet.balance,
      description: `Зээл олгогдсон - ${loan.loanNumber}`,
      loan: loan._id,
      processedBy: adminId,
      processedAt: new Date(),
      completedAt: new Date()
    });

    // Loan update
    loan.status = 'approved';
    loan.approvedBy = adminId;
    loan.approvedAt = new Date();
    loan.disbursedAt = new Date();
    await loan.save();

    // Мэдэгдэл илгээх
    await sendLoanApprovedNotification(user._id, loan._id, loan.principal);

    logger.info(`Loan approved: ${loanId} - User: ${user._id} - Amount: ${loan.principal} - By Admin: ${adminId}`);

    res.status(200).json({
      success: true,
      message: `Зээл зөвшөөрөгдөж хэтэвчинд ${loan.principal.toLocaleString()}₮ орлоо`,
      data: {
        loan: {
          id: loan._id,
          loanNumber: loan.loanNumber,
          principal: loan.principal,
          status: loan.status,
          approvedAt: loan.approvedAt
        },
        transaction: {
          id: transaction._id,
          transactionId: transaction.transactionId
        }
      }
    });

  } catch (error) {
    logger.error('Approve loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээл зөвшөөрөхөд алдаа гарлаа'
    });
  }
};

/**
 * @route   POST /api/admin/reject-loan/:loanId
 * @desc    Зээл татгалзах
 * @access  Admin
 */
exports.rejectLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin._id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Татгалзах шалтгаан шаардлагатай'
      });
    }

    const loan = await Loan.findById(loanId).populate('user');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Зээл олдсонгүй'
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Зөвхөн pending статустай зээл татгалзаж болно'
      });
    }

    loan.status = 'rejected';
    loan.rejectedReason = reason;
    loan.rejectedAt = new Date();
    await loan.save();

    // Мэдэгдэл илгээх
    await sendLoanRejectedNotification(loan.user._id, loan._id, reason);

    logger.info(`Loan rejected: ${loanId} - By Admin: ${adminId} - Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Зээл татгалзагдлаа',
      data: {
        loan: {
          id: loan._id,
          loanNumber: loan.loanNumber,
          status: loan.status,
          rejectedReason: loan.rejectedReason,
          rejectedAt: loan.rejectedAt
        }
      }
    });

  } catch (error) {
    logger.error('Reject loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээл татгалзахад алдаа гарлаа'
    });
  }
};