const Appointment = require('../models/Appointment');
const MoodLog = require('../models/MoodLog');

// @desc    Get aggregate stats for User Dashboard
// @route   GET /api/user/dashboard-stats
exports.getUserDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        // 1. Get Appointments Count & Next Session
        const appointments = await Appointment.find({ client: userId })
            .populate('counselor', 'name specialization profileImage')
            .sort({ date: 1 });

        const totalSessions = appointments.length;
        const nextSession = appointments.find(a => a.status === 'scheduled' && new Date(a.date) >= new Date());

        // 2. Get Mood Data for Chart (Last 7 entries)
        const moodLogs = await MoodLog.find({ user: userId })
            .sort({ date: -1 })
            .limit(7);

        // Calculate Average Mood (1-5 scale)
        const avgMood = moodLogs.length > 0 
            ? (moodLogs.reduce((acc, curr) => acc + curr.score, 0) / moodLogs.length).toFixed(1)
            : 0;

        // Format chart data for Recharts
        const chartData = [...moodLogs].reverse().map(log => ({
            name: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
            mood: log.score
        }));

        res.json({
            success: true,
            stats: {
                totalSessions,
                nextSession,
                avgMood,
                moodLabel: getMoodLabel(avgMood)
            },
            chartData,
            recentLogs: moodLogs.slice(0, 3)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Helper to describe mood score
function getMoodLabel(score) {
    if (score >= 4.5) return "Excellent";
    if (score >= 3.5) return "Good";
    if (score >= 2.5) return "Steady";
    if (score >= 1.5) return "Low";
    return "Struggling";
}