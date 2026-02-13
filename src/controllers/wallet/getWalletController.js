const Wallet = require('../../models/Wallet');
const logger = require('../../utils/logger');

exports.getWallet = async (req, res) => {
  try {
    const userId = req.user._id;

    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      wallet = await Wallet.create({ user: userId });
    }

    res.status(200).json({
      success: true,
      data: {
        wallet: {
          balance: wallet.balance,
          frozenBalance: wallet.frozenBalance,
          availableBalance: wallet.balance - wallet.frozenBalance,
          totalDeposited: wallet.totalDeposited,
          totalWithdrawn: wallet.totalWithdrawn,
          currency: wallet.currency,
          lastDepositAt: wallet.lastDepositAt,
          lastWithdrawalAt: wallet.lastWithdrawalAt
        }
      }
    });

  } catch (error) {
    logger.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Хэтэвчний мэдээлэл татахад алдаа гарлаа'
    });
  }
};
