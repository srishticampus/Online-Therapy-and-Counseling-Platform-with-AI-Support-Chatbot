const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configure how files are stored temporarily locally
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Create unique filename: fieldname-timestamp.extension
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// File filter to allow Images, PDFs, and Videos
const fileFilter = (req, file, cb) => {
    // Regex to match allowed extensions
    const allowedFileTypes = /jpeg|jpg|png|gif|pdf|mp4|mkv|mov/;
    // Regex to match allowed Mime Types
    const allowedMimeTypes = /image|application\/pdf|video/;

    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only Images, PDFs, and Videos are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // INCREASED LIMIT: 100MB (for videos)
    fileFilter: fileFilter
});

module.exports = upload;