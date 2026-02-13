/**
 * Loan Model - Зээлийн мэдээлэл
 * БАЙРШИЛ: src/models/Loan.js
 * 14, 21, 90 хоногийн зээл, хүү, сунгалт
 */

const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Зээлийн дугаар (автоматаар үүсэх) - index нь доор schema.index()-д тодорхойлогдсон
  loanNumber: {
    type: String,
    unique: true
  },

  // Зээлийн үндсэн дүн
  principal: {
    type: Number,
    required: [true, 'Зээлийн дүн шаардлагатай'],
    min: [10000, 'Хамгийн бага зээл 10,000₮']
  },

  // Зээлийн хугацаа (хоногоор)
  term: {
    type: Number,
    required: true,
    enum: [14, 21, 90]
  },

  // Хүү (хувиар)
  interestRate: {
    type: Number,
    required: true
  },

  // Хүүний дүн
  interestAmount: {
    type: Number,
    required: true
  },

  // Нийт төлөх дүн (principal + interest)
  totalAmount: {
    type: Number,
    required: true
  },

  // Төлөв
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'extended', 'completed', 'overdue', 'defaulted'],
    default: 'pending'
  },

  // Admin зөвшөөрөл
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: Date,

  rejectedReason: String,
  rejectedAt: Date,

  // Зээл олгосон огноо (хэтэвчинд орсон)
  disbursedAt: Date,

  // Эхлэх огноо
  startDate: Date,

  // Дуусах огноо
  dueDate: Date,

  // Төлсөн дүн
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Үлдсэн төлбөр
  remainingAmount: {
    type: Number,
    default: 0
  },

  // Сунгалтууд
  extensions: [{
    extendedAt: {
      type: Date,
      required: true
    },
    extensionFee: {
      type: Number,
      required: true
    },
    previousDueDate: {
      type: Date,
      required: true
    },
    newDueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['paid', 'pending'],
      default: 'pending'
    }
  }],

  // Сунгасан тоо (max 4)
  extensionCount: {
    type: Number,
    default: 0,
    max: 4
  },

  // Хоцролтын төлбөр
  lateFee: {
    type: Number,
    default: 0,
    min: 0
  },

  // Хоцорсон өдрийн тоо
  daysOverdue: {
    type: Number,
    default: 0,
    min: 0
  },

  // Даатгал (сонголттой)
  insurance: {
    opted: {
      type: Boolean,
      default: false
    },
    amount: Number,
    provider: String
  },

  // Зээлийн зориулалт
  purpose: {
    type: String,
    enum: ['Хувийн', 'Бизнес', 'Боловсрол', 'Эрүүл мэнд', 'Бусад'],
    default: 'Хувийн'
  },

  // Тэмдэглэл (admin-аас)
  adminNotes: String

}, {
  timestamps: true
});

// ✅ Index - давхардлаас зайлсхийхийн тулд зөвхөн schema.index()-д тодорхойлно
// (field дотор index:true болон unique:true аль аль нь байхгүй)
loanSchema.index({ user: 1, status: 1 });
loanSchema.index({ loanNumber: 1 }, { unique: true });
loanSchema.index({ status: 1 });
loanSchema.index({ dueDate: 1 });

// Зээлийн дугаар үүсгэх
loanSchema.pre('save', async function(next) {
  if (!this.loanNumber) {
    const count = await mongoose.model('Loan').countDocuments();
    this.loanNumber = `LOAN${Date.now()}${count + 1}`;
  }
  next();
});

// Хүү тооцох static method
loanSchema.statics.calculateInterest = function(principal, term) {
  let rate;
  switch(term) {
    case 14:
      rate = 1.8;
      break;
    case 21:
      rate = 2.4;
      break;
    case 90:
      rate = 2.4;
      break;
    default:
      rate = 2.4;
  }

  const interestAmount = Math.round(principal * (rate / 100));
  const totalAmount = principal + interestAmount;

  return {
    interestRate: rate,
    interestAmount,
    totalAmount
  };
};

// Хоцролтын төлбөр тооцох method
loanSchema.methods.calculateLateFee = function() {
  if (this.daysOverdue > 0) {
    // Өдөрт 0.5% хоцролтын хүү
    const dailyRate = 0.005;
    this.lateFee = Math.round(this.remainingAmount * dailyRate * this.daysOverdue);
  }
};

// Сунгалт боломжтой эсэх
loanSchema.methods.canExtend = function() {
  return this.term !== 14 && this.extensionCount < 4 && this.status === 'active';
};

module.exports = mongoose.model('Loan', loanSchema);