/**
 * Submit KYC Controller (Final Step)
 * Зургуудын URL-ийг хадгалаад KYC статусыг pending болгоно
 */

const User = require('../../models/User');
const logger = require('../../utils/logger');

exports.submitKYC = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // ✅ Эхлээд req.body-г бүтнээр харах
    logger.info('=== Submit KYC Request ===');
    logger.info('User ID:', userId);
    logger.info('req.body:', JSON.stringify(req.body, null, 2));
    logger.info('req.body keys:', Object.keys(req.body));
    
    const { idCardFront, idCardBack, selfie } = req.body;

    logger.info('Extracted values:', {
      idCardFront: idCardFront || 'MISSING',
      idCardBack: idCardBack || 'MISSING',
      selfie: selfie || 'MISSING'
    });

    if (!idCardFront || !idCardBack || !selfie) {
      logger.warn('KYC submission missing images:', { 
        idCardFront: !!idCardFront, 
        idCardBack: !!idCardBack, 
        selfie: !!selfie 
      });
      return res.status(400).json({
        success: false,
        message: 'Бүх зургууд шаардлагатай',
        missing: {
          idCardFront: !idCardFront,
          idCardBack: !idCardBack,
          selfie: !selfie
        },
        received: req.body
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    // documents хадгалах
    if (!user.personalInfo) {
      user.personalInfo = {};
    }

    user.personalInfo.documents = {
      idCardFront: {
        url: idCardFront,
        uploadedAt: new Date()
      },
      idCardBack: {
        url: idCardBack,
        uploadedAt: new Date()
      },
      selfie: {
        url: selfie,
        uploadedAt: new Date()
      }
    };

    // KYC статус pending болгох
    user.kycStatus = 'pending';
    user.kycSubmittedAt = new Date();

    await user.save();

    logger.info(`KYC submitted: User ${userId}`);

    res.status(200).json({
      success: true,
      message: 'KYC амжилттай илгээгдлээ. Админ баталгаажуулах болно.',
      data: {
        user: {
          id: user._id,
          kycStatus: user.kycStatus,
          kycSubmittedAt: user.kycSubmittedAt
        }
      }
    });

  } catch (error) {
    logger.error('Submit KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'KYC илгээхэд алдаа гарлаа'
    });
  }
};