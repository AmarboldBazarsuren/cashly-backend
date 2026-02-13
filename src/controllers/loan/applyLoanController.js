const User = require('../../models/User');
const Loan = require('../../models/Loan');
const logger = require('../../utils/logger');

exports.applyLoan = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, term, purpose } = req.body;

    if (!amount || !term) {
      return res.status(400).json({
        success: false,
        message: 'Дүн болон хугацаа шаардлагатай'
      });
    }

    if (![14, 21, 90].includes(term)) {
      return res.status(400).json({
        success: false,
        message: 'Хугацаа 14, 21 эсвэл 90 хоног байх ёстой'
      });
    }

    if (amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Хамгийн бага зээл 10,000₮'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    if (user.kycStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Эхлээд хувийн мэдээлэл баталгаажуулна уу'
      });
    }

    if (!user.creditCheckPaid) {
      return res.status(400).json({
        success: false,
        message: 'Эхлээд 3000₮ зээлийн эрх шалгах төлбөр төлнө үү'
      });
    }

    if (user.creditLimit === 0) {
      return res.status(400).json({
        success: false,
        message: 'Зээлийн эрх тогтоогдоогүй байна. Админ баталгаажуулахыг хүлээнэ үү'
      });
    }

    if (amount > user.creditLimit) {
      return res.status(400).json({
        success: false,
        message: 'Зээлийн эрх хүрэлцэхгүй байна. Таны эрх: ' + user.creditLimit.toLocaleString() + '₮'
      });
    }

    const activeLoans = await Loan.find({
      user: userId,
      status: { $in: ['pending', 'approved', 'active', 'extended'] }
    });

    const totalActiveLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);

    if (totalActiveLoanAmount + amount > user.creditLimit) {
      return res.status(400).json({
        success: false,
        message: 'Зээлийн эрх хүрэлцэхгүй байна. Идэвхтэй зээл: ' + totalActiveLoanAmount.toLocaleString() + '₮, Үлдэгдэл эрх: ' + (user.creditLimit - totalActiveLoanAmount).toLocaleString() + '₮'
      });
    }

    const { interestRate, interestAmount, totalAmount } = Loan.calculateInterest(amount, term);

    const loan = await Loan.create({
      user: userId,
      principal: amount,
      term,
      interestRate,
      interestAmount,
      totalAmount,
      remainingAmount: totalAmount,
      purpose: purpose || 'Хувийн',
      status: 'pending'
    });

    logger.info('Loan application created: ' + loan._id + ' - User: ' + userId + ' - Amount: ' + amount);

    res.status(201).json({
      success: true,
      message: 'Зээлийн хүсэлт амжилттай илгээгдлээ. Админ баталгаажуулах болно',
      data: {
        loan: {
          id: loan._id,
          loanNumber: loan.loanNumber,
          principal: loan.principal,
          term: loan.term,
          interestRate: loan.interestRate,
          interestAmount: loan.interestAmount,
          totalAmount: loan.totalAmount,
          status: loan.status,
          createdAt: loan.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Apply loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээлийн хүсэлт илгээхэд алдаа гарлаа'
    });
  }
};
