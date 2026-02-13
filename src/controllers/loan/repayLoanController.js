const Loan = require('../../models/Loan');
const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const logger = require('../../utils/logger');

exports.repayLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { amount } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Төлбөрийн дүн шаардлагатай'
      });
    }

    const loan = await Loan.findOne({ _id: loanId, user: userId });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Зээл олдсонгүй'
      });
    }

    if (!['active', 'extended', 'overdue'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        message: 'Энэ зээлийг төлөх боломжгүй'
      });
    }

    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Хэтэвч олдсонгүй'
      });
    }

    loan.calculateLateFee();

    const totalDue = loan.remainingAmount + loan.lateFee;

    if (amount > totalDue) {
      return res.status(400).json({
        success: false,
        message: 'Төлөх дүн хэт их байна. Төлөх ёстой: ' + totalDue.toLocaleString() + '₮'
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Хэтэвчийн үлдэгдэл хүрэлцэхгүй байна. Үлдэгдэл: ' + wallet.balance.toLocaleString() + '₮'
      });
    }

    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      user: userId,
      type: 'loan_payment',
      amount,
      status: 'completed',
      balanceBefore,
      balanceAfter: wallet.balance,
      description: 'Зээл төлбөр - ' + loan.loanNumber,
      loan: loan._id,
      completedAt: new Date()
    });

    loan.paidAmount += amount;
    loan.remainingAmount = totalDue - amount;

    if (loan.remainingAmount <= 0) {
      loan.status = 'completed';
      loan.remainingAmount = 0;

      const user = await User.findById(userId);
      if (user) {
        user.creditScore += 10;
        user.creditScore = Math.min(user.creditScore, 1000);
        await user.save();
      }

      logger.info('Loan completed: ' + loanId);
    }

    await loan.save();

    res.status(200).json({
      success: true,
      message: loan.status === 'completed' 
        ? 'Зээл бүрэн төлөгдлөө! 🎉'
        : amount.toLocaleString() + '₮ төлөгдлөө. Үлдэгдэл: ' + loan.remainingAmount.toLocaleString() + '₮',
      data: {
        loan: {
          id: loan._id,
          loanNumber: loan.loanNumber,
          paidAmount: loan.paidAmount,
          remainingAmount: loan.remainingAmount,
          status: loan.status
        },
        walletBalance: wallet.balance
      }
    });

  } catch (error) {
    logger.error('Repay loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Төлбөр төлөхөд алдаа гарлаа'
    });
  }
};
