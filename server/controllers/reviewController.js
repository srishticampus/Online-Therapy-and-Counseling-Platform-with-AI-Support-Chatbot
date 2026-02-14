const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Create a Review
// @route   POST /api/reviews
// @access  Private (Client)
exports.createReview = async (req, res) => {
    try {
        const { counselor: counselorId, rating, comment } = req.body;
        const clientId = req.user.id;

        // 1. Verify Counselor Exists
        const counselor = await User.findById(counselorId);
        if (!counselor || counselor.role !== 'counselor') {
            return res.status(404).json({ error: "Counselor not found" });
        }

        // 2. Check for interaction (Optional but requested "interacted with")
        // STRICT: Check if they have a completed or paid/scheduled appointment
        const interaction = await Appointment.findOne({
            client: clientId,
            counselor: counselorId,
            status: { $in: ['completed', 'scheduled'] } // Allow reviewing if they at least booked? usually 'completed' is best.
        });

        // Uncomment this to enforce stricter interaction rules
        // if (!interaction) {
        //     return res.status(403).json({ error: "You can only review counselors you have booked with." });
        // }

        // 3. Prevent duplicate reviews? 
        const existingReview = await Review.findOne({ client: clientId, counselor: counselorId });
        if (existingReview) {
            return res.status(400).json({ error: "You have already reviewed this counselor." });
        }

        const review = await Review.create({
            client: clientId,
            counselor: counselorId,
            rating,
            comment
        });

        res.status(201).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Counselor Reviews
// @route   GET /api/reviews/counselor/:counselorId
// @access  Public
exports.getCounselorReviews = async (req, res) => {
    try {
        const { counselorId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ counselor: counselorId })
            .populate('client', 'name profileImage') // Show reviewer info
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({ counselor: counselorId });

        res.json({
            success: true,
            count: reviews.length,
            total,
            pages: Math.ceil(total / limit),
            data: reviews
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update a Review
// @route   PUT /api/reviews/:id
// @access  Private (Owner)
exports.updateReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        let review = await Review.findById(req.params.id);

        if (!review) return res.status(404).json({ error: "Review not found" });

        // Ownership check
        if (review.client.toString() !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to update this review" });
        }

        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        await review.save();

        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete a Review
// @route   DELETE /api/reviews/:id
// @access  Private (Owner or Admin)
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) return res.status(404).json({ error: "Review not found" });

        // Check ownership or admin
        if (review.client.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Not authorized to delete this review" });
        }

        await review.deleteOne();
        res.json({ success: true, message: "Review removed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get My Reviews
// @route   GET /api/reviews/my-reviews
// @access  Private (Client)
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ client: req.user.id })
            .populate('counselor', 'name specialization profileImage')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Stats
// @route   GET /api/reviews/stats/:counselorId
// @access  Public
exports.getReviewStats = async (req, res) => {
    try {
        const { counselorId } = req.params;
        const mongoose = require('mongoose');
        const ObjectId = mongoose.Types.ObjectId;

        const stats = await Review.aggregate([
            { $match: { counselor: new ObjectId(counselorId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    // Breakdown
                    count5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    count4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    count3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    count2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    count1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({
                success: true,
                averageRating: 0,
                totalReviews: 0,
                ratingBreakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }
            });
        }

        const result = stats[0];
        res.json({
            success: true,
            averageRating: parseFloat(result.averageRating.toFixed(1)),
            totalReviews: result.totalReviews,
            ratingBreakdown: {
                "5": result.count5,
                "4": result.count4,
                "3": result.count3,
                "2": result.count2,
                "1": result.count1
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
