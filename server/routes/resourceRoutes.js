const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const upload = require('../middleware/upload'); // Import your updated upload.js

// Configure Multer to accept two specific files
const uploadFields = upload.fields([
    { name: 'thumbnail', maxCount: 1 }, // Expects form-data key: "thumbnail"
    { name: 'file', maxCount: 1 }       // Expects form-data key: "file" (for PDF or Video)
]);

// Public routes
router.get('/', resourceController.getAllResources);
router.get('/:id', resourceController.getResourceById);

// Admin routes
// We add 'uploadFields' middleware before the controller
router.post('/', uploadFields, resourceController.createResource);

// We also add it to Update, in case they want to change the file/image
router.put('/:id', uploadFields, resourceController.updateResource);

router.delete('/:id', resourceController.deleteResource);

module.exports = router;