import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, Grid } from '@mui/material';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

// Icons
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';

import '../../styles/AdminDashboard.css';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/reports'); 
            if (res.data.success) setData(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to sync system analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnalytics(); }, []);

    useEffect(() => {
        if (!loading && data) {
            gsap.from(".dash-anim", {
                opacity: 0,
                y: 15,
                stagger: 0.08,
                duration: 0.5,
                ease: "power3.out",
                clearProps: "all"
            });
        }
    }, [loading, data]);

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="75vh">
            <CircularProgress thickness={5} size={50} sx={{ color: '#3b82f6' }} />
        </Box>
    );

    const { summary, appointmentData, growthData } = data;
    const safeGrowthData = growthData || [];
    const safeApptData = appointmentData || [];

    // --- Custom Chart Tooltip for Pro Look ---
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{label}</p>
                    <p className="tooltip-value">
                        {payload[0].value.toLocaleString()} 
                        {payload[0].dataKey === 'revenue' && ' USD'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Box className="admin-dash-viewport">
            
            {/* 1. HEADER */}
            <div className="admin-dash-header dash-anim">
                <div>
                    <Typography variant="h4" className="dash-title">Mission Control</Typography>
                    <Typography variant="body1" className="dash-subtitle">
                        Overview of platform metrics and financial performance.
                    </Typography>
                </div>
                <div className="header-date">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* 2. KPI CARDS */}
            <div className="admin-dash-stats-grid">
                <StatCard 
                    icon={<GroupRoundedIcon />} 
                    color="#3b82f6" 
                    bg="#eff6ff" 
                    label="Total Users" 
                    value={summary.totalUsers} 
                />
                <StatCard 
                    icon={<VerifiedUserRoundedIcon />} 
                    color="#10b981" 
                    bg="#f0fdf4" 
                    label="Counselors" 
                    value={summary.activeCounselors} 
                />
                <StatCard 
                    icon={<EventAvailableRoundedIcon />} 
                    color="#f59e0b" 
                    bg="#fff7ed" 
                    label="Scheduled" 
                    value={summary.totalScheduled || 0} 
                />
                <StatCard 
                    icon={<PaymentsRoundedIcon />} 
                    color="#8b5cf6" 
                    bg="#faf5ff" 
                    label="Revenue" 
                    value={`$${summary.totalRevenue?.toLocaleString() || 0}`} 
                />
            </div>

            {/* 3. MAIN ANALYTICS ROW */}
            <div className="admin-dash-main-grid">
                
                {/* AREA CHART */}
                <div className="admin-chart-card dash-anim">
                    <div className="chart-header">
                        <div>
                            <Typography className="card-title">Financial Growth</Typography>
                            <Typography className="card-subtitle">Monthly revenue trends</Typography>
                        </div>
                        <div className="icon-wrapper"><TrendingUpIcon /></div>
                    </div>
                    <Box height={300} mt={2}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={safeGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </div>

                {/* PIE CHART */}
                <div className="admin-chart-card dash-anim">
                    <div className="chart-header">
                        <div>
                            <Typography className="card-title">Session Status</Typography>
                            <Typography className="card-subtitle">Appointment distribution</Typography>
                        </div>
                        <div className="icon-wrapper"><PieChartIcon /></div>
                    </div>
                    <Box height={300} mt={2}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={safeApptData}
                                    innerRadius={80}
                                    outerRadius={105}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {safeApptData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(value) => <span className="legend-text">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </div>
            </div>

            {/* 4. SECONDARY ROW */}
            <div className="admin-dash-secondary-grid dash-anim">
                <div className="admin-chart-card">
                    <div className="chart-header">
                        <div>
                            <Typography className="card-title">User Acquisition</Typography>
                            <Typography className="card-subtitle">New signups per month</Typography>
                        </div>
                        <div className="icon-wrapper"><BarChartIcon /></div>
                    </div>
                    <Box height={240} mt={2}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={safeGrowthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                                <Bar dataKey="users" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </div>
            </div>
        </Box>
    );
};

// Helper Component for Cards
const StatCard = ({ icon, color, bg, label, value }) => (
    <div className="admin-stat-card dash-anim">
        <div className="stat-icon-box" style={{ background: bg, color: color }}>
            {icon}
        </div>
        <div className="stat-content">
            <Typography className="stat-label">{label}</Typography>
            <Typography className="stat-value">{value}</Typography>
        </div>
    </div>
);

export default AdminDashboard;