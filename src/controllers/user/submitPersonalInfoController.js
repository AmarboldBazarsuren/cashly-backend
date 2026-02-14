/**
 * Submit Personal Info Controller
 * KYC-ийн өмнөх алхам - хувийн мэдээлэл хадгалах
 */

const User = require('../../models/User');
const { uploadImage } = require('../../utils/imageUpload');
const logger = require('../../utils/logger');

/**
 * Хувийн мэдээлэл хадгалах (баримт бичиггүйгээр)
 */
/**
 * Submit Personal Info Controller (Step 1 - KYC without documents)
 * Зөвхөн хувийн мэдээлэл хадгална, баримт бичиг оруулахгүй
 */


exports.submitPersonalInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      lastName, firstName, registerLetter1, registerLetter2, registerNumber,
      gender, birthDate, education, employmentStatus, companyName, position,
      monthlyIncome, bankName, accountNumber, accountName, city, district,
      khoroo, building, apartment, fullAddress, emergencyName,
      emergencyRelationship, emergencyPhone
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    // personalInfo update - баримт бичиг оруулахгүй
    if (!user.personalInfo) {
      user.personalInfo = {};
    }

    // Регистр бүтээх
    const fullRegister = (registerLetter1 || '') + (registerLetter2 || '') + (registerNumber || '');

    user.personalInfo.lastName = lastName || user.personalInfo.lastName || '';
    user.personalInfo.firstName = firstName || user.personalInfo.firstName || '';
    user.personalInfo.registerNumber = fullRegister || user.personalInfo.registerNumber || '';
    user.personalInfo.gender = gender || user.personalInfo.gender || '';
    user.personalInfo.birthDate = birthDate || user.personalInfo.birthDate || '';
    user.personalInfo.education = education || user.personalInfo.education || '';

    user.personalInfo.employment = {
      status: employmentStatus || user.personalInfo.employment?.status || '',
      companyName: companyName || user.personalInfo.employment?.companyName || '',
      position: position || user.personalInfo.employment?.position || '',
      monthlyIncome: monthlyIncome || user.personalInfo.employment?.monthlyIncome || 0
    };

    user.personalInfo.address = {
      city: city || user.personalInfo.address?.city || '',
      district: district || user.personalInfo.address?.district || '',
      khoroo: khoroo || user.personalInfo.address?.khoroo || '',
      building: building || user.personalInfo.address?.building || '',
      apartment: apartment || user.personalInfo.address?.apartment || '',
      fullAddress: fullAddress || user.personalInfo.address?.fullAddress || ''
    };

    user.personalInfo.bankInfo = {
      bankName: bankName || user.personalInfo.bankInfo?.bankName || '',
      accountNumber: accountNumber || user.personalInfo.bankInfo?.accountNumber || '',
      accountName: accountName || user.personalInfo.bankInfo?.accountName || ''
    };

    // Emergency contact
    if (emergencyName && emergencyPhone) {
      user.personalInfo.emergencyContacts = [{
        name: emergencyName,
        relationship: emergencyRelationship || 'Бусад',
        phoneNumber: emergencyPhone
      }];
    }

    // documents field-ийг огт хөндөхгүй (Step 2-д хийнэ)

    await user.save();

    logger.info(`Personal info saved: User ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Хувийн мэдээлэл амжилттай хадгалагдлаа',
      data: {
        user: {
          id: user._id,
          personalInfo: user.personalInfo,
          kycStatus: user.kycStatus
        }
      }
    });

  } catch (error) {
    logger.error('Submit personal info error:', error);
    res.status(500).json({
      success: false,
      message: 'Мэдээлэл хадгалахад алдаа гарлаа'
    });
  }
};

/**
 * Зураг upload хийх
 */
exports.uploadDocument = async (req, res) => {
  try {
    const userId = req.user._id;
    const { documentType, base64Data } = req.body;

    if (!documentType || !base64Data) {
      return res.status(400).json({
        success: false,
        message: 'documentType болон base64Data шаардлагатай',
      });
    }

    if (!['idCardFront', 'idCardBack', 'selfie'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'documentType буруу байна',
      });
    }

    // Upload to Cloudinary
    const result = await uploadImage(base64Data, 'cashly/kyc');

    const user = await User.findById(userId);
    if (!user.personalInfo) {
      user.personalInfo = {};
    }
    if (!user.personalInfo.documents) {
      user.personalInfo.documents = {};
    }

    user.personalInfo.documents[documentType] = {
      url: result.url,
      publicId: result.publicId,
      uploadedAt: new Date(),
    };

    await user.save();

    logger.info(`Document uploaded: User ${userId} - ${documentType}`);

    res.status(200).json({
      success: true,
      message: 'Зураг амжилттай байршуулагдлаа',
      data: {
        url: result.url,
        documentType,
      },
    });
  } catch (error) {
    logger.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Зураг байршуулахад алдаа гарлаа',
    });
  }
};