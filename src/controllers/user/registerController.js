/**
 * Register Controller
 * Хэрэглэгч бүртгүүлэх
 */

const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const { generateToken } = require('../../utils/generateToken');
const logger = require('../../utils/logger');

/**
 * @route   POST /api/auth/register
 * @desc    Шинэ хэрэглэгч бүртгүүлэх
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { phoneNumber, password, name } = req.body;

    // Validation
    if (!phoneNumber || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Утасны дугаар, нууц үг, нэр шаардлагатай'
      });
    }

    // Утасны дугаар формат шалгах (8 оронтой)
    if (!/^[0-9]{8}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Утасны дугаар 8 оронтой байх ёстой'
      });
    }

    // Хэрэглэгч өмнө бүртгэгдсэн эсэх шалгах
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Энэ утасны дугаар аль хэдийн бүртгэгдсэн байна'
      });
    }

    // Нууц үг урт шалгах
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Нууц үг багадаа 6 тэмдэгттэй байх ёстой'
      });
    }

    // Хэрэглэгч үүсгэх
    const user = await User.create({
      phoneNumber,
      password,
      name
    });

    // Хэтэвч үүсгэх
    await Wallet.create({
      user: user._id
    });

    // Referral code үүсгэх
    user.referralCode = user.generateReferralCode();
    await user.save();

    logger.info(`New user registered: ${user._id} - ${phoneNumber}`);

    // JWT token үүсгэх
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Амжилттай бүртгүүллээ',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          kycStatus: user.kycStatus,
          creditLimit: user.creditLimit,
          referralCode: user.referralCode
        },
        token
      }
    });

  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Бүртгэл үүсгэхэд алдаа гарлаа'
    });
  }
};