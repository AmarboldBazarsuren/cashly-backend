/**
 * Transaction Model - Бүх гүйлгээний түүх
 * БАЙРШИЛ: src/models/Transaction.js
 * Цэнэглэлт, зарлага, зээлийн төлбөр
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ✅ unique:true хэвээр, гэхдээ доор schema.index()-д давхардуулж бичихгүй
  transactionId: {
    type: String,
    unique: true,
    required: true
  },

  // Гүйлгээний төрөл
  type: {
    type: String,
    enum: [
      'deposit',           // Цэнэглэлт
      'withdrawal',        // Зарлага
      'loan_disbursement', // Зээл олгох
      'loan_payment',      // Зээл төлөх
      'credit_check_fee',  // Зээлийн эрх шалгах төлбөр
      'extension_fee',     // Сунгалтын төлбөр
      'late_fee',          // Хоцролтын төлбөр
      'refund',            // Буцаалт
      'bonus',             // Урамшуулал
      'referral_bonus'     // Referral урамшуулал
    ],
    required: true
  },

  // Дүн
  amount: {
    type: Number,
    required: true
  },

  // Төлөв
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },

  // Хэтэвчний өмнөх үлдэгдэл
  balanceBefore: {
    type: Number,
    required: true
  },

  // Хэтэвчний шинэ үлдэгдэл
  balanceAfter: {
    type: Number,
    required: true
  },

  // Зээлтэй холбоотой бол
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },

  // Withdrawal request-тэй холбоотой бол
  withdrawalRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WithdrawalRequest'
  },

  // Тайлбар
  description: {
    type: String,
    required: true
  },

  // Банкны мэдээлэл (withdrawal)
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },

  // Төлбөрийн арга (deposit)
  paymentMethod: {
    type: String,
    enum: ['qpay', 'bank_transfer', 'card', 'social_pay', 'admin', '']
  },

  // Reference number
  referenceNumber: String,

  // Admin action
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  processedAt: Date,

  // Metadata
  metadata: {
    ipAddress: String,
    device: String,
    userAgent: String
  },

  completedAt: Date

}, {
  timestamps: true
});

// ✅ Index - transactionId нь schema дотор unique:true тул давхардуулж бичихгүй
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ loan: 1 });

// Transaction ID үүсгэх
transactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    this.transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);