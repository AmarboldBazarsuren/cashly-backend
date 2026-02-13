
const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const logger = require('../../utils/logger');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          email: user.email,
          personalInfo: user.personalInfo,
          kycStatus: user.kycStatus,
          kycSubmittedAt: user.kycSubmittedAt,
          kycApprovedAt: user.kycApprovedAt,
          kycRejectedReason: user.kycRejectedReason,
          creditCheckPaid: user.creditCheckPaid,
          creditCheckPaidAt: user.creditCheckPaidAt,
          creditLimit: user.creditLimit,
          creditLimitSetAt: user.creditLimitSetAt,
          creditScore: user.creditScore,
          status: user.status,
          referralCode: user.referralCode,
          createdAt: user.createdAt
        },
        wallet: {
          balance: wallet?.balance || 0,
          frozenBalance: wallet?.frozenBalance || 0,
          availableBalance: (wallet?.balance || 0) - (wallet?.frozenBalance || 0),
          totalDeposited: wallet?.totalDeposited || 0,
          totalWithdrawn: wallet?.totalWithdrawn || 0
        }
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Профайл татахад алдаа гарлаа'
    });
  }
};
