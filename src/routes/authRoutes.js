
const express = require('express');
const router = express.Router();
const { register } = require('../controllers/user/registerController');
const { login } = require('../controllers/user/loginController');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);

module.exports = router;
