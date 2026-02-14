const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Import our modular multer
const { 
    register, 
    login, 
    adminLogin, 
    forgotPassword, 
    resetPassword,
    verifyOtp,
    updateProfile,
    getProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
router.post('/register', upload.single('profileImage'), register);

// @route   POST /api/auth/login
router.post('/login', login);

// @route   POST /api/auth/admin-login
router.post('/admin-login', adminLogin);
router.get('/profile', protect, getProfile);
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password
router.post('/reset-password', resetPassword);
router.post('/verify-otp', verifyOtp);
router.put('/update-profile', protect, upload.single('profileImage'), updateProfile);
module.exports = router;