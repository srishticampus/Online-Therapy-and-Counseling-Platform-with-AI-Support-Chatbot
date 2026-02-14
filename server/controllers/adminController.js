const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MoodLog = require('../models/MoodLog');
// @desc    Get all counselors pending approval
// @route   GET /api/admin/pending-counselors
exports.getPendingCounselors = async (req, res) => {
    try {
        // Find counselors where isApproved is false
        const pending = await User.find({ role: 'counselor', isApproved: false }).select('-password');
        res.status(200).json({ success: true, count: pending.length, data: pending });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve a counselor
// @route   PUT /api/admin/approve/:id
exports.approveCounselor = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        user.isApproved = true;
        await user.save();

        res.status(200).json({ success: true, message: "Counselor approved successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject and delete a counselor
// @route   DELETE /api/admin/reject/:id
exports.rejectCounselor = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        // As per your requirement: Reject means deleting the user
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: "Counselor rejected and removed from system" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        // Exclude the 'admin' role itself if you want to.
        const users = await User.find({ role: { $in: ['user', 'counselor'] } }).select('-password -otp -otpExpires'); 
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Delete ANY User ---
// @route   DELETE /api/admin/delete-user/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ success: true, message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGlobalReports = async (req, res) => {
    try {
        // 1. Core Summary Stats (Verified/Active Only)
        const totalClients = await User.countDocuments({ role: 'user' });
        const activeCounselors = await User.countDocuments({ role: 'counselor', isApproved: true });
        
        const completedSessions = await Appointment.countDocuments({ status: 'completed' });
        const scheduledSessions = await Appointment.countDocuments({ status: 'scheduled' });

        // 2. Revenue Calculation ($200 per completed session)
        const totalRevenue = completedSessions * 200;

        // 3. Appointment Breakdown (Simplified Pie Chart)
        const appointmentData = [
            { name: 'Completed Sessions', value: completedSessions },
            { name: 'Upcoming Scheduled', value: scheduledSessions }
        ];

        // 4. GROWTH ANALYTICS (Last 6 Months Trend)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const revenueGrowth = await Appointment.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    revenue: { $sum: 200 }
                }
            }
        ]);

        // 5. FORMATTING THE CHART DATA
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const growthData = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const mIndex = d.getMonth() + 1;
            const year = d.getFullYear();

            const userMonth = userGrowth.find(u => u._id.month === mIndex && u._id.year === year);
            const revMonth = revenueGrowth.find(r => r._id.month === mIndex && r._id.year === year);

            growthData.push({
                month: months[d.getMonth()],
                users: userMonth ? userMonth.count : 0,
                revenue: revMonth ? revMonth.revenue : 0
            });
        }

        res.json({
            success: true,
            summary: {
                totalUsers: totalClients + activeCounselors,
                activeCounselors: activeCounselors,
                totalScheduled: scheduledSessions,
                totalRevenue
            },
            appointmentData,
            growthData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAdminDashboard = async (req, res) => {
    try {
        // 1. KPI Counts
        const totalClients = await User.countDocuments({ role: 'user' });
        const totalCounselors = await User.countDocuments({ role: 'counselor', isApproved: true });
        const totalRevenue = (await Appointment.countDocuments({ status: 'completed' })) * 200;

        // 2. Growth Chart Data (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. Specialization Breakdown (Pie Chart)
        const specBreakdown = await User.aggregate([
            { $match: { role: 'counselor', isApproved: true } },
            {
                $group: {
                    _id: "$specialization",
                    value: { $sum: 1 }
                }
            },
            { $project: { name: "$_id", value: 1, _id: 0 } }
        ]);

        // 4. Session Volume (Bar Chart - Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const sessionStats = await Appointment.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sessions: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            success: true,
            kpis: { totalClients, totalCounselors, totalRevenue },
            userGrowth,
            specBreakdown,
            sessionStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};