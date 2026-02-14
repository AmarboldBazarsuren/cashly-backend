/**
 * Local Image Upload (Cloudinary-гүй)
 * Base64 → /uploads folder
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Base64 зургийг local folder руу хадгална
 */
exports.uploadImage = async (base64Data, folder = 'cashly') => {
  try {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error('Зураг data буруу байна');
    }

    // Base64 data цэвэрлэх
    let cleanBase64 = base64Data;
    let mimeType = 'image/jpeg';

    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        cleanBase64 = matches[2];
      }
    }

    // File extension олох
    const ext = mimeType.split('/')[1] || 'jpg';

    // Uploads folder үүсгэх
    const uploadsDir = path.join(__dirname, '../../uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Unique filename үүсгэх
    const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Base64 → file
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(filepath, buffer);

    // URL үүсгэх
    const url = `${process.env.API_BASE_URL || 'http://localhost:5000'}/uploads/${folder}/${filename}`;

    logger.info(`Image saved locally: ${filepath}`);

    return {
      url: url,
      publicId: filename
    };
  } catch (error) {
    logger.error('Local upload error:', error);
    throw new Error('Зураг хадгалахад алдаа гарлаа: ' + error.message);
  }
};

/**
 * Зураг устгах
 */
exports.deleteImage = async (publicId) => {
  try {
    // publicId нь filename
    const filepath = path.join(__dirname, '../../uploads', publicId);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.info(`Image deleted: ${publicId}`);
    }
  } catch (error) {
    logger.error('Delete error:', error);
  }
};

exports.deleteMultipleImages = async (publicIds) => {
  for (const id of publicIds) {
    await this.deleteImage(id);
  }
};