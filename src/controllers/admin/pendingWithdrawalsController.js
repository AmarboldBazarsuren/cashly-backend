/**
 * Pending Withdrawals Controller
 * БАЙРШИЛ: Cashly.mn/Backend/src/controllers/admin/pendingWithdrawalsController.js
 * Татах хүсэлтүүд харах
 */

const WithdrawalRequest = require('../../models/WithdrawalRequest');
const logger = require('../../utils/logger');

/**
 * @route   GET /api/admin/pending-withdrawals
 * @desc    Хүлээгдэж буй татах хүсэлтүүд
 * @access  Admin
 */
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    
    if (status === 'pending') {
      filter.status = 'pending';
    } else if (status === 'all') {
      filter.status = { $in: ['pending', 'approved', 'rejected', 'completed'] };
    }

    const withdrawals = await WithdrawalRequest.find(filter)
      .populate('user', 'phoneNumber name personalInfo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await WithdrawalRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { withdrawals }
    });

  } catch (error) {
    logger.error('Get pending withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Татах хүсэлт татахад алдаа гарлаа'
    });
  }
};

/**
 * @route   GET /api/admin/withdrawal-detail/:withdrawalId
 * @desc    Татах хүсэлтийн дэлгэрэнгүй
 * @access  Admin
 */
exports.getWithdrawalDetail = async (req, res) => {
  try {
    const { withdrawalId } = req.params;

    const withdrawal = await WithdrawalRequest.findById(withdrawalId)
      .populate('user', 'phoneNumber name email personalInfo')
      .populate('approvedBy', 'fullName username')
      .populate('rejectedBy', 'fullName username');

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Татах хүсэлт олдсонгүй'
      });
    }

    res.status(200).json({
      success: true,
      data: { withdrawal }
    });

  } catch (error) {
    logger.error('Get withdrawal detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Мэдээлэл татахад алдаа гарлаа'
    });
  }
};