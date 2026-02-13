/**
 * Get Users Controller
 * БАЙРШИЛ: Cashly.mn/Backend/src/controllers/admin/getUsersController.js
 * Бүх хэрэглэгчид харах, засах
 */

const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const Loan = require('../../models/Loan');
const logger = require('../../utils/logger');

/**
 * @route   GET /api/admin/users
 * @desc    Бүх хэрэглэгчид
 * @access  Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, kycStatus } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    // Search by phone or name
    if (search) {
      filter.$or = [
        { phoneNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (kycStatus) {
      filter.kycStatus = kycStatus;
    }

    const users = await User.find(filter)
      .select('phoneNumber name email kycStatus creditLimit creditScore status createdAt lastLogin')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { users }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Хэрэглэгчид татахад алдаа гарлаа'
    });
  }
};

/**
 * @route   GET /api/admin/user/:userId
 * @desc    Хэрэглэгчийн дэлгэрэнгүй мэдээлэл
 * @access  Admin
 */
exports.getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    // Хэтэвч
    const wallet = await Wallet.findOne({ user: userId });

    // Зээлүүд
    const loans = await Loan.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        user,
        wallet,
        loans,
        stats: {
          totalLoans: loans.length,
          activeLoans: loans.filter(l => ['active', 'extended', 'overdue'].includes(l.status)).length,
          completedLoans: loans.filter(l => l.status === 'completed').length
        }
      }
    });

  } catch (error) {
    logger.error('Get user detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Хэрэглэгчийн мэдээлэл татахад алдаа гарлаа'
    });
  }
};

/**
 * @route   PUT /api/admin/user/:userId/block
 * @desc    Хэрэглэгчийг блоклох
 * @access  Admin
 */
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    user.status = 'blocked';
    await user.save();

    logger.info(`User blocked: ${userId} - Reason: ${reason || 'N/A'}`);

    res.status(200).json({
      success: true,
      message: 'Хэрэглэгч блоклогдлоо',
      data: { user }
    });

  } catch (error) {
    logger.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Хэрэглэгч блоклоход алдаа гарлаа'
    });
  }
};

/**
 * @route   PUT /api/admin/user/:userId/unblock
 * @desc    Хэрэглэгчийг unblock хийх
 * @access  Admin
 */
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    user.status = 'active';
    await user.save();

    logger.info(`User unblocked: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Хэрэглэгч идэвхжүүллээ',
      data: { user }
    });

  } catch (error) {
    logger.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Хэрэглэгч идэвхжүүлэхэд алдаа гарлаа'
    });
  }
};

/**
 * @route   PUT /api/admin/user/:userId/update-bank
 * @desc    Хэрэглэгчийн банкны мэдээлэл засах
 * @access  Admin
 */
exports.updateUserBank = async (req, res) => {
  try {
    const { userId } = req.params;
    const { bankName, accountNumber, accountName } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    if (!user.personalInfo) {
      user.personalInfo = {};
    }

    user.personalInfo.bankInfo = {
      bankName: bankName || user.personalInfo.bankInfo?.bankName,
      accountNumber: accountNumber || user.personalInfo.bankInfo?.accountNumber,
      accountName: accountName || user.personalInfo.bankInfo?.accountName
    };

    await user.save();

    logger.info(`User bank info updated: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Банкны мэдээлэл шинэчлэгдлээ',
      data: {
        bankInfo: user.personalInfo.bankInfo
      }
    });

  } catch (error) {
    logger.error('Update user bank error:', error);
    res.status(500).json({
      success: false,
      message: 'Банкны мэдээлэл засахад алдаа гарлаа'
    });
  }
};