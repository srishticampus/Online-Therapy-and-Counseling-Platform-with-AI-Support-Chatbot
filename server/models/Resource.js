const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  type: { 
      type: String, 
      enum: ['article', 'video', 'pdf'], 
      required: true 
  },
  
  // Stores the Link (Cloudinary URL or external Article link)
  contentUrl: { type: String, required: true },
  // Stores the ID to delete file from Cloudinary later
  contentPublicId: { type: String }, 

  // Stores the Image Link
  thumbnail: { type: String },
  // Stores the ID to delete image from Cloudinary later
  thumbnailPublicId: { type: String },

  tags: [String],
  views: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);