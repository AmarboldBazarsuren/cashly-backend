/**
 * User Model - Хэрэглэгчийн бүх мэдээлэл
 * БАЙРШИЛ: src/models/User.js
 * Бүртгэл, хувийн мэдээлэл, KYC verification
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Үндсэн мэдээлэл
  // ✅ unique:true хэвээр байна, гэхдээ доор schema.index()-д давхардуулж бичихгүй
  phoneNumber: {
    type: String,
    required: [true, 'Утасны дугаар шаардлагатай'],
    unique: true,
    trim: true,
    match: [/^[0-9]{8}$/, 'Утасны дугаар 8 оронтой байх ёстой']
  },
  password: {
    type: String,
    required: [true, 'Нууц үг шаардлагатай'],
    minlength: 6,
    select: false
  },
  name: {
    type: String,
    required: [true, 'Нэр шаардлагатай'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },

  // Хувийн мэдээлэл - KYC
  personalInfo: {
    education: {
      type: String,
      enum: ['Бага', 'Дунд', 'Тусгай дунд', 'Бакалавр', 'Магистр', 'Доктор', ''],
      default: ''
    },
    employment: {
      status: {
        type: String,
        enum: ['Ажилтай', 'Ажилгүй', 'Оюутан', 'Тэтгэвэрт', 'Бизнес эрхлэгч', ''],
        default: ''
      },
      companyName: String,
      position: String,
      monthlyIncome: Number
    },
    address: {
      city: String,
      district: String,
      khoroo: String,
      building: String,
      apartment: String,
      fullAddress: String
    },
    bankInfo: {
      bankName: {
        type: String,
        enum: ['Хаан банк', 'Төрийн банк', 'Голомт банк', 'Хас банк', 'Капитрон банк',
               'Ариг банк', 'Богд банк', 'Чингис хаан банк', 'Худалдаа хөгжлийн банк',
               'Үндэсний хөрөнгө оруулалтын банк', '']
      },
      accountNumber: {
        type: String,
        trim: true
      },
      accountName: String
    },
    emergencyContacts: [{
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phoneNumber: {
        type: String,
        required: true,
        match: [/^[0-9]{8}$/, 'Утасны дугаар 8 оронтой байх ёстой']
      }
    }],
    documents: {
      idCardFront: {
        url: String,
        publicId: String,
        uploadedAt: Date
      },
      idCardBack: {
        url: String,
        publicId: String,
        uploadedAt: Date
      },
      selfie: {
        url: String,
        publicId: String,
        uploadedAt: Date
      }
    },
    registerNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[А-ЯӨҮ]{2}[0-9]{8}$/, 'Регистр буруу байна']
    }
  },

  // KYC Статус
  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_submitted'],
    default: 'not_submitted'
  },
  kycSubmittedAt: Date,
  kycApprovedAt: Date,
  kycRejectedReason: String,

  // Зээлийн эрх шалгах төлбөр
  creditCheckPaid: {
    type: Boolean,
    default: false
  },
  creditCheckPaidAt: Date,

  // Зээлийн эрх
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  creditLimitSetAt: Date,
  creditLimitSetBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  // Хэрэглэгчийн статус
  status: {
    type: String,
    enum: ['active', 'blocked', 'suspended'],
    default: 'active'
  },

  // Credit score
  creditScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1000
  },

  // Push notification токен
  fcmToken: String,

  // Referral
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  lastLogin: Date

}, {
  timestamps: true
});

// ✅ Index - зөвхөн хайлтад ашиглагдах field-үүд
// phoneNumber, referralCode нь schema дотор unique:true тул давхардуулж бичихгүй
userSchema.index({ kycStatus: 1 });
userSchema.index({ creditCheckPaid: 1 });
userSchema.index({ status: 1 });

// Password hash
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password шалгах
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Referral code үүсгэх
userSchema.methods.generateReferralCode = function() {
  return `CASHLY${this._id.toString().slice(-6).toUpperCase()}`;
};

module.exports = mongoose.model('User', userSchema);