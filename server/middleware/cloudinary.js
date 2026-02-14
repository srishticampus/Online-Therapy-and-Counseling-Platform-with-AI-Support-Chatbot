const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Ensure these are in your .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;

    // Upload to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically detect image/video/pdf
      folder: folderName
    });

    // Remove file from local uploads folder after success
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }

    return response; // Returns full object (url, public_id, etc)
  } catch (error) {
    // Clean up local file even if upload fails
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

module.exports = { uploadToCloudinary };