const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const {protect} = require('../middleware/authMiddleware');


router.post('/chat',protect, aiController.chat);
router.get('/history', protect, aiController.getHistory);
router.get('/analytics/:userId', protect, aiController.getAnalytics);
router.delete('/history', protect, aiController.clearHistory);

module.exports = router;
