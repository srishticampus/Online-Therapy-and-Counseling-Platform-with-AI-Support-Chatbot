const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');
const User = require('../models/User');

// --- PUBLIC/USER APIs ---

// @desc    Get all approved counselors
// @route   GET /api/appointments/counselors
// @access  Public (or Protected)
exports.getAllCounselors = async (req, res) => {
    try {
        const { specialization, minExperience } = req.query;
        let query = { role: 'counselor', isApproved: true };

        if (specialization) {
            query.specialization = { $regex: specialization, $options: 'i' };
        }

        if (minExperience) {
            query.experience = { $gte: Number(minExperience) };
        }

        const counselors = await User.find(query)
            .select('name email profileImage specialization experience availability');

        res.json({ success: true, count: counselors.length, data: counselors });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get counselor availability for a date
// @route   GET /api/appointments/availability/:counselorId
// @query   date (YYYY-MM-DD)
// @access  Public
exports.getCounselorAvailability = async (req, res) => {
    try {
        const { counselorId } = req.params;
        const { date } = req.query; // Expecting YYYY-MM-DD from frontend

        if (!date) return res.status(400).json({ error: "Date is required" });

        const counselor = await User.findById(counselorId);
        if (!counselor || counselor.role !== 'counselor') {
            return res.status(404).json({ error: "Counselor not found" });
        }

        // --- THE FIX: LOOK FOR THE DATE KEY ---
        // Instead of dayName (Mon/Tue), we use the date string directly
        // because that is how we saved it in the AvailabilitySettings page.
        const allSlots = counselor.availability?.[date] || [];

        if (!allSlots || allSlots.length === 0) {
            // If no specific slots for this date, return empty
            return res.json({ success: true, slots: [] });
        }

        // 3. Find existing bookings for this specific date to mark them as 'isBooked'
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedAppointments = await Appointment.find({
            counselor: counselorId,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['pending', 'scheduled', 'completed'] }
        }).select('timeSlot');

        const bookedTimes = bookedAppointments.map(b => b.timeSlot);

        // 4. Map the defined slots to objects with the booking status
        const finalSlots = allSlots.map(time => ({
            time: time,
            isBooked: bookedTimes.includes(time)
        }));

        res.json({ success: true, slots: finalSlots });

    } catch (error) {
        console.error("Availability Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- BOOKING APIs (Client) ---

// @desc    Book a new appointment
// @route   POST /api/appointments/book
// @access  Private (User)

exports.bookAppointment = async (req, res) => {
    try {
        const { counselorId, date, timeSlot, issue } = req.body;
        
        // Ensure you are using the User ID from the token
        const clientId = req.user._id || req.user.id; 

        // Validation: Check if IDs are valid
        if (!mongoose.Types.ObjectId.isValid(counselorId)) {
            return res.status(400).json({ error: "Invalid Counselor ID" });
        }

        // Create the document
        const newAppointment = new Appointment({
            client: clientId,
            counselor: counselorId,
            date: new Date(date), // Ensure it's a Date object
            timeSlot,
            issue,
            status: 'scheduled',
            paymentStatus: 'paid'
        });

        const savedAppointment = await newAppointment.save();

        res.status(201).json({ 
            success: true, 
            message: "Appointment saved to database!", 
            data: savedAppointment 
        });
    } catch (error) {
        console.error("Booking DB Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get logged-in user's appointments
// @route   GET /api/appointments/my-bookings
// @access  Private (User)
exports.getMyAppointments = async (req, res) => {
    try {
        const { status } = req.query;
        let query = { client: req.user.id };

        if (status) query.status = status;

        const appointments = await Appointment.find(query)
            .populate('counselor', 'name email profileImage specialization')
            .sort({ date: 1 });

        res.json({ success: true, count: appointments.length, data: appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- PAYMENT & BILLING APIs ---

// @desc    Get Paid Appointments
// @route   GET /api/appointments/billing/paid
// @access  Private
exports.getPaidAppointments = async (req, res) => {
    try {
        const query = {
            paymentStatus: 'paid',
            $or: [{ client: req.user.id }, { counselor: req.user.id }]
        };

        const appointments = await Appointment.find(query)
            .populate('client', 'name email')
            .populate('counselor', 'name email specialization')
            .sort({ date: -1 });

        res.json({ success: true, count: appointments.length, data: appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Unpaid Appointments
// @route   GET /api/appointments/billing/unpaid
// @access  Private
exports.getUnpaidAppointments = async (req, res) => {
    try {
        const query = {
            paymentStatus: 'unpaid',
            $or: [{ client: req.user.id }, { counselor: req.user.id }]
        };

        const appointments = await Appointment.find(query)
            .populate('client', 'name email')
            .populate('counselor', 'name email specialization')
            .sort({ date: -1 });

        res.json({ success: true, count: appointments.length, data: appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Process Payment for Appointment
// @route   POST /api/appointments/pay/:id
// @access  Private (User)
exports.processPayment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ error: "Appointment not found" });

        // Check ownership
        if (appointment.client.toString() !== req.user.id) {
            return res.status(403).json({ error: "Not authorized" });
        }

        if (appointment.paymentStatus === 'paid') {
            return res.status(400).json({ error: "Appointment already paid" });
        }

        // Simulate Charge
        appointment.paymentStatus = 'paid';
        // appointment.status = 'scheduled'; // Optionally auto-confirm

        await appointment.save();

        res.json({ success: true, message: "Payment successful", data: appointment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Cancel appointment
// @route   PATCH /api/appointments/cancel/:id
// @access  Private (User)
exports.cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            client: req.user.id
        });

        if (!appointment) return res.status(404).json({ error: "Appointment not found" });

        if (appointment.status === 'completed') {
            return res.status(400).json({ error: "Cannot cancel completed appointment" });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.json({ success: true, message: "Appointment cancelled", data: appointment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- MANAGEMENT APIs (Counselor) ---

// @desc    Get counselor's schedule
// @route   GET /api/appointments/schedule
// @access  Private (Counselor)
exports.getCounselorSchedule = async (req, res) => {
    try {
        // Ensure role check if not done in middleware
        // if (req.user.role !== 'counselor') ...

        const appointments = await Appointment.find({ counselor: req.user.id })
            .populate('client', 'name email profileImage')
            .sort({ date: 1, timeSlot: 1 });

        // Optional: Group by date if needed, but array is usually fine
        res.json({ success: true, data: appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update status (Approve/Reject/Link)
// @route   PUT /api/appointments/status/:id
// @access  Private (Counselor)
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status, notes, meetingLink } = req.body;
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            counselor: req.user.id
        });

        if (!appointment) return res.status(404).json({ error: "Appointment not found" });

        if (status) appointment.status = status; // scheduled, cancelled
        if (notes) appointment.notes = notes;
        if (meetingLink) appointment.meetingLink = meetingLink;

        await appointment.save();

        res.json({ success: true, message: `Appointment ${status}`, data: appointment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Mark completed
// @route   PATCH /api/appointments/complete/:id
// @access  Private (Counselor)
exports.completeAppointment = async (req, res) => {
    try {
        const { sessionNotes } = req.body || {}; 
        
        const appointmentId = req.params.id;
        const counselorId = req.user._id || req.user.id;

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({ error: "Invalid Appointment ID" });
        }

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            counselor: counselorId
        });

        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        appointment.status = 'completed';
        if (sessionNotes) {
            appointment.notes = sessionNotes;
        }

        await appointment.save();
        res.status(200).json({ success: true, message: "Session completed" });

    } catch (error) {
        console.error("Complete Appointment Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// @desc    Set Availability
// @route   POST /api/appointments/set-slots
// @access  Private (Counselor)
exports.setAvailability = async (req, res) => {
    try {
        const { availabilityArray } = req.body; // The new schedule the counselor wants to save
        const counselorId = req.user._id || req.user.id;

        // 1. Fetch all ACTIVE appointments (pending or scheduled) for this counselor
        // We only care about future dates ideally, but checking all is safer
        const activeAppointments = await Appointment.find({
            counselor: counselorId,
            status: { $in: ['pending', 'scheduled'] },
            date: { $gte: new Date() } // Only check future appointments
        });

        // 2. Validate: Ensure no active appointment slot has been removed
        for (const appt of activeAppointments) {
            const dateKey = appt.date.toISOString().split('T')[0]; // Format YYYY-MM-DD
            const bookedTime = appt.timeSlot;

            // Check if this date exists in the new availability
            if (!availabilityArray[dateKey] || !availabilityArray[dateKey].includes(bookedTime)) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot remove ${bookedTime} on ${dateKey}. It is currently booked by a client.` 
                });
            }
        }

        // 3. If validation passes, save the new availability
        const user = await User.findById(counselorId);
        user.availability = availabilityArray;
        user.markModified('availability');
        await user.save();

        res.json({ success: true, message: "Availability updated successfully", data: user.availability });
    } catch (error) {
        console.error("Availability Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- ADMIN APIs ---

// @desc    Get all appointments
// @route   GET /api/appointments/admin/all
// @access  Private (Admin)
exports.getAllAppointmentsAdmin = async (req, res) => {
    try {
        const appointments = await Appointment.find({})
            .populate('client', 'name email profileImage')
            .populate('counselor', 'name email specialization profileImage')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: appointments.length, data: appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteDayAvailability = async (req, res) => {
    try {
        const { date } = req.params; // Expecting YYYY-MM-DD
        const user = await User.findById(req.user._id || req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if the date exists in availability
        if (user.availability && user.availability[date]) {
            // Delete the key for that specific date
            delete user.availability[date];
            
            // Tell Mongoose the object has changed
            user.markModified('availability');
            await user.save();

            return res.json({ 
                success: true, 
                message: `Availability for ${date} cleared successfully`,
                data: user.availability 
            });
        } else {
            return res.status(404).json({ message: "No slots found for this date" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get aggregate stats for Counselor Dashboard
// @route   GET /api/appointments/counselor/dashboard-stats
exports.getCounselorDashboardStats = async (req, res) => {
    try {
        const counselorId = req.user._id || req.user.id;

        // 1. Fetch all non-cancelled appointments for this counselor
        const appointments = await Appointment.find({ 
            counselor: counselorId,
            status: { $ne: 'cancelled' }
        }).populate('client', 'name profileImage');

        // 2. Calculate KPI Metrics
        const totalClients = [...new Set(appointments.map(a => a.client?._id.toString()))].length;
        const totalScheduled = appointments.filter(a => a.status === 'scheduled').length;
        const totalCompleted = appointments.filter(a => a.status === 'completed').length;
        const totalRevenue = totalCompleted * 200; // $200 per completed session

        // 3. Prepare Graph Data (Last 7 Days)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const chartData = last7Days.map(date => {
            const dayAppts = appointments.filter(a => a.date.toISOString().split('T')[0] === date);
            return {
                name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                sessions: dayAppts.length,
                revenue: dayAppts.filter(a => a.status === 'completed').length * 200
            };
        });

        res.json({
            success: true,
            stats: { totalClients, totalScheduled, totalCompleted, totalRevenue },
            chartData,
            recentActivity: appointments.slice(0, 5) // Last 5 activities
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};