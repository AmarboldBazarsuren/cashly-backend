const Loan = require('../../models/Loan');
const logger = require('../../utils/logger');

exports.getUserLoans = async (req, res) => {
  try {
    const userId = req.user._id;

    const loans = await Loan.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('-user -adminNotes');

    res.status(200).json({
      success: true,
      count: loans.length,
      data: { loans }
    });

  } catch (error) {
    logger.error('Get user loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээл татахад алдаа гарлаа'
    });
  }
};

exports.getActiveLoans = async (req, res) => {
  try {
    const userId = req.user._id;

    const activeLoans = await Loan.find({
      user: userId,
      status: { $in: ['active', 'extended', 'overdue'] }
    }).sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: activeLoans.length,
      data: { loans: activeLoans }
    });

  } catch (error) {
    logger.error('Get active loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээл татахад алдаа гарлаа'
    });
  }
};

exports.getLoanDetails = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user._id;

    const loan = await Loan.findOne({ _id: loanId, user: userId });

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
    logger.error('Get loan details error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээлийн мэдээлэл татахад алдаа гарлаа'
    });
  }
};
