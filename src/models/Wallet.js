/**
 * Wallet Model - Хэрэглэгчийн хэтэвч
 * БАЙРШИЛ: src/models/Wallet.js
 * Мөнгөн үлдэгдэл, цэнэглэлт, зарлага
 */

const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  // ✅ unique:true хэвээр байна, гэхдээ доор schema.index()-д давхардуулж бичихгүй
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

  // Түгжигдсэн мөнгө (pending withdrawal)
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

  // Валют
  currency: {
    type: String,
    default: 'MNT',
    enum: ['MNT']
  },

  // Сүүлд цэнэглэсэн огноо
  lastDepositAt: Date,

  // Сүүлд татсан огноо
  lastWithdrawalAt: Date

}, {
  timestamps: true
});

// ✅ user field нь schema дотор unique:true тул давхардуулж бичихгүй - warning арилна

// Хэтэвчний үлдэгдэл шалгах
walletSchema.methods.hasBalance = function(amount) {
  return this.balance >= amount;
};

// Боломжит үлдэгдэл
walletSchema.virtual('availableBalance').get(function() {
  return this.balance - this.frozenBalance;
});

module.exports = mongoose.model('Wallet', walletSchema);