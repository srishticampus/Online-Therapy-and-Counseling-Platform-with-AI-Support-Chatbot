const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public
router.get('/counselors', appointmentController.getAllCounselors);
router.get('/availability/:counselorId', appointmentController.getCounselorAvailability);

// Client / User
router.post('/book', protect, appointmentController.bookAppointment);
router.post('/pay/:id', protect, appointmentController.processPayment); // New
router.get('/my-bookings', protect, appointmentController.getMyAppointments);
router.get('/billing/paid', protect, appointmentController.getPaidAppointments); // New
router.get('/billing/unpaid', protect, appointmentController.getUnpaidAppointments); // New
router.patch('/cancel/:id', protect, appointmentController.cancelAppointment);

// Counselor
// Need a counselor middleware ideally, but for now we rely on controller checks or general protect
router.get('/schedule', protect, appointmentController.getCounselorSchedule);
router.put('/status/:id', protect, appointmentController.updateAppointmentStatus);
router.patch('/complete/:id', protect, appointmentController.completeAppointment);
router.post('/set-slots', protect, appointmentController.setAvailability);
router.delete('/availability/:date', protect, appointmentController.deleteDayAvailability);
// Admin
router.get('/admin/all', appointmentController.getAllAppointmentsAdmin);
router.get('/counselor/dashboard-stats', protect, appointmentController.getCounselorDashboardStats);
module.exports = router;
