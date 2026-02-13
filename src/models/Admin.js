/**
 * Admin Model - Админ хэрэглэгчид
 * Зөвшөөрөл олгох, хяналт хийх
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Хэрэглэгчийн нэр шаардлагатай'],
    unique: true,
    trim: true,
    lowercase: true
  },

  password: {
    type: String,
    required: [true, 'Нууц үг шаардлагатай'],
    minlength: 8,
    select: false
  },

  fullName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  phoneNumber: {
    type: String,
    required: true
  },

  // Админы төрөл
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'operator', 'viewer'],
    default: 'operator'
  },

  // Эрхүүд
  permissions: {
    canApproveKYC: {
      type: Boolean,
      default: false
    },
    canApproveLoan: {
      type: Boolean,
      default: false
    },
    canApproveWithdrawal: {
      type: Boolean,
      default: false
    },
    canSetCreditLimit: {
      type: Boolean,
      default: false
    },
    canBlockUser: {
      type: Boolean,
      default: false
    },
    canViewReports: {
      type: Boolean,
      default: true
    },
    canManageAdmins: {
      type: Boolean,
      default: false
    }
  },

  // Идэвхтэй эсэх
  isActive: {
    type: Boolean,
    default: true
  },

  // Сүүлд нэвтэрсэн
  lastLogin: Date,

  // Үүсгэсэн хүн
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

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

// Password hash
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password шалгах
adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);