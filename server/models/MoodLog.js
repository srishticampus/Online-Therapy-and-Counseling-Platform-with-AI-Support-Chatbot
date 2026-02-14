const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  mood: { 
    type: String, 
    required: true 
  }, // e.g., "Happy", "Anxious"
  score: { 
    type: Number, 
    required: true 
  }, // 1 (Awful) to 5 (Great) - Used for Charts
  energyLevel: { 
    type: Number, 
    min: 1, 
    max: 10 
  }, // 1-10 Scale
  note: { 
    type: String, 
    maxLength: 500 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('MoodLog', moodLogSchema);