/**
 * Зураг upload хийх utility
 * Cloudinary ашиглан зургийг хадгална
 */

const cloudinary = require('../config/cloudinary');
const logger = require('./logger');

/**
 * Base64 зургийг Cloudinary руу upload хийх
 * @param {String} base64Data - Base64 формат зураг
 * @param {String} folder - Cloudinary folder нэр
 * @returns {Object} - url болон public_id
 */
exports.uploadImage = async (base64Data, folder = 'cashly') => {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Зураг upload хийхэд алдаа гарлаа');
  }
};

/**
 * Зураг устгах
 * @param {String} publicId - Cloudinary public_id
 */
exports.deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted: ${publicId}`);
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw new Error('Зураг устгахад алдаа гарлаа');
  }
};

/**
 * Олон зураг устгах
 * @param {Array} publicIds - Public IDs array
 */
exports.deleteMultipleImages = async (publicIds) => {
  try {
    await cloudinary.api.delete_resources(publicIds);
    logger.info(`${publicIds.length} зураг устгагдлаа`);
  } catch (error) {
    logger.error('Cloudinary bulk delete error:', error);
  }
};