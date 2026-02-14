const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService');

// --- REGISTER ---
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, licenseId, counselorCode } = req.body;

    // 1. Manual Check for common fields
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email already registered" });

    // 2. Profile Image
    const profileImage = req.file ? req.file.path : "";

    // 3. Create User
    const user = await User.create({
      ...req.body,
      profileImage,
      isApproved: role === 'user' // Auto-approve users, not counselors
    });

    res.status(201).json({
      success: true,
      message: role === 'counselor' 
        ? "Registration successful! Pending Admin Approval." 
        : "Registration successful!"
    });

  } catch (error) {
    // 4. CATCH UNIQUE CONSTRAINT ERRORS (License ID / Counselor Code)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `${field === 'licenseId' ? 'License ID' : 'Counselor Code'} already exists in our system.` 
      });
    }
    next(error);
  }
};
// --- VERIFY OTP ONLY ---
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ 
            email, 
            otp, 
            otpExpires: { $gt: Date.now() } // Check if code is still valid
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired code." });
        }

        res.status(200).json({ success: true, message: "OTP Verified." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// --- LOGIN ---
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Check Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // 2. CHECK APPROVAL STATUS (Specific for Counselors)
    if (user.role === 'counselor' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending admin approval. You will be able to login once verified."
      });
    }

    // 3. Generate Token if approved or if regular user
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      success: true,
      token,
      user
    });

  } catch (error) {
    next(error);
  }
};

// --- ADMIN LOGIN (Local) ---
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@mindheal.com" && password === "admin123") {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.status(200).json({ success: true, token, role: 'admin' });
        
    }
    res.status(401).json({ message: "Invalid Admin Access" });
};

// --- FORGOT PASSWORD ---
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        const emailSent = await sendEmail(email, "Password Reset OTP", `Your MindHeal verification code is: ${otp}`);
        
        if (emailSent) {
            res.status(200).json({ success: true, message: "OTP sent to email" });
        } else {
            res.status(500).json({ message: "Failed to send email" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ 
            email, 
            otp, 
            otpExpires: { $gt: Date.now() } 
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Password updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = req.user._id;
    const { email, licenseId, counselorCode } = req.body;

    // 1. CHECK FOR EMAIL DUPLICATION
    if (email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: userId } // Find someone with this email who IS NOT the current user
      });
      if (emailExists) {
        return res.status(400).json({ 
          success: false, 
          message: "This email address is already linked to another account." 
        });
      }
    }

    // 2. CHECK FOR COUNSELOR ID DUPLICATION (Since we made them unique)
    if (licenseId) {
      const licenseExists = await User.findOne({ licenseId, _id: { $ne: userId } });
      if (licenseExists) return res.status(400).json({ message: "This License ID is already in use." });
    }

    if (counselorCode) {
      const codeExists = await User.findOne({ counselorCode, _id: { $ne: userId } });
      if (codeExists) return res.status(400).json({ message: "This Counselor Code is already in use." });
    }

    // 3. APPLY UPDATES
    const updates = { ...req.body };

    if (req.file) {
      updates.profileImage = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true, // Return the updated document
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: updatedUser,
    });

  } catch (error) {
    // Catch generic MongoDB unique errors if they slip through
    if (error.code === 11000) {
      return res.status(400).json({ message: "One of the unique IDs entered is already taken." });
    }
    res.status(500).json({ message: error.message });
  }
};
exports.getProfile = async (req, res) => {
    try {
        // req.user is attached by the 'protect' middleware
        const user = await User.findById(req.user._id || req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};