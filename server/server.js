require('dotenv').config(); // MUST BE AT THE VERY TOP
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db'); // Renamed for clarity

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const moodRoutes = require('./routes/moodRoutes');
const userRoute = require('./routes/userRoutes');
const contactRoute = require("./routes/contactRoutes");

const app = express();

// Connect to Database
connectDB(); // Call it as a function here

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/user', userRoute);
app.use('/api/contact', contactRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));