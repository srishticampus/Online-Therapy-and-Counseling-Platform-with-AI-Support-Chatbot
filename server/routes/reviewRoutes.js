const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.get('/counselor/:counselorId', reviewController.getCounselorReviews);
router.get('/stats/:counselorId', reviewController.getReviewStats);

// Private
router.post('/', protect, reviewController.createReview);
router.get('/my-reviews', protect, reviewController.getMyReviews);
router.put('/:id', protect, reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview); // Controller handles admin check if needed, or we can add admin middleware

module.exports = router;
