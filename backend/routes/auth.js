const express = require('express');
const { register, login, verifyOtp, resendOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', protect, verifyOtp);
router.post('/resend-otp', protect, resendOtp);

module.exports = router;
