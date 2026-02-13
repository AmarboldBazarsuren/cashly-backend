/**
 * Rate Limiter Middleware
 * API хандалт хязгаарлах - Брутфорс халдлагаас хамгаална
 */

const rateLimit = require('express-rate-limit');

// Ерөнхий API rate limit - 100 хүсэлт минутанд
exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минут
  max: 100,
  message: {
    success: false,
    message: 'Хэт олон хүсэлт илгээлээ. 1 минутын дараа дахин оролдоно уу'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Login rate limit - 5 оролдлого 15 минутанд
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5,
  message: {
    success: false,
    message: 'Хэт олон нэвтрэх оролдлого хийлээ. 15 минутын дараа дахин оролдоно уу'
  },
  skipSuccessfulRequests: true
});

// Registration rate limit - 3 бүртгэл цагт
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 цаг
  max: 3,
  message: {
    success: false,
    message: 'Хэт олон бүртгэл үүсгэлээ. 1 цагийн дараа дахин оролдоно уу'
  }
});

// Withdrawal request limit - 5 хүсэлт өдөрт
exports.withdrawalLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 цаг
  max: 5,
  message: {
    success: false,
    message: 'Өдөрт 5-аас илүү татах хүсэлт илгээх боломжгүй'
  }
});

// Loan application limit - 3 хүсэлт өдөрт
exports.loanApplicationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Өдөрт 3-аас илүү зээлийн хүсэлт илгээх боломжгүй'
  }
});