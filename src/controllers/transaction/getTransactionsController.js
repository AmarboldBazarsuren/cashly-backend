/**
 * Get Transactions Controller
 * БАЙРШИЛ: src/controllers/transaction/getTransactionsController.js
 * Хэрэглэгчийн гүйлгээний түүх харах
 */

const Transaction = require('../../models/Transaction');
const logger = require('../../utils/logger');

/**
 * @route   GET /api/transaction/history
 * @desc    Хэрэглэгчийн гүйлгээний түүх
 * @access  Private (User)
 */
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    // Шүүлтүүр
    const filter = { user: userId };
    if (type) {
      filter.type = type;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('loan', 'loanNumber principal term')
      .select('-user -metadata');

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { transactions }
    });

  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Гүйлгээний түүх татахад алдаа гарлаа'
    });
  }
};

/**
 * @route   GET /api/transaction/:transactionId
 * @desc    Тодорхой гүйлгээний дэлгэрэнгүй мэдээлэл
 * @access  Private (User)
 */
exports.getTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user._id;

    // transactionId нь MongoDB _id эсвэл custom transactionId байж болно
    const transaction = await Transaction.findOne({
      $or: [
        { _id: transactionId.match(/^[0-9a-fA-F]{24}$/) ? transactionId : null },
        { transactionId: transactionId }
      ],
      user: userId
    })
      .populate('loan', 'loanNumber principal term interestRate status dueDate')
      .populate('withdrawalRequest', 'bankDetails status');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Гүйлгээ олдсонгүй'
      });
    }

    res.status(200).json({
      success: true,
      data: { transaction }
    });

  } catch (error) {
    logger.error('Get transaction details error:', error);
    res.status(500).json({
      success: false,
      message: 'Гүйлгээний мэдээлэл татахад алдаа гарлаа'
    });
  }
};