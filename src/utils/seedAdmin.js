/**
 * Seed Admin Script
 * БАЙРШИЛ: src/utils/seedAdmin.js
 * Анхны super admin хэрэглэгч үүсгэх
 *
 * АЖИЛЛУУЛАХ ЗААВАР:
 *   npm run seed:admin
 *
 * ⚠️  АНХААРУУЛГА: Зөвхөн нэг удаа ажиллуулна. Дахин ажиллуулбал давхар admin үүснэ.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// .env файл ачаалах
dotenv.config();

const Admin = require('../models/Admin');
const connectDB = require('../config/database');

const seedAdmin = async () => {
  try {
    // MongoDB холболт
    await connectDB();
    console.log('✅ MongoDB холбогдлоо');

    // Өмнө нь admin үүссэн эсэх шалгах
    const existingAdmin = await Admin.findOne({ username: 'superadmin' });

    if (existingAdmin) {
      console.log('⚠️  superadmin аль хэдийн үүссэн байна. Гарлаа.');
      process.exit(0);
    }

    // Super admin үүсгэх
    const admin = await Admin.create({
      username: 'superadmin',
      password: 'Cashly@2024!',        // ← Нэвтэрсний дараа нууц үгээ солино уу!
      fullName: 'Super Administrator',
      email: 'admin@cashly.mn',
      phoneNumber: '99119911',
      role: 'super_admin',
      permissions: {
        canApproveKYC: true,
        canApproveLoan: true,
        canApproveWithdrawal: true,
        canSetCreditLimit: true,
        canBlockUser: true,
        canViewReports: true,
        canManageAdmins: true
      },
      isActive: true
    });

    console.log('');
    console.log('🎉 Super Admin амжилттай үүслээ!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Нэвтрэх нэр : superadmin`);
    console.log(`   Нууц үг     : Cashly@2024!`);
    console.log(`   Email        : admin@cashly.mn`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Нэвтэрсний дараа нууц үгээ заавал солино уу!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed admin алдаа:', error.message);
    process.exit(1);
  }
};

seedAdmin();