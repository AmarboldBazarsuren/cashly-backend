/**
 * User Routes
 * БАЙРШИЛ: Cashly.mn/Backend/src/routes/userRoutes.js
 * Хэрэглэгчийн бүх route-ууд
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getProfile } = require('../controllers/user/getProfileController');
const { submitKYC } = require('../controllers/user/submitKYCController');
const { payCreditCheckFee } = require('../controllers/user/payCreditCheckController');
const { updateFCMToken } = require('../controllers/user/updateFCMTokenController');

// Бүх route-д authentication шаардлагатай
router.use(protect);

// GET /api/user/profile - Хэрэглэгчийн профайл
router.get('/profile', getProfile);

// POST /api/user/submit-kyc - Хувийн мэдээлэл илгээх
router.post('/submit-kyc', submitKYC);

// POST /api/user/pay-credit-check - 3000₮ төлбөр төлөх
router.post('/pay-credit-check', payCreditCheckFee);

// POST /api/user/update-fcm-token - FCM token update
router.post('/update-fcm-token', updateFCMToken);

module.exports = router;