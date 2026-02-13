/**
 * Set Credit Limit Controller
 * БАЙРШИЛ: src/controllers/admin/setCreditLimitController.js
 * Хэрэглэгчийн зээлийн эрх тогтоох
 */

const User = require('../../models/User');
const { sendCreditLimitSetNotification } = require('../../services/notificationService');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/admin/set-credit-limit/:userId
 * @desc    Хэрэглэгчийн зээлийн эрх тогтоох
 * @access  Admin (canSetCreditLimit)
 */
exports.setCreditLimit = async (req, res) => {
  try {
    const { userId } = req.params;
    const { creditLimit } = req.body;
    const adminId = req.admin._id;

    if (creditLimit === undefined || creditLimit === null) {
      return res.status(400).json({
        success: false,
        message: 'Зээлийн эрхийн дүн шаардлагатай'
      });
    }

    if (creditLimit < 0) {
      return res.status(400).json({
        success: false,
        message: 'Зээлийн эрх 0-ээс бага байж болохгүй'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    if (!user.creditCheckPaid) {
      return res.status(400).json({
        success: false,
        message: 'Хэрэглэгч зээлийн эрх шалгах төлбөр төлөөгүй байна'
      });
    }

    if (user.kycStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Хэрэглэгчийн KYC баталгаажаагүй байна'
      });
    }

    user.creditLimit = creditLimit;
    user.creditLimitSetAt = new Date();
    user.creditLimitSetBy = adminId;
    await user.save();

    // Мэдэгдэл илгээх
    if (creditLimit > 0) {
      await sendCreditLimitSetNotification(userId, creditLimit);
    }

    logger.info(`Credit limit set: User ${userId} - Limit: ${creditLimit} - By Admin: ${adminId}`);

    res.status(200).json({
      success: true,
      message: `Зээлийн эрх ${creditLimit.toLocaleString()}₮ болгон тогтоогдлоо`,
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          creditLimit: user.creditLimit,
          creditLimitSetAt: user.creditLimitSetAt
        }
      }
    });

  } catch (error) {
    logger.error('Set credit limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээлийн эрх тогтооход алдаа гарлаа'
    });
  }
};

/**
 * @route   GET /api/admin/users-paid-credit-check
 * @desc    3000₮ зээлийн эрх шалгах төлбөр төлсөн хэрэглэгчид
 * @access  Admin (canSetCreditLimit)
 */
exports.getUsersPaidCreditCheck = async (req, res) => {
  try {
    const { page = 1, limit = 20, creditLimitSet } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      creditCheckPaid: true,
      kycStatus: 'approved'
    };

    // Зээлийн эрх тогтоогдсон / тогтоогдоогүй шүүх
    if (creditLimitSet === 'true') {
      filter.creditLimit = { $gt: 0 };
    } else if (creditLimitSet === 'false') {
      filter.creditLimit = 0;
    }

    const users = await User.find(filter)
      .select('phoneNumber name creditCheckPaid creditCheckPaidAt creditLimit creditLimitSetAt kycStatus')
      .sort({ creditCheckPaidAt: -1 })
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
    logger.error('Get users paid credit check error:', error);
    res.status(500).json({
      success: false,
      message: 'Хэрэглэгчид татахад алдаа гарлаа'
    });
  }
};