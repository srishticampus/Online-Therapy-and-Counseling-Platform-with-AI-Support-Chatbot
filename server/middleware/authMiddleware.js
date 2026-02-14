const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc    Protect routes - Verifies JWT and attaches User to Request
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from string "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find user and attach to req object (excluding password)
      // Note: use 'id' if you signed the token as { id: user._id }
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: "User not found." });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      return res.status(401).json({ success: false, message: "Not authorized, token failed." });
    }
  }

  // If no token exists at all
  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided." });
  }
};

/**
 * @desc    Admin Only Middleware
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
  }
};

/**
 * @desc    Counselor Only Middleware (Checks for role and approval)
 */
const counselorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'counselor') {
    // Check if the counselor has been approved by admin
    if (!req.user.isApproved) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Your counselor account is pending admin approval." 
      });
    }
    next();
  } else {
    res.status(403).json({ success: false, message: "Access denied. Counselor privileges required." });
  }
};

module.exports = { protect, adminOnly, counselorOnly };