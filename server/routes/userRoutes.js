const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserDashboardStats } = require('../controllers/userController');

router.get('/dashboard-stats', protect, getUserDashboardStats);

module.exports = router;