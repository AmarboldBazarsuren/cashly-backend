const Loan = require('../../models/Loan');
const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');
const logger = require('../../utils/logger');

exports.extendLoan = async (req, res) => {
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

    if (!loan.canExtend()) {
      let reason = '';
      if (loan.term === 14) {
        reason = '14 хоногийн зээлийг сунгаж болохгүй';
      } else if (loan.extensionCount >= 4) {
        reason = 'Зээлийг 4-өөс илүү удаа сунгах боломжгүй';
      } else if (loan.status !== 'active') {
        reason = 'Зөвхөн идэвхтэй зээлийг сунгаж болно';
      }

      return res.status(400).json({
        success: false,
        message: reason
      });
    }

    const extensionFee = loan.interestAmount;
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Хэтэвч олдсонгүй'
      });
    }

    if (wallet.balance < extensionFee) {
      return res.status(400).json({
        success: false,
        message: 'Хэтэвчийн үлдэгдэл хүрэлцэхгүй байна. Шаардлагатай: ' + extensionFee.toLocaleString() + '₮'
      });
    }

    const balanceBefore = wallet.balance;
    wallet.balance -= extensionFee;
    await wallet.save();

    await Transaction.create({
      user: userId,
      type: 'extension_fee',
      amount: extensionFee,
      status: 'completed',
      balanceBefore,
      balanceAfter: wallet.balance,
      description: 'Зээл сунгалтын төлбөр - ' + loan.loanNumber,
      loan: loan._id,
      completedAt: new Date()
    });

    const currentDueDate = loan.dueDate;
    const newDueDate = new Date(currentDueDate);
    newDueDate.setDate(newDueDate.getDate() + loan.term);

    loan.extensions.push({
      extendedAt: new Date(),
      extensionFee,
      previousDueDate: currentDueDate,
      newDueDate,
      status: 'paid'
    });

    loan.extensionCount += 1;
    loan.dueDate = newDueDate;
    loan.status = 'extended';
    loan.totalAmount += extensionFee;
    loan.remainingAmount += extensionFee;

    await loan.save();

    logger.info('Loan extended: ' + loanId + ' - Extension count: ' + loan.extensionCount);

    res.status(200).json({
      success: true,
      message: 'Зээл амжилттай сунгагдлаа. Шинэ дуусах огноо: ' + newDueDate.toLocaleDateString('mn-MN'),
      data: {
        loan: {
          id: loan._id,
          loanNumber: loan.loanNumber,
          extensionCount: loan.extensionCount,
          dueDate: loan.dueDate,
          totalAmount: loan.totalAmount,
          remainingAmount: loan.remainingAmount
        },
        walletBalance: wallet.balance
      }
    });

  } catch (error) {
    logger.error('Extend loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээл сунгахад алдаа гарлаа'
    });
  }
};
