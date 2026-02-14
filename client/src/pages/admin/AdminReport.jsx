import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, CircularProgress, Divider, Paper } from '@mui/material';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

// Icons
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';

import '../../styles/AdminReport.css';

const COLORS = ['#10b981', '#3b82f6']; // Green for Completed, Blue for Scheduled

const AdminReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/reports');
            if (res.data.success) setData(res.data);
        } catch (err) {
            toast.error("Failed to sync system analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (!loading) {
            gsap.from(".admin-rep-anim", {
                opacity: 0,
                y: 20,
                stagger: 0.1,
                duration: 0.6,
                ease: "power2.out",
                clearProps: "all"
            });
        }
    }, [loading]);

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
            <CircularProgress thickness={5} />
        </Box>
    );

    const { summary, appointmentData, growthData } = data;

    return (
        <Box className="admin-rep-viewport">
            
            {/* HEADER */}
            <div className="admin-rep-header admin-rep-anim">
                <Typography className="admin-rep-title" variant="h4">Platform Intelligence</Typography>
                <Typography variant="body2" color="textSecondary">
                    Consolidated real-time data from the MindHeal therapist network.
                </Typography>
            </div>

            {/* KPI STATS GRID */}
            <div className="admin-rep-stats-grid">
                {/* Total Reach */}
                <div className="admin-rep-stat-card admin-rep-anim">
                    <div className="admin-rep-icon-sq" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        <GroupRoundedIcon />
                    </div>
                    <div>
                        <Typography className="admin-rep-stat-label">Total Reach</Typography>
                        <Typography className="admin-rep-stat-val">{summary.totalUsers}</Typography>
                    </div>
                </div>

                {/* Active Doctors */}
                <div className="admin-rep-stat-card admin-rep-anim">
                    <div className="admin-rep-icon-sq" style={{ background: '#f0fdf4', color: '#10b981' }}>
                        <VerifiedUserRoundedIcon />
                    </div>
                    <div>
                        <Typography className="admin-rep-stat-label">Active Doctors</Typography>
                        <Typography className="admin-rep-stat-val">{summary.activeCounselors}</Typography>
                    </div>
                </div>

                {/* Scheduled */}
                <div className="admin-rep-stat-card admin-rep-anim">
                    <div className="admin-rep-icon-sq" style={{ background: '#fff7ed', color: '#f59e0b' }}>
                        <EventAvailableRoundedIcon />
                    </div>
                    <div>
                        <Typography className="admin-rep-stat-label">Scheduled Sessions</Typography>
                        <Typography className="admin-rep-stat-val">{summary.totalScheduled}</Typography>
                    </div>
                </div>

                {/* Revenue */}
                <div className="admin-rep-stat-card admin-rep-anim">
                    <div className="admin-rep-icon-sq" style={{ background: '#faf5ff', color: '#a855f7' }}>
                        <PaymentsRoundedIcon />
                    </div>
                    <div>
                        <Typography className="admin-rep-stat-label">Total Revenue</Typography>
                        <Typography className="admin-rep-stat-val">${summary.totalRevenue.toLocaleString()}</Typography>
                    </div>
                </div>
            </div>

            {/* MAIN CHARTS SECTION */}
            <div className="admin-rep-main-grid">
                
                {/* REVENUE GROWTH AREA CHART */}
                <div className="admin-rep-chart-box admin-rep-anim">
                    <Typography variant="h6" fontWeight="800" mb={4}>Revenue Trajectory</Typography>
                    <Box height={350}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </div>

                {/* SESSION DONUT CHART */}
                <div className="admin-rep-chart-box admin-rep-anim">
                    <Typography variant="h6" fontWeight="800" mb={3}>Booking Health</Typography>
                    <Box height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={appointmentData}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {appointmentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="caption" color="textSecondary" align="center" display="block">
                        * Comparison between completed sessions and upcoming sessions.
                    </Typography>
                </div>

            </div>
        </Box>
    );
};

export default AdminReport;