/**
 * Wallet Model - Хэрэглэгчийн хэтэвч
 * Мөнгөн үлдэгдэл, цэнэглэлт, зарлага
 */

const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Үндсэн үлдэгдэл
  balance: {
    type: Number,
    default: 0,
    min: 0
  },

  // Түгжигдсэн мөнгө (pending transactions)
  frozenBalance: {
    type: Number,
    default: 0,
    min: 0
  },

  // Нийт цэнэглэсэн дүн
  totalDeposited: {
    type: Number,
    default: 0,
    min: 0
  },

  // Нийт зарцуулсан дүн
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: 0
  },

  // Валют (Одоогоор зөвхөн MNT)
  currency: {
    type: String,
    default: 'MNT',
    enum: ['MNT']
  },

  // Сүүлд цэнэглэсэн огноо
  lastDepositAt: Date,

  // Сүүлд татсан огноо
  lastWithdrawalAt: Date,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index
walletSchema.index({ user: 1 });

// Хэтэвчний үлдэгдэл шалгах method
walletSchema.methods.hasBalance = function(amount) {
  return this.balance >= amount;
};

// Боломжит үлдэгдэл (нийт - түгжигдсэн)
walletSchema.virtual('availableBalance').get(function() {
  return this.balance - this.frozenBalance;
});

module.exports = mongoose.model('Wallet', walletSchema);