const express = require('express');
const router = express.Router();
const { 
    getPendingCounselors, 
    approveCounselor, 
    rejectCounselor, 
    getAllUsers,
    deleteUser,
    getGlobalReports,
    getAdminDashboard
} = require('../controllers/adminController');

// All routes here require Admin privileges

router.get('/pending-counselors', getPendingCounselors);
router.put('/approve/:id', approveCounselor);
router.delete('/reject/:id', rejectCounselor);
router.get('/all-users', getAllUsers);
router.delete('/delete-user/:id', deleteUser);
router.get('/reports',getGlobalReports);
router.get('/dashboard-data',getAdminDashboard);
module.exports = router;