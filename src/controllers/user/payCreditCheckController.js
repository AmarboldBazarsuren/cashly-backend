const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');
const logger = require('../../utils/logger');

const CREDIT_CHECK_FEE = 3000;

exports.payCreditCheckFee = async (req, res) => {
  try {
    const userId = req.user._id;

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

    if (user.creditCheckPaid) {
      return res.status(400).json({
        success: false,
        message: 'Та зээлийн эрх шалгах төлбөрөө аль хэдийн төлсөн байна'
      });
    }

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Хэтэвч олдсонгүй'
      });
    }

    if (wallet.balance < CREDIT_CHECK_FEE) {
      return res.status(400).json({
        success: false,
        message: `Хэтэвчийн үлдэгдэл хүрэлцэхгүй байна. Шаардлагатай: ${CREDIT_CHECK_FEE}₮`
      });
    }

    const balanceBefore = wallet.balance;
    wallet.balance -= CREDIT_CHECK_FEE;
    await wallet.save();

    await Transaction.create({
      user: userId,
      type: 'credit_check_fee',
      amount: CREDIT_CHECK_FEE,
      status: 'completed',
      balanceBefore: balanceBefore,
      balanceAfter: wallet.balance,
      description: 'Зээлийн эрх шалгах төлбөр',
      completedAt: new Date()
    });

    user.creditCheckPaid = true;
    user.creditCheckPaidAt = new Date();
    await user.save();

    logger.info(`Credit check fee paid by user: ${userId}`);

    res.status(200).json({
      success: true,
      message: `${CREDIT_CHECK_FEE}₮ төлбөр амжилттай төлөгдлөө. Админ танд зээлийн эрх тогтооно`,
      data: {
        creditCheckPaid: true,
        creditCheckPaidAt: user.creditCheckPaidAt,
        walletBalance: wallet.balance
      }
    });

  } catch (error) {
    logger.error('Pay credit check error:', error);
    res.status(500).json({
      success: false,
      message: 'Төлбөр төлөхөд алдаа гарлаа'
    });
  }
};
