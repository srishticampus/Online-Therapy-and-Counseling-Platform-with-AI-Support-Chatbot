const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isAI: { type: Boolean, default: false }, // True if message is from AI Bot
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  read: { type: Boolean, default: false },

  // AI Sentiment Analysis (Optional for Analytics)
  sentimentScore: { type: Number }, // -1 (Negative) to 1 (Positive)
  detectedEmotion: { type: String },
  suggestedAction: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);