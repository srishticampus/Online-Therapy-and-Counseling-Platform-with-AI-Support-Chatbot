import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, CircularProgress, Divider, Chip } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';

// Professional Icons
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';

import '../../styles/UserDashboard.css';

const UserDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const res = await api.get('/user/dashboard-stats');
                if (res.data.success) setData(res.data);
            } catch (err) {
                toast.error("Dashboard failed to synchronize.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    useEffect(() => {
        if (!loading) {
            gsap.from(".user-dash-animate", {
                opacity: 0,
                y: 15,
                stagger: 0.1,
                duration: 0.5,
                ease: "power2.out",
                clearProps: "all"
            });
        }
    }, [loading]);

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="75vh">
            <CircularProgress thickness={5} sx={{ color: '#3b82f6' }} />
        </Box>
    );

    const { stats, chartData } = data;

    return (
        <Box className="user-dash-viewport">
            
            {/* 1. COMPACT GREETING */}
            <Box mb={3} className="user-dash-animate">
                <Typography variant="h5" fontWeight="900" color="var(--user-dash-navy)">
                    Welcome back, {user.name.split(' ')[0]}
                </Typography>
                <Typography variant="body2" color="var(--user-dash-slate)">
                    Your personalized wellness summary is ready.
                </Typography>
            </Box>

            {/* 2. STATS ROW (Aligned horizontally) */}
            <div className="user-dash-stat-row">
                <div className="user-dash-stat-box user-dash-animate">
                    <div className="user-dash-icon-wrapper" style={{ background: '#fee2e2', color: '#ef4444' }}>
                        <FavoriteRoundedIcon fontSize="small" />
                    </div>
                    <div>
                        <Typography className="user-dash-stat-label">Mood Index</Typography>
                        <Typography className="user-dash-stat-value">{stats.avgMood}/5</Typography>
                    </div>
                </div>

                <div className="user-dash-stat-box user-dash-animate">
                    <div className="user-dash-icon-wrapper" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                        <CalendarMonthRoundedIcon fontSize="small" />
                    </div>
                    <div>
                        <Typography className="user-dash-stat-label">Total Sessions</Typography>
                        <Typography className="user-dash-stat-value">{stats.totalSessions}</Typography>
                    </div>
                </div>

                <div className="user-dash-stat-box user-dash-animate">
                    <div className="user-dash-icon-wrapper" style={{ background: '#f0fdf4', color: '#10b981' }}>
                        <BoltRoundedIcon fontSize="small" />
                    </div>
                    <div>
                        <Typography className="user-dash-stat-label">System State</Typography>
                        <Typography className="user-dash-stat-value">Active</Typography>
                    </div>
                </div>
            </div>

            {/* 3. MAIN DASHBOARD GRID */}
            <div className="user-dash-main-grid">
                
                {/* LEFT: CHART SECTION */}
                <div className="user-dash-card user-dash-animate">
                    <Typography className="user-dash-card-title">Mood Analytics</Typography>
                    <Box height={320}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                                <YAxis hide domain={[0, 5]} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="mood" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </div>

                {/* RIGHT: APPOINTMENTS & ACTIONS */}
                <div className="user-dash-card user-dash-animate">
                    <Typography className="user-dash-card-title">Upcoming Plan</Typography>
                    
                    {stats.nextSession ? (
                        <div className="user-dash-appointment-box">
                            <div className="user-dash-appt-header">
                                <Box display="flex" gap={1.5} alignItems="center">
                                    <Avatar 
                                        src={`http://localhost:5000/${stats.nextSession.counselor.profileImage?.replace(/\\/g, '/')}`}
                                        sx={{ width: 40, height: 40 }}
                                    />
                                    <Box>
                                        <Typography variant="body2" className="user-dash-doctor-name">{stats.nextSession.counselor.name}</Typography>
                                        <Typography variant="caption" color="textSecondary">{stats.nextSession.counselor.specialization}</Typography>
                                    </Box>
                                </Box>
                                <Chip label="Confirmed" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 800, fontSize: '0.65rem' }} />
                            </div>
                            
                            <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                            
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <AccessTimeRoundedIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                                    <Typography variant="body2" fontWeight="700">{stats.nextSession.timeSlot}</Typography>
                                </Box>
                                <Typography variant="caption" fontWeight="600">{new Date(stats.nextSession.date).toLocaleDateString()}</Typography>
                            </Box>
                            
                            <Button 
                                fullWidth variant="contained" 
                                size="small"
                                onClick={() => navigate('/user/appointments')}
                                sx={{ mt: 2, bgcolor: 'var(--user-dash-navy)', borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                            >
                                Details
                            </Button>
                        </div>
                    ) : (
                        <Box py={3} textAlign="center" bgcolor="#f8fafc" borderRadius="14px" mb={3} border="1px dashed #e2e8f0">
                            <Typography variant="caption" color="textSecondary">No scheduled sessions</Typography>
                        </Box>
                    )}

                    <Typography className="user-dash-card-title" sx={{ mt: 4 }}>Quick Access</Typography>
                    <div className="user-dash-action-group">
                        <Button 
                            className="user-dash-action-btn"
                            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
                            startIcon={<AutoAwesomeRoundedIcon color="primary" />}
                            onClick={() => navigate('/user/ai-chat')}
                        >
                            AI Companion Chat
                        </Button>
                        <Button 
                            className="user-dash-action-btn"
                            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
                            startIcon={<CalendarMonthRoundedIcon color="primary" />}
                            onClick={() => navigate('/user/book')}
                        >
                            Schedule Therapy
                        </Button>
                    </div>
                </div>

            </div>
        </Box>
    );
};

export default UserDashboard;