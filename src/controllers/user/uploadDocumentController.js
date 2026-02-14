/**
 * Upload Document Controller
 * Base64 зургийг Cloudinary руу upload хийнэ
 */

const { uploadImage } = require('../../utils/imageUpload');
const logger = require('../../utils/logger');

exports.uploadDocument = async (req, res) => {
  try {
    const { documentType, base64Data } = req.body;

    if (!documentType || !base64Data) {
      return res.status(400).json({
        success: false,
        message: 'Document type болон зураг шаардлагатай'
      });
    }

    // Cloudinary руу upload
    const result = await uploadImage(base64Data, `cashly/kyc/${documentType}`);

    logger.info(`Document uploaded: ${documentType} - User: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Зураг амжилттай upload хийгдлээ',
      data: {
        url: result.url,
        publicId: result.publicId
      }
    });

  } catch (error) {
    logger.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Зураг upload хийхэд алдаа гарлаа'
    });
  }
};