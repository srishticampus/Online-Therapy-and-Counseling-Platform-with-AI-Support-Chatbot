const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  counselor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // e.g., "10:00 AM - 11:00 AM"
  status: { 
    type: String, 
    enum: ['pending', 'scheduled', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  meetingLink: { type: String, default: "" }, // Video call URL
  notes: { type: String }, // Private notes for counselor
  issue: { type: String }, // User's reason for booking
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' }
}, { timestamps: true, minimize: false  });

module.exports = mongoose.model('Appointment', appointmentSchema);