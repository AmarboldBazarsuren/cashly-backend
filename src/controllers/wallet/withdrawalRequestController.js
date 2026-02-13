const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const WithdrawalRequest = require('../../models/WithdrawalRequest');
const logger = require('../../utils/logger');

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Дүн буруу байна'
      });
    }

    if (amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Хамгийн бага татах дүн 10,000₮'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    if (!user.personalInfo?.bankInfo?.bankName || !user.personalInfo?.bankInfo?.accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Банкны мэдээлэл бүртгэгдээгүй байна. Профайл хэсгээс нэмнэ үү'
      });
    }

    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Хэтэвч олдсонгүй'
      });
    }

    const availableBalance = wallet.balance - wallet.frozenBalance;

    if (availableBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Хэтэвчийн үлдэгдэл хүрэлцэхгүй байна. Боломжит: ' + availableBalance.toLocaleString() + '₮'
      });
    }

    const pendingWithdrawal = await WithdrawalRequest.findOne({
      user: userId,
      status: 'pending'
    });

    if (pendingWithdrawal) {
      return res.status(400).json({
        success: false,
        message: 'Та аль хэдийн татах хүсэлт илгээсэн байна. Хариу хүлээнэ үү'
      });
    }

    wallet.frozenBalance += amount;
    await wallet.save();

    const withdrawalRequest = await WithdrawalRequest.create({
      user: userId,
      amount,
      bankDetails: {
        bankName: user.personalInfo.bankInfo.bankName,
        accountNumber: user.personalInfo.bankInfo.accountNumber,
        accountName: user.personalInfo.bankInfo.accountName || user.name
      },
      status: 'pending'
    });

    logger.info('Withdrawal request created: ' + withdrawalRequest._id + ' - User: ' + userId + ' - Amount: ' + amount);

    res.status(201).json({
      success: true,
      message: 'Татах хүсэлт амжилттай илгээгдлээ. Админ баталгаажуулах болно',
      data: {
        request: {
          id: withdrawalRequest._id,
          amount: withdrawalRequest.amount,
          bankDetails: withdrawalRequest.bankDetails,
          status: withdrawalRequest.status,
          createdAt: withdrawalRequest.createdAt
        },
        wallet: {
          balance: wallet.balance,
          frozenBalance: wallet.frozenBalance,
          availableBalance: wallet.balance - wallet.frozenBalance
        }
      }
    });

  } catch (error) {
    logger.error('Request withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Хүсэлт илгээхэд алдаа гарлаа'
    });
  }
};

exports.getWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await WithdrawalRequest.find({ user: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: { requests }
    });

  } catch (error) {
    logger.error('Get withdrawal requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Хүсэлт татахад алдаа гарлаа'
    });
  }
};
