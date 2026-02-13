/**
 * WithdrawalRequest Model - Мөнгө татах хүсэлт
 * Admin зөвшөөрөл шаардлагатай
 */

const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Татах дүн
  amount: {
    type: Number,
    required: [true, 'Дүн шаардлагатай'],
    min: [10000, 'Хамгийн бага татах дүн 10,000₮']
  },

  // Банкны мэдээлэл
  bankDetails: {
    bankName: {
      type: String,
      required: true
    },
    accountNumber: {
      type: String,
      required: true
    },
    accountName: {
      type: String,
      required: true
    }
  },

  // Төлөв
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'failed'],
    default: 'pending'
  },

  // Admin зөвшөөрөл
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: Date,

  // Татгалзсан шалтгаан
  rejectedReason: String,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectedAt: Date,

  // Гүйлгээ дууссан
  completedAt: Date,

  // Transaction reference
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },

  // Тэмдэглэл
  adminNotes: String,

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
withdrawalRequestSchema.index({ user: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);