const Admin = require('../../models/Admin');
const { generateToken } = require('../../utils/generateToken');
const logger = require('../../utils/logger');

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Хэрэглэгчийн нэр болон нууц үг шаардлагатай'
      });
    }

    const admin = await Admin.findOne({ username }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу'
      });
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Таны админ хэрэглэгч идэвхгүй байна'
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    logger.info('Admin logged in: ' + admin._id + ' - ' + username);

    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Амжилттай нэвтэрлээ',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        },
        token
      }
    });

  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Нэвтрэхэд алдаа гарлаа'
    });
  }
};
