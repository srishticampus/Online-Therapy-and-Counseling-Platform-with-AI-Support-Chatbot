import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, CircularProgress, Button, Chip, Paper } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

// Icons
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import '../../styles/CounselorDashboard.css';

const CounselorDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await api.get('/appointments/counselor/dashboard-stats');
            if (res.data.success) setData(res.data);
        } catch (err) {
            toast.error("Dashboard failed to sync with cloud.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // GSAP Entrance
    useEffect(() => {
        if (!loading) {
            gsap.from(".dash-card-anim", {
                opacity: 0,
                y: 20,
                stagger: 0.1,
                duration: 0.6,
                ease: "power2.out"
            });
        }
    }, [loading]);

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress thickness={5} />
        </Box>
    );

    const { stats, chartData, recentActivity } = data;

    return (
        <Box className="dash-viewport">
            {/* WELCOME HEADER */}
            <Box mb={5} className="dash-card-anim">
                <Typography variant="h4" fontWeight="900" color="#0f172a">Practice Analytics</Typography>
                <Typography color="textSecondary">Overview of your professional clinical performance.</Typography>
            </Box>

            {/* --- KPI STATS GRID --- */}
            <div className="dash-stats-grid">
                {/* Total Clients */}
                <div className="dash-stat-card dash-card-anim">
                    <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        <PeopleRoundedIcon />
                    </div>
                    <div>
                        <Typography variant="h4" fontWeight="900">{stats.totalClients}</Typography>
                        <Typography variant="caption" fontWeight="800" color="textSecondary">TOTAL CLIENTS</Typography>
                    </div>
                </div>

                {/* Scheduled */}
                <div className="dash-stat-card dash-card-anim">
                    <div className="stat-icon-wrapper" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                        <EventAvailableRoundedIcon />
                    </div>
                    <div>
                        <Typography variant="h4" fontWeight="900">{stats.totalScheduled}</Typography>
                        <Typography variant="caption" fontWeight="800" color="textSecondary">TOTAL SCHEDULED</Typography>
                    </div>
                </div>

                {/* Completed */}
                <div className="dash-stat-card dash-card-anim">
                    <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#10b981' }}>
                        <CheckCircleRoundedIcon />
                    </div>
                    <div>
                        <Typography variant="h4" fontWeight="900">{stats.totalCompleted}</Typography>
                        <Typography variant="caption" fontWeight="800" color="textSecondary">COMPLETED</Typography>
                    </div>
                </div>

                {/* Revenue */}
                <div className="dash-stat-card dash-card-anim">
                    <div className="stat-icon-wrapper" style={{ background: '#fff7ed', color: '#f97316' }}>
                        <PaymentsRoundedIcon />
                    </div>
                    <div>
                        <Typography variant="h4" fontWeight="900">${stats.totalRevenue}</Typography>
                        <Typography variant="caption" fontWeight="800" color="textSecondary">TOTAL REVENUE</Typography>
                    </div>
                </div>
            </div>

            {/* --- GRAPHS SECTION --- */}
            <Box className="dash-main-row">
                {/* Session Trend Chart */}
                <Paper className="dash-content-card dash-card-anim" elevation={0}>
                    <Box display="flex" justifyContent="space-between" mb={4}>
                        <Typography variant="h6" fontWeight="800">Session Activity</Typography>
                        <Chip icon={<TrendingUpIcon />} label="Weekly Trend" size="small" color="success" variant="outlined" />
                    </Box>
                    <Box height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                {/* Recent Clients mini-list */}
                <Paper className="dash-content-card dash-card-anim" elevation={0}>
                    <Typography variant="h6" fontWeight="800" mb={3}>Quick Overview</Typography>
                    <div className="activity-list">
                        {recentActivity.map((act) => (
                            <Box key={act._id} display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
                                <Box display="flex" alignItems="center" gap={1.5}>
                                    <Avatar 
                                        src={`http://localhost:5000/${act.client?.profileImage?.replace(/\\/g, '/')}`}
                                        sx={{ width: 35, height: 35 }}
                                    />
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="700" lineHeight={1.2}>{act.client?.name}</Typography>
                                        <Typography variant="caption" color="textSecondary">{act.timeSlot}</Typography>
                                    </Box>
                                </Box>
                                <Chip 
                                    label={act.status} 
                                    size="small" 
                                    sx={{ 
                                        fontSize: '0.6rem', fontWeight: 900, 
                                        bgcolor: act.status === 'completed' ? '#dcfce7' : '#eff6ff',
                                        color: act.status === 'completed' ? '#16a34a' : '#3b82f6'
                                    }} 
                                />
                            </Box>
                        ))}
                    </div>
                </Paper>
            </Box>
        </Box>
    );
};

export default CounselorDashboard;