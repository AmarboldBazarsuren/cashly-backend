/**
 * Pending Loans Controller
 * БАЙРШИЛ: Cashly.mn/Backend/src/controllers/admin/pendingLoansController.js
 * Зээлийн хүсэлтүүд харах
 */

const Loan = require('../../models/Loan');
const User = require('../../models/User');
const logger = require('../../utils/logger');

/**
 * @route   GET /api/admin/pending-loans
 * @desc    Хүлээгдэж буй зээлийн хүсэлтүүд
 * @access  Admin
 */
exports.getPendingLoans = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    
    if (status === 'pending') {
      filter.status = 'pending';
    } else if (status === 'all') {
      filter.status = { $in: ['pending', 'approved', 'rejected'] };
    }

    const loans = await Loan.find(filter)
      .populate('user', 'phoneNumber name personalInfo creditLimit')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Loan.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: loans.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { loans }
    });

  } catch (error) {
    logger.error('Get pending loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээлийн хүсэлт татахад алдаа гарлаа'
    });
  }
};

/**
 * @route   GET /api/admin/loan-detail/:loanId
 * @desc    Зээлийн дэлгэрэнгүй мэдээлэл
 * @access  Admin
 */
exports.getLoanDetail = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId)
      .populate('user', 'phoneNumber name email personalInfo creditLimit creditScore')
      .populate('approvedBy', 'fullName username');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Зээл олдсонгүй'
      });
    }

    res.status(200).json({
      success: true,
      data: { loan }
    });

  } catch (error) {
    logger.error('Get loan detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээлийн мэдээлэл татахад алдаа гарлаа'
    });
  }
};

/**
 * @route   GET /api/admin/active-loans
 * @desc    Идэвхтэй зээлүүд
 * @access  Admin
 */
exports.getActiveLoans = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const loans = await Loan.find({
      status: { $in: ['active', 'extended', 'overdue'] }
    })
      .populate('user', 'phoneNumber name')
      .sort({ dueDate: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Loan.countDocuments({
      status: { $in: ['active', 'extended', 'overdue'] }
    });

    res.status(200).json({
      success: true,
      count: loans.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { loans }
    });

  } catch (error) {
    logger.error('Get active loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээл татахад алдаа гарлаа'
    });
  }
};