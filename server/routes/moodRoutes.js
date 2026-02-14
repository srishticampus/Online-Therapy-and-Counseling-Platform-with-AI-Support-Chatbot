const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { addMoodLog, getMoodHistory } = require('../controllers/moodController');

router.post('/add', protect, addMoodLog);
router.get('/history', protect, getMoodHistory);

module.exports = router;