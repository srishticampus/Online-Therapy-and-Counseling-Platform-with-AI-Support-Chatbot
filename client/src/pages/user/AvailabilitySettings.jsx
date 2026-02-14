import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Button, Paper, CircularProgress, 
    Chip, Divider, Grid, Zoom, IconButton, Tooltip 
} from '@mui/material';
import { LocalizationProvider, StaticDatePicker, StaticTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

// Icons
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

import '../../styles/AvailabilitySettings.css';

const AvailabilitySettings = () => {
    // --- STATE ---
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [selectedTime, setSelectedTime] = useState(dayjs().set('minute', 0));
    const [availability, setAvailability] = useState({});
    
    // Tracks which specific slots on the selected Date are already booked by clients
    const [bookedSlots, setBookedSlots] = useState([]); 
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const containerRef = useRef(null);

    // Get Logged In User
    const user = JSON.parse(localStorage.getItem('user'));

    // 1. Initial Load: Get Profile Availability
    useEffect(() => {
        const loadData = async () => {
            try {
                setFetching(true);
                const res = await api.get('/auth/profile'); 
                if (res.data.user?.availability) {
                    setAvailability(res.data.user.availability);
                }
            } catch (err) {
                toast.error("Failed to load schedule.");
            } finally {
                setFetching(false);
            }
        };
        loadData();

        // GSAP Entrance
        gsap.fromTo(".avail-card-anim", 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: "power3.out" }
        );
    }, []);

    // 2. Dynamic Check: Fetch Booked Slots when Date Changes
    useEffect(() => {
        const checkBookings = async () => {
            if (!user) return;
            const dateStr = selectedDate.format('YYYY-MM-DD');
            try {
                // We use the same API clients use to check availability
                const res = await api.get(`/appointments/availability/${user.id || user._id}?date=${dateStr}`);
                if (res.data.success) {
                    // Filter slots that have isBooked: true
                    const locked = res.data.slots.filter(s => s.isBooked).map(s => s.time);
                    setBookedSlots(locked);
                }
            } catch (err) {
                console.error("Could not verify bookings");
            }
        };
        checkBookings();
    }, [selectedDate, availability]); // Re-run if date or availability state changes

    const dateKey = selectedDate.format('YYYY-MM-DD');
    const currentDaySlots = availability[dateKey] || [];

    // 3. Add Slot Handler
    const handleAddSlot = () => {
        const timeStr = selectedTime.format('hh:mm A');
        
        if (currentDaySlots.includes(timeStr)) {
            return toast.error("Time slot already exists.");
        }
        
        // Sort chronologically
        const newSlots = [...currentDaySlots, timeStr].sort((a, b) => 
            dayjs(`2000-01-01 ${a}`).diff(dayjs(`2000-01-01 ${b}`))
        );

        setAvailability({ ...availability, [dateKey]: newSlots });
        toast.success(`Added ${timeStr}`);
    };

    // 4. Remove Slot Handler (With Lock Check)
    const handleRemoveSlot = (timeToRemove) => {
        if (bookedSlots.includes(timeToRemove)) {
            return toast.error("Cannot delete: Slot is booked by a client.", { icon: '🔒' });
        }

        const updatedSlots = currentDaySlots.filter(t => t !== timeToRemove);
        const newAvail = { ...availability };
        
        if (updatedSlots.length === 0) delete newAvail[dateKey];
        else newAvail[dateKey] = updatedSlots;
        
        setAvailability(newAvail);
    };

    // 5. Save Changes to Backend
    const handleSave = async () => {
        setLoading(true);
        const tid = toast.loading("Publishing schedule...");
        try {
            const res = await api.post('/appointments/set-slots', { availabilityArray: availability });
            if (res.data.success) toast.success("Schedule Live!", { id: tid });
        } catch (err) {
            // Backend double-check will catch hacks/race conditions
            toast.error(err.response?.data?.message || "Sync failed.", { id: tid });
            // Reload page to ensure data consistency
            setTimeout(() => window.location.reload(), 2000);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
            <CircularProgress thickness={5} sx={{ color: '#3b82f6' }} />
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box className="avail-viewport" ref={containerRef}>
                
                {/* --- HEADER --- */}
                <Box className="avail-header">
                    <div>
                        <Typography variant="h4" className="avail-title">Availability Manager</Typography>
                        <Typography variant="body2" color="textSecondary">
                            Configure your working hours. Locked slots indicate active bookings.
                        </Typography>
                    </div>
                    <Button 
                        variant="contained" 
                        disabled={loading}
                        onClick={handleSave}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadRoundedIcon />}
                        className="avail-save-btn"
                    >
                        {loading ? "Publishing..." : "Save Changes"}
                    </Button>
                </Box>

                {/* --- MAIN WORKSPACE GRID --- */}
                <Grid container spacing={3} alignItems="stretch">
                    
                    {/* LEFT: CALENDAR CARD */}
                    <Grid item xs={12} md={4} className="avail-card-anim">
                        <Paper className="avail-card left-card">
                            <Box className="card-header">
                                <TodayRoundedIcon className="card-icon" />
                                <Typography variant="h6" fontWeight="800">Date Selection</Typography>
                            </Box>
                            
                            <Box className="calendar-container">
                                <StaticDatePicker
                                    displayStaticWrapperAs="desktop"
                                    value={selectedDate}
                                    onChange={(newValue) => setSelectedDate(newValue)}
                                    minDate={dayjs()}
                                    slotProps={{
                                        actionBar: { actions: [] }, // REMOVES OK/CANCEL BUTTONS
                                        toolbar: { hidden: true }
                                    }}
                                />
                            </Box>

                            <Box p={3} bgcolor="#f8fafc" mt="auto" borderTop="1px solid #e2e8f0">
                                <Typography variant="caption" color="textSecondary" fontWeight="600">
                                    SELECTED DATE
                                </Typography>
                                <Typography variant="h5" color="#0f172a" fontWeight="900">
                                    {selectedDate.format('MMM DD, YYYY')}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* RIGHT: TIME SLOTS CARD */}
                    <Grid item xs={12} md={8} className="avail-card-anim">
                        <Paper className="avail-card right-card">
                            
                            <Box className="card-header-split">
                                <Box display="flex" alignItems="center" gap={1.5}>
                                    <AccessTimeFilledRoundedIcon className="card-icon" />
                                    <Typography variant="h6" fontWeight="800">Time Configuration</Typography>
                                </Box>
                                <Chip 
                                    label={`${currentDaySlots.length} Active Slots`} 
                                    className="slot-counter"
                                />
                            </Box>

                            <Grid container spacing={0} sx={{ height: '100%' }}>
                                
                                {/* COLUMN A: CLOCK PICKER */}
                                <Grid item xs={12} lg={6} sx={{ borderRight: { lg: '1px solid #f1f5f9' }, p: 3 }}>
                                    <div className="clock-wrapper">
                                        <StaticTimePicker
                                            displayStaticWrapperAs="mobile"
                                            value={selectedTime}
                                            onChange={(val) => setSelectedTime(val)}
                                            slotProps={{ actionBar: { actions: [] } }}
                                        />
                                    </div>
                                    <Button 
                                        fullWidth 
                                        variant="contained" 
                                        onClick={handleAddSlot}
                                        startIcon={<AddCircleRoundedIcon />}
                                        className="btn-add-time"
                                    >
                                        Add {selectedTime.format('hh:mm A')}
                                    </Button>
                                </Grid>

                                {/* COLUMN B: SLOT LIST */}
                                <Grid item xs={12} lg={6} sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="overline" fontWeight="800" color="textSecondary" mb={2}>
                                        {selectedDate.format('dddd')} Schedule
                                    </Typography>

                                    <Box className="slots-scroll-container">
                                        {currentDaySlots.length > 0 ? (
                                            <div className="slots-grid-list">
                                                {currentDaySlots.map((time, idx) => {
                                                    const isLocked = bookedSlots.includes(time);
                                                    
                                                    return (
                                                        <Zoom in={true} key={idx} style={{ transitionDelay: `${idx * 50}ms` }}>
                                                            <div className={`slot-pill ${isLocked ? 'locked' : ''}`}>
                                                                <span className="slot-time-text">{time}</span>
                                                                
                                                                {isLocked ? (
                                                                    <Tooltip title="Booked by Client - Cannot Delete">
                                                                        <LockRoundedIcon sx={{ fontSize: 16, color: '#b45309' }} />
                                                                    </Tooltip>
                                                                ) : (
                                                                    <IconButton 
                                                                        size="small" 
                                                                        onClick={() => handleRemoveSlot(time)}
                                                                        className="slot-delete-btn"
                                                                    >
                                                                        <DeleteForeverRoundedIcon fontSize="small" />
                                                                    </IconButton>
                                                                )}
                                                            </div>
                                                        </Zoom>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="empty-slot-state">
                                                <EventAvailableRoundedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                                                <Typography variant="body2" fontWeight="600" color="textSecondary">
                                                    No slots allocated.
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Use the clock to add times.
                                                </Typography>
                                            </div>
                                        )}
                                    </Box>
                                </Grid>

                            </Grid>
                        </Paper>
                    </Grid>

                </Grid>
            </Box>
        </LocalizationProvider>
    );
};

export default AvailabilitySettings;