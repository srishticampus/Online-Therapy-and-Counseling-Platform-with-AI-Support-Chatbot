const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: "" },
  role: { type: String, enum: ['user', 'counselor', 'admin'], default: 'user' },

  // --- UNIQUE COUNSELOR FIELDS ---
  // sparse: true is required because regular users won't have these fields.
  // Without sparse, MongoDB would throw a duplicate error for having multiple 'null' values.
  licenseId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  counselorCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },

  specialization: { type: String },
  experience: { type: Number },
  isApproved: { type: Boolean, default: false },

  // Counselor Availability
  availability: {
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },

  otp: { type: String },
  otpExpires: { type: Date },
}, { timestamps: true });

// Password hashing logic
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);