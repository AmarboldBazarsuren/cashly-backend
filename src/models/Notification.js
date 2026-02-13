/**
 * Notification Model - Мэдэгдэл
 * Push notification болон SMS
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Мэдэгдлийн төрөл
  type: {
    type: String,
    enum: [
      'kyc_approved',
      'kyc_rejected',
      'credit_limit_set',
      'loan_approved',
      'loan_rejected',
      'loan_disbursed',
      'withdrawal_approved',
      'withdrawal_rejected',
      'withdrawal_completed',
      'payment_reminder',
      'loan_due_soon',
      'loan_overdue',
      'extension_reminder',
      'general'
    ],
    required: true
  },

  // Гарчиг
  title: {
    type: String,
    required: true
  },

  // Агуулга
  message: {
    type: String,
    required: true
  },

  // Мэдэгдлийн арга
  channel: {
    type: String,
    enum: ['push', 'sms', 'both'],
    default: 'push'
  },

  // Уншсан эсэх
  isRead: {
    type: Boolean,
    default: false
  },

  // Уншсан огноо
  readAt: Date,

  // Холбогдох өгөгдөл
  relatedData: {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan'
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    withdrawalRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WithdrawalRequest'
    }
  },

  // SMS илгээгдсэн эсэх
  smsSent: {
    type: Boolean,
    default: false
  },
  smsSentAt: Date,

  // Push илгээгдсэн эсэх
  pushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: Date,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);