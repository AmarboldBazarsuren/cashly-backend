/**
 * Login Controller
 * Хэрэглэгч нэвтрэх
 */

const User = require('../../models/User');
const { generateToken } = require('../../utils/generateToken');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/auth/login
 * @desc    Хэрэглэгч нэвтрэх
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Validation
    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Утасны дугаар болон нууц үг шаардлагатай'
      });
    }

    // Хэрэглэгч олох (password оруулна)
    const user = await User.findOne({ phoneNumber }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Утасны дугаар эсвэл нууц үг буруу байна'
      });
    }

    // Password шалгах
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Утасны дугаар эсвэл нууц үг буруу байна'
      });
    }

    // Хэрэглэгч блоклогдсон эсэх шалгах
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Таны хэрэглэгч блоклогдсон байна. Холбогдох: support@cashly.mn'
      });
    }

    // Last login update
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user._id} - ${phoneNumber}`);

    // JWT token үүсгэх
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Амжилттай нэвтэрлээ',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          email: user.email,
          kycStatus: user.kycStatus,
          creditCheckPaid: user.creditCheckPaid,
          creditLimit: user.creditLimit,
          creditScore: user.creditScore,
          status: user.status
        },
        token
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Нэвтрэхэд алдаа гарлаа'
    });
  }
};