
const User = require('../../models/User');
const { sendKYCApprovedNotification, sendKYCRejectedNotification } = require('../../services/notificationService');
const logger = require('../../utils/logger');

exports.approveKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.admin._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    if (user.kycStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'KYC статус pending биш байна'
      });
    }

    user.kycStatus = 'approved';
    user.kycApprovedAt = new Date();
    await user.save();

    await sendKYCApprovedNotification(userId);

    logger.info('KYC approved: User ' + userId + ' by Admin ' + adminId);

    res.status(200).json({
      success: true,
      message: 'KYC амжилттай зөвшөөрөгдлөө',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          kycStatus: user.kycStatus,
          kycApprovedAt: user.kycApprovedAt
        }
      }
    });

  } catch (error) {
    logger.error('Approve KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'KYC зөвшөөрөхөд алдаа гарлаа'
    });
  }
};

exports.rejectKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin._id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Татгалзах шалтгаан шаардлагатай'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    if (user.kycStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'KYC статус pending биш байна'
      });
    }

    user.kycStatus = 'rejected';
    user.kycRejectedReason = reason;
    await user.save();

    await sendKYCRejectedNotification(userId, reason);

    logger.info('KYC rejected: User ' + userId + ' by Admin ' + adminId + ' - Reason: ' + reason);

    res.status(200).json({
      success: true,
      message: 'KYC татгалзагдлаа',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          kycStatus: user.kycStatus,
          kycRejectedReason: user.kycRejectedReason
        }
      }
    });

  } catch (error) {
    logger.error('Reject KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'KYC татгалзахад алдаа гарлаа'
    });
  }
};
