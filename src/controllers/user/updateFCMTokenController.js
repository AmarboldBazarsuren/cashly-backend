const User = require('../../models/User'); 

const logger = require('../../utils/logger');

exports.updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token шаардлагатай'
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    user.fcmToken = fcmToken;
    await user.save();

    logger.info(`FCM token updated for user: ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'FCM token амжилттай хадгалагдлаа'
    });

  } catch (error) {
    logger.error('Update FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Токен хадгалахад алдаа гарлаа'
    });
  }
};
