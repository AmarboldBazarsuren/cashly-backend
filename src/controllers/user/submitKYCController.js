const User = require('../../models/User');
const { uploadImage } = require('../../utils/imageUpload');
const logger = require('../../utils/logger');

exports.submitKYC = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      education, employmentStatus, companyName, position, monthlyIncome,
      city, district, khoroo, building, apartment, fullAddress,
      bankName, accountNumber, accountName, emergencyContacts,
      registerNumber, idCardFrontBase64, idCardBackBase64, selfieBase64
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    if (user.kycStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Хувийн мэдээлэл аль хэдийн баталгаажсан байна'
      });
    }

    if (user.kycStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Хувийн мэдээлэл хянагдаж байна. Түр хүлээнэ үү'
      });
    }

    if (!idCardFrontBase64 || !idCardBackBase64 || !selfieBase64) {
      return res.status(400).json({
        success: false,
        message: 'Иргэний үнэмлэхний урд, ард болон селфи зураг шаардлагатай'
      });
    }

    if (registerNumber && !/^[А-ЯӨҮ]{2}[0-9]{8}$/.test(registerNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Регистрийн дугаар буруу байна (Жишээ: УБ12345678)'
      });
    }

    let idCardFront, idCardBack, selfie;

    try {
      idCardFront = await uploadImage(idCardFrontBase64, 'cashly/kyc/id-cards');
      idCardBack = await uploadImage(idCardBackBase64, 'cashly/kyc/id-cards');
      selfie = await uploadImage(selfieBase64, 'cashly/kyc/selfies');
    } catch (uploadError) {
      logger.error('Image upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Зураг upload хийхэд алдаа гарлаа'
      });
    }

    user.personalInfo = {
      education: education || '',
      employment: {
        status: employmentStatus || '',
        companyName: companyName || '',
        position: position || '',
        monthlyIncome: monthlyIncome || 0
      },
      address: {
        city: city || '',
        district: district || '',
        khoroo: khoroo || '',
        building: building || '',
        apartment: apartment || '',
        fullAddress: fullAddress || ''
      },
      bankInfo: {
        bankName: bankName || '',
        accountNumber: accountNumber || '',
        accountName: accountName || ''
      },
      emergencyContacts: emergencyContacts || [],
      documents: {
        idCardFront: {
          url: idCardFront.url,
          publicId: idCardFront.publicId,
          uploadedAt: new Date()
        },
        idCardBack: {
          url: idCardBack.url,
          publicId: idCardBack.publicId,
          uploadedAt: new Date()
        },
        selfie: {
          url: selfie.url,
          publicId: selfie.publicId,
          uploadedAt: new Date()
        }
      },
      registerNumber: registerNumber || ''
    };

    user.kycStatus = 'pending';
    user.kycSubmittedAt = new Date();

    await user.save();

    logger.info(`KYC submitted by user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Хувийн мэдээлэл амжилттай илгээгдлээ. Админ баталгаажуулах болно',
      data: {
        kycStatus: user.kycStatus,
        kycSubmittedAt: user.kycSubmittedAt
      }
    });

  } catch (error) {
    logger.error('Submit KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Хувийн мэдээлэл илгээхэд алдаа гарлаа'
    });
  }
};
