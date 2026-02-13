/**
 * Approve/Reject Withdrawal Controller
 * БАЙРШИЛ: Cashly.mn/Backend/src/controllers/admin/approveWithdrawalController.js
 * Татах хүсэлт зөвшөөрөх эсвэл татгалзах
 */

const WithdrawalRequest = require('../../models/WithdrawalRequest');
const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');
const { sendWithdrawalApprovedNotification } = require('../../services/notificationService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/admin/approve-withdrawal/:withdrawalId
 * @desc    Татах хүсэлт зөвшөөрөх
 * @access  Admin
 */
exports.approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const adminId = req.admin._id;

    const withdrawal = await WithdrawalRequest.findById(withdrawalId).populate('user');

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Татах хүсэлт олдсонгүй'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Зөвхөн pending статустай хүсэлт зөвшөөрч болно'
      });
    }

    // Хэтэвч олох
    const wallet = await Wallet.findOne({ user: withdrawal.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Хэтэвч олдсонгүй'
      });
    }

    // Frozen balance-аас хасах
    const balanceBefore = wallet.balance;
    wallet.balance -= withdrawal.amount;
    wallet.frozenBalance -= withdrawal.amount;
    wallet.totalWithdrawn += withdrawal.amount;
    wallet.lastWithdrawalAt = new Date();
    await wallet.save();

    // Transaction үүсгэх
    const transaction = await Transaction.create({
      user: withdrawal.user._id,
      type: 'withdrawal',
      amount: withdrawal.amount,
      status: 'completed',
      balanceBefore,
      balanceAfter: wallet.balance,
      description: `Данс руу мөнгө шилжүүлэх - ${withdrawal.bankDetails.bankName}`,
      bankDetails: withdrawal.bankDetails,
      withdrawalRequest: withdrawal._id,
      processedBy: adminId,
      processedAt: new Date(),
      completedAt: new Date()
    });

    // Withdrawal update
    withdrawal.status = 'completed';
    withdrawal.approvedBy = adminId;
    withdrawal.approvedAt = new Date();
    withdrawal.completedAt = new Date();
    withdrawal.transaction = transaction._id;
    await withdrawal.save();

    // Мэдэгдэл илгээх
    await sendWithdrawalApprovedNotification(withdrawal.user._id, withdrawal._id, withdrawal.amount);

    logger.info(`Withdrawal approved: ${withdrawalId} - User: ${withdrawal.user._id} - Amount: ${withdrawal.amount} - By Admin: ${adminId}`);

    res.status(200).json({
      success: true,
      message: `Татах хүсэлт зөвшөөрөгдлөө. ${withdrawal.amount.toLocaleString()}₮ данс руу шилжүүлэгдэж байна`,
      data: {
        withdrawal: {
          id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          approvedAt: withdrawal.approvedAt,
          bankDetails: withdrawal.bankDetails
        },
        transaction: {
          id: transaction._id,
          transactionId: transaction.transactionId
        }
      }
    });

  } catch (error) {
    logger.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Татах хүсэлт зөвшөөрөхөд алдаа гарлаа'
    });
  }
};

/**
 * @route   POST /api/admin/reject-withdrawal/:withdrawalId
 * @desc    Татах хүсэлт татгалзах
 * @access  Admin
 */
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin._id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Татгалзах шалтгаан шаардлагатай'
      });
    }

    const withdrawal = await WithdrawalRequest.findById(withdrawalId).populate('user');

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Татах хүсэлт олдсонгүй'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Зөвхөн pending статустай хүсэлт татгалзаж болно'
      });
    }

    // Хэтэвч олох - frozen balance буцааж өгөх
    const wallet = await Wallet.findOne({ user: withdrawal.user._id });

    if (wallet) {
      wallet.frozenBalance -= withdrawal.amount;
      await wallet.save();
    }

    // Withdrawal update
    withdrawal.status = 'rejected';
    withdrawal.rejectedReason = reason;
    withdrawal.rejectedBy = adminId;
    withdrawal.rejectedAt = new Date();
    await withdrawal.save();

    logger.info(`Withdrawal rejected: ${withdrawalId} - By Admin: ${adminId} - Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Татах хүсэлт татгалзагдлаа',
      data: {
        withdrawal: {
          id: withdrawal._id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          rejectedReason: withdrawal.rejectedReason,
          rejectedAt: withdrawal.rejectedAt
        }
      }
    });

  } catch (error) {
    logger.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Татах хүсэлт татгалзахад алдаа гарлаа'
    });
  }
};