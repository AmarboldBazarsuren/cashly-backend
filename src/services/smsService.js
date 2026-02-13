/**
 * SMS Service
 * Twilio ашиглан SMS илгээх
 */

const twilio = require('twilio');
const logger = require('../utils/logger');

// Twilio client үүсгэх
let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
} catch (error) {
  logger.warn('Twilio configuration missing');
}

/**
 * SMS илгээх
 * @param {String} phoneNumber - Утасны дугаар (+976 format)
 * @param {String} message - Мессеж
 */
exports.sendSMS = async (phoneNumber, message) => {
  try {
    if (!twilioClient) {
      logger.warn('Twilio not configured, skipping SMS');
      return { success: false, message: 'SMS service not configured' };
    }

    // Монголын дугаар руу илгээх (+976)
    const formattedPhone = phoneNumber.startsWith('+976') 
      ? phoneNumber 
      : `+976${phoneNumber}`;

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    logger.info(`SMS sent to ${formattedPhone}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    logger.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * OTP код илгээх
 * @param {String} phoneNumber - Утасны дугаар
 * @param {String} code - OTP код
 */
exports.sendOTP = async (phoneNumber, code) => {
  const message = `Cashly баталгаажуулах код: ${code}. Энэ кодыг хэнд ч дамжуулж болохгүй!`;
  return await this.sendSMS(phoneNumber, message);
};

/**
 * Зээл зөвшөөрөгдсөн мэдэгдэл
 */
exports.sendLoanApprovalSMS = async (phoneNumber, amount) => {
  const message = `Таны ${amount.toLocaleString()}₮-ийн зээлийн хүсэлт зөвшөөрөгдлөө! Cashly`;
  return await this.sendSMS(phoneNumber, message);
};

/**
 * Төлбөр сануулах
 */
exports.sendPaymentReminderSMS = async (phoneNumber, amount, dueDate) => {
  const message = `Сануулга: ${amount.toLocaleString()}₮ төлбөр ${dueDate}-нд төлөгдөх ёстой. Cashly`;
  return await this.sendSMS(phoneNumber, message);
};