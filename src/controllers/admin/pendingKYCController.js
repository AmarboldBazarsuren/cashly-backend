const User = require('../../models/User');
const logger = require('../../utils/logger');

exports.getPendingKYC = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    
    if (status === 'pending') {
      filter.kycStatus = 'pending';
    } else if (status === 'all') {
filter.kycStatus = { $in: ['pending', 'approved', 'rejected'] };    }

    const users = await User.find(filter)
      .select('phoneNumber name personalInfo kycStatus kycSubmittedAt kycApprovedAt kycRejectedReason createdAt')
      .sort({ kycSubmittedAt: -1 })
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
    logger.error('Get pending KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Хүсэлт татахад алдаа гарлаа'
    });
  }
};

exports.getKYCDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('phoneNumber name email personalInfo kycStatus kycSubmittedAt kycApprovedAt kycRejectedReason creditCheckPaid creditLimit createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Get KYC detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Мэдээлэл татахад алдаа гарлаа'
    });
  }
};
