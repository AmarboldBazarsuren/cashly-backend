/**
 * Notification Service
 * Push болон SMS мэдэгдэл илгээх нэгдсэн систем
 */

const Notification = require('../models/Notification');
const { sendPushNotification } = require('./pushNotificationService');
const { sendSMS } = require('./smsService');
const logger = require('../utils/logger');

/**
 * Мэдэгдэл үүсгэж илгээх
 * @param {ObjectId} userId - Хэрэглэгчийн ID
 * @param {String} type - Мэдэгдлийн төрөл
 * @param {String} title - Гарчиг
 * @param {String} message - Агуулга
 * @param {String} channel - 'push', 'sms', 'both'
 * @param {Object} relatedData - Холбогдох өгөгдөл
 */
exports.createAndSendNotification = async (
  userId,
  type,
  title,
  message,
  channel = 'push',
  relatedData = {}
) => {
  try {
    // Notification үүсгэх
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      channel,
      relatedData
    });

    // User-ийн мэдээлэл авах
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      logger.error(`User not found: ${userId}`);
      return;
    }

    // Push notification илгээх
    if ((channel === 'push' || channel === 'both') && user.fcmToken) {
      const pushResult = await sendPushNotification(
        user.fcmToken,
        { title, body: message },
        { type, notificationId: notification._id.toString() }
      );

      if (pushResult.success) {
        notification.pushSent = true;
        notification.pushSentAt = new Date();
      }
    }

    // SMS илгээх
    if (channel === 'sms' || channel === 'both') {
      const smsResult = await sendSMS(user.phoneNumber, `${title}: ${message}`);

      if (smsResult.success) {
        notification.smsSent = true;
        notification.smsSentAt = new Date();
      }
    }

    await notification.save();
    logger.info(`Notification sent to user ${userId}: ${type}`);

    return notification;
  } catch (error) {
    logger.error('Notification service error:', error);
    throw error;
  }
};

/**
 * Бэлэн мэдэгдлүүд
 */

// KYC зөвшөөрөгдсөн
exports.sendKYCApprovedNotification = async (userId) => {
  return await this.createAndSendNotification(
    userId,
    'kyc_approved',
    'Хувийн мэдээлэл баталгаажлаа! ✅',
    'Таны хувийн мэдээлэл амжилттай баталгаажлаа. Одоо зээлийн эрхээ шалгуулж болно.',
    'both'
  );
};

// KYC татгалзсан
exports.sendKYCRejectedNotification = async (userId, reason) => {
  return await this.createAndSendNotification(
    userId,
    'kyc_rejected',
    'Хувийн мэдээлэл татгалзагдлаа ❌',
    `Шалтгаан: ${reason}. Дахин илгээнэ үү.`,
    'both'
  );
};

// Зээлийн эрх тогтоосон
exports.sendCreditLimitSetNotification = async (userId, amount) => {
  return await this.createAndSendNotification(
    userId,
    'credit_limit_set',
    'Зээлийн эрх тогтлоо! 🎉',
    `Танд ${amount.toLocaleString()}₮ зээлийн эрх олгогдлоо.`,
    'both'
  );
};

// Зээл зөвшөөрөгдсөн
exports.sendLoanApprovedNotification = async (userId, loanId, amount) => {
  return await this.createAndSendNotification(
    userId,
    'loan_approved',
    'Зээл зөвшөөрөгдлөө! ✅',
    `Таны ${amount.toLocaleString()}₮-ийн зээлийн хүсэлт зөвшөөрөгдлөө. Мөнгө таны хэтэвчинд орлоо.`,
    'both',
    { loanId }
  );
};

// Зээл татгалзсан
exports.sendLoanRejectedNotification = async (userId, loanId, reason) => {
  return await this.createAndSendNotification(
    userId,
    'loan_rejected',
    'Зээлийн хүсэлт татгалзагдлаа',
    `Шалтгаан: ${reason}`,
    'both',
    { loanId }
  );
};

// Withdrawal зөвшөөрөгдсөн
exports.sendWithdrawalApprovedNotification = async (userId, withdrawalId, amount) => {
  return await this.createAndSendNotification(
    userId,
    'withdrawal_approved',
    'Татах хүсэлт зөвшөөрөгдлөө ✅',
    `${amount.toLocaleString()}₮ таны данс руу шилжүүлэгдэж байна.`,
    'both',
    { withdrawalRequestId: withdrawalId }
  );
};

// Төлбөр сануулах
exports.sendPaymentReminderNotification = async (userId, loanId, amount, dueDate) => {
  return await this.createAndSendNotification(
    userId,
    'payment_reminder',
    'Төлбөр сануулга 📢',
    `${amount.toLocaleString()}₮ төлбөр ${dueDate}-нд төлөгдөх ёстой.`,
    'both',
    { loanId }
  );
};

// Зээл хугацаа дуусах гэж байна
exports.sendLoanDueSoonNotification = async (userId, loanId, amount, daysLeft) => {
  return await this.createAndSendNotification(
    userId,
    'loan_due_soon',
    'Зээл дуусахад хоног үлдлээ ⏰',
    `Таны зээл ${daysLeft} хоногт дуусах тул ${amount.toLocaleString()}₮ төлнө үү.`,
    'both',
    { loanId }
  );
};

// Зээл хугацаа хэтэрсэн
exports.sendLoanOverdueNotification = async (userId, loanId, amount, daysOverdue) => {
  return await this.createAndSendNotification(
    userId,
    'loan_overdue',
    'Зээл хугацаа хэтэрсэн! ⚠️',
    `Таны зээл ${daysOverdue} хоногоор хугацаа хэтэрсэн. ${amount.toLocaleString()}₮ төлнө үү.`,
    'both',
    { loanId }
  );
};