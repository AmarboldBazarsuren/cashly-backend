const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');
const logger = require('../../utils/logger');

exports.deposit = async (req, res) => {
  try {
    const { amount, paymentMethod, referenceNumber } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Дүн буруу байна'
      });
    }

    if (amount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Хамгийн бага цэнэглэх дүн 1,000₮'
      });
    }

    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      wallet = await Wallet.create({ user: userId });
    }

    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    wallet.totalDeposited += amount;
    wallet.lastDepositAt = new Date();
    await wallet.save();

    const transaction = await Transaction.create({
      user: userId,
      type: 'deposit',
      amount,
      status: 'completed',
      balanceBefore,
      balanceAfter: wallet.balance,
      description: 'Хэтэвч цэнэглэлт - ' + (paymentMethod || 'manual'),
      paymentMethod: paymentMethod || 'admin',
      referenceNumber: referenceNumber || '',
      completedAt: new Date()
    });

    logger.info('Deposit: User ' + userId + ' - Amount: ' + amount + ' - Method: ' + paymentMethod);

    res.status(200).json({
      success: true,
      message: amount.toLocaleString() + '₮ амжилттай цэнэглэгдлээ',
      data: {
        transaction: {
          id: transaction._id,
          transactionId: transaction.transactionId,
          amount: transaction.amount,
          balanceAfter: transaction.balanceAfter,
          createdAt: transaction.createdAt
        },
        wallet: {
          balance: wallet.balance,
          totalDeposited: wallet.totalDeposited
        }
      }
    });

  } catch (error) {
    logger.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Цэнэглэлт хийхэд алдаа гарлаа'
    });
  }
};
