import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, Chip, CircularProgress, Tooltip } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VideocamIcon from '@mui/icons-material/Videocam';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/ViewAppointment.css';

const ViewAppoinment = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'

    // --- FETCH DATA ---
    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/appointments/my-bookings');
            console.log(res);
            
            if (res.data.success) {
                setAppointments(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to load your schedule.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    // --- ANIMATION ---
    useEffect(() => {
        if (!loading) {
            gsap.fromTo(".appt-card", 
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out", clearProps: "all" }
            );
        }
    }, [loading, filter]); // Re-run animation when filter changes

    // --- HANDLER: CANCEL ---
    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this session?")) return;
        const tid = toast.loading("Cancelling...");
        try {
            const res = await api.patch(`/appointments/cancel/${id}`);
            if (res.data.success) {
                toast.success("Appointment Cancelled", { id: tid });
                fetchAppointments(); // Refresh list
            }
        } catch (err) {
            toast.error("Could not cancel session", { id: tid });
        }
    };

    // --- HELPER: FILTER LOGIC ---
    const getFilteredAppointments = () => {
        const today = new Date();
        return appointments.filter(appt => {
            const apptDate = new Date(appt.date);
            if (filter === 'upcoming') {
                return (appt.status === 'scheduled' || appt.status === 'pending') && apptDate >= today.setHours(0,0,0,0);
            }
            if (filter === 'completed') {
                return appt.status === 'completed' || (apptDate < today && appt.status !== 'cancelled');
            }
            // if (filter === 'cancelled') {
            //     return appt.status === 'cancelled';
            // }
            return false;
        });
    };

    const displayList = getFilteredAppointments();

    // --- HELPER: FORMAT DATE ---
    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return {
            day: d.getDate(),
            month: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear()
        };
    };

    return (
        <div className="view-viewport">
            <div className="view-container">
                
                {/* HEADER */}
                <div className="view-header">
                    <Typography className="view-title">My Sessions</Typography>
                    <Typography color="textSecondary">Track your therapy journey and upcoming meetings.</Typography>
                </div>

                {/* TABS */}
                <div className="view-tabs">
                    <button 
                        className={`view-tab-btn ${filter === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button 
                        className={`view-tab-btn ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        History
                    </button>
                    {/* <button 
                        className={`view-tab-btn ${filter === 'cancelled' ? 'active' : ''}`}
                        onClick={() => setFilter('cancelled')}
                    >
                        Cancelled
                    </button> */}
                </div>

                {/* LIST AREA */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={10}>
                        <CircularProgress />
                    </Box>
                ) : displayList.length === 0 ? (
                    <div className="empty-history">
                        <CalendarMonthIcon sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                        <Typography variant="h6" fontWeight="700">No {filter} appointments</Typography>
                        <Typography variant="body2">Your schedule is clear.</Typography>
                    </div>
                ) : (
                    <div className="appt-list-wrapper">
                        {displayList.map((appt) => {
                            const dateObj = formatDate(appt.date);
                            return (
                                <div key={appt._id} className="appt-card">
                                    {/* Date Column */}
                                    <div className="appt-date-box">
                                        <span className="date-month">{dateObj.month}</span>
                                        <span className="date-day">{dateObj.day}</span>
                                        <span className="date-year">{dateObj.year}</span>
                                    </div>

                                    {/* Details Column */}
                                    <div className="appt-details">
                                        <div className="counselor-info">
                                            <Avatar 
                                                src={`http://localhost:5000/${appt.counselor?.profileImage?.replace(/\\/g, '/')}`} 
                                                className="counselor-avatar"
                                            >
                                                {appt.counselor?.name?.charAt(0)}
                                            </Avatar>
                                            <div>
                                                <Typography variant="h6" fontWeight="800" color="#0f172a">
                                                    {appt.counselor?.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" fontWeight="600">
                                                    {appt.counselor?.specialization || "Professional Counselor"}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={0.5} mt={0.5} color="#3b82f6">
                                                    <AccessTimeIcon sx={{ fontSize: 16 }} />
                                                    <Typography variant="body2" fontWeight="600">{appt.timeSlot}</Typography>
                                                </Box>
                                            </div>
                                        </div>

                                        {/* Actions Column */}
                                        <div className="appt-actions">
                                            <span className={`status-badge status-${appt.status}`}>
                                                {appt.status.toUpperCase()}
                                            </span>

                                            {appt.status === 'scheduled' && (
                                                <Button 
                                                    variant="contained" 
                                                    className="btn-join-meet"
                                                    startIcon={<VideocamIcon />}
                                                    onClick={() => window.open(appt.meetingLink || '#', '_blank')}
                                                    disabled={!appt.meetingLink}
                                                >
                                                    {appt.meetingLink ? "Join Session" : "Link Pending"}
                                                </Button>
                                            )}

                                            {/* Cancel Button only for Upcoming */}
                                            {/* {(appt.status === 'pending' || appt.status === 'scheduled') && (
                                                <Button 
                                                    size="small" 
                                                    startIcon={<CancelIcon />} 
                                                    className="btn-cancel-appt"
                                                    onClick={() => handleCancel(appt._id)}
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )} */}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewAppoinment;