/**
 * Authentication Middleware
 * Token шалгах, хэрэглэгч баталгаажуулах
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Хэрэглэгч баталгаажуулах
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Header-с token авах
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Token байхгүй бол
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Нэвтрэх эрх шаардлагатай'
      });
    }

    try {
      // Token verify хийх
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Хэрэглэгч олох
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Хэрэглэгч олдсонгүй'
        });
      }

      // Хэрэглэгч идэвхтэй эсэх шалгах
      if (req.user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Таны хэрэглэгч блоклогдсон байна'
        });
      }

      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token буруу эсвэл хүчингүй'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Сервер алдаа'
    });
  }
};

// Admin баталгаажуулах
exports.adminProtect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin эрх шаардлагатай'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Admin model-ээс олох
      const Admin = require('../models/Admin');
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin олдсонгүй'
        });
      }

      if (!req.admin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Admin хэрэглэгч идэвхгүй байна'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token буруу эсвэл хүчингүй'
      });
    }
  } catch (error) {
    logger.error('Admin auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Сервер алдаа'
    });
  }
};

// Admin эрх шалгах
exports.authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Хандах эрхгүй'
      });
    }

    // Super admin бол бүх эрхтэй
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Эрх шалгах
    const hasPermission = permissions.some(permission => 
      req.admin.permissions[permission] === true
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Энэ үйлдэл хийх эрхгүй'
      });
    }

    next();
  };
};