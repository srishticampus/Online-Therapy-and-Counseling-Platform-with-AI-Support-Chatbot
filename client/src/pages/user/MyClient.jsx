import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, CircularProgress, Drawer, IconButton, Divider } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/MyClients.css';

const MyClient = () => {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]); // Array of grouped client objects
    const [selectedClient, setSelectedClient] = useState(null); // Client chosen for history
    const [historyOpen, setHistoryOpen] = useState(false);

    // --- 1. Fetch & Group Logic ---
    const fetchAndProcessClients = async () => {
        try {
            setLoading(true);
            const res = await api.get('/appointments/schedule'); // Reuse your counselor schedule API
            
            if (res.data.success) {
                const allAppointments = res.data.data;

                // Group appointments by Client ID
                const grouped = allAppointments.reduce((acc, appt) => {
                    const clientId = appt.client._id;
                    if (!acc[clientId]) {
                        acc[clientId] = {
                            info: appt.client,
                            sessions: []
                        };
                    }
                    acc[clientId].sessions.push(appt);
                    return acc;
                }, {});

                // Convert to array and sort sessions by date (newest first)
                const clientList = Object.values(grouped).map(client => ({
                    ...client,
                    sessions: client.sessions.sort((a, b) => new Date(b.date) - new Date(a.date))
                }));

                setClients(clientList);
            }
        } catch (err) {
            toast.error("Failed to load client database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAndProcessClients();
    }, []);

    // GSAP Entrance
    useEffect(() => {
        if (!loading) {
            gsap.from(".client-pro-card", {
                opacity: 0,
                y: 20,
                stagger: 0.1,
                duration: 0.5,
                ease: "power2.out"
            });
        }
    }, [loading]);

    const openHistory = (client) => {
        setSelectedClient(client);
        setHistoryOpen(true);
    };

    return (
        <Box className="clients-viewport">
            <Box className="clients-container">
                
                {/* --- HEADER --- */}
                <Box mb={5}>
                    <Typography variant="h4" fontWeight="900" color="#0f172a">Client Directory</Typography>
                    <Typography color="textSecondary">Access patient records and previous session notes.</Typography>
                </Box>

                {/* --- CONTENT --- */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
                ) : clients.length === 0 ? (
                    <Box textAlign="center" py={10}>
                        <Typography color="textSecondary">No clients registered under your profile yet.</Typography>
                    </Box>
                ) : (
                    <div className="clients-grid">
                        {clients.map((client) => (
                            <div key={client.info._id} className="client-pro-card">
                                <div className="client-card-header">
                                    <Avatar 
                                        src={`http://localhost:5000/${client.info.profileImage?.replace(/\\/g, '/')}`} 
                                        className="client-avatar"
                                    >
                                        {client.info.name.charAt(0)}
                                    </Avatar>
                                    <div className="client-meta">
                                        <h3>{client.info.name}</h3>
                                        <span>Patient since {new Date(client.info.createdAt).getFullYear()}</span>
                                    </div>
                                </div>

                                <div className="client-stats">
                                    <div className="stat-box">
                                        <span className="stat-label">Total Sessions</span>
                                        <span className="stat-value">{client.sessions.length}</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Last Session</span>
                                        <span className="stat-value">
                                            {new Date(client.sessions[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    startIcon={<HistoryRoundedIcon />}
                                    onClick={() => openHistory(client)}
                                    sx={{ 
                                        borderRadius: '12px', fontWeight: 700, textTransform: 'none', 
                                        borderColor: '#e2e8f0', color: '#0f172a',
                                        '&:hover': { borderColor: '#3b82f6', color: '#3b82f6' }
                                    }}
                                >
                                    Clinical History
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Box>

            {/* --- CLINICAL HISTORY SIDEBAR (DRAWER) --- */}
            <Drawer
                anchor="right"
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                PaperProps={{ className: 'history-drawer-content' }}
            >
                {selectedClient && (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar src={`http://localhost:5000/${selectedClient.info.profileImage?.replace(/\\/g, '/')}`} />
                                <Box>
                                    <Typography variant="h6" fontWeight="900">{selectedClient.info.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">Detailed History</Typography>
                                </Box>
                            </Box>
                            <IconButton onClick={() => setHistoryOpen(false)}><CloseRoundedIcon /></IconButton>
                        </Box>

                        <Divider sx={{ mb: 4 }} />

                        {/* SESSION TIMELINE */}
                        <Typography variant="overline" fontWeight="900" color="primary" gutterBottom display="block">
                            Session Records
                        </Typography>

                        <div className="history-timeline">
                            {selectedClient.sessions.map((session, index) => (
                                <div key={index} className="timeline-item">
                                    <span className="timeline-date">
                                        {new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <div className="timeline-note-card">
                                        <Typography className="note-title" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            <AssignmentRoundedIcon sx={{fontSize: 16}} /> Session Focus
                                        </Typography>
                                        <Typography className="note-text" mb={2}>
                                            "{session.issue || session.userIssueDescription || "No focus specified"}"
                                        </Typography>

                                        <Divider sx={{my: 1.5, borderStyle: 'dashed'}} />

                                        <Typography className="note-title" sx={{display: 'flex', alignItems: 'center', gap: 1, color: '#3b82f6'}}>
                                            <EventAvailableRoundedIcon sx={{fontSize: 16}} /> Counselor Private Notes
                                        </Typography>
                                        <Typography className="note-text">
                                            {session.notes || "No clinical notes were recorded for this session."}
                                        </Typography>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Box>
                )}
            </Drawer>
        </Box>
    );
};

export default MyClient;