const MoodLog = require('../models/MoodLog');

// @desc    Log a new mood
// @route   POST /api/mood/add
exports.addMoodLog = async (req, res) => {
    try {
        const { mood, score, energyLevel, note } = req.body;

        const newLog = await MoodLog.create({
            user: req.user.id,
            mood,
            score,
            energyLevel,
            note
        });

        res.status(201).json({ success: true, data: newLog });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get user's mood history (Last 14 entries for charts)
// @route   GET /api/mood/history
exports.getMoodHistory = async (req, res) => {
    try {
        const logs = await MoodLog.find({ user: req.user.id })
            .sort({ date: -1 }) // Newest first
            .limit(14); // Limit to last 2 weeks for dashboard view

        // Reverse to show Oldest -> Newest on Chart
        res.json({ success: true, data: logs.reverse() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};