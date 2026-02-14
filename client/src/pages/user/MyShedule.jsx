import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Avatar, Button, Chip, CircularProgress, 
    IconButton, Zoom, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, Tooltip, Divider 
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import VideoCallRoundedIcon from '@mui/icons-material/VideoCallRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import NoteAltRoundedIcon from '@mui/icons-material/NoteAltRounded';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/MySchedule.css';

const MySchedule = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');
    const [tempLinks, setTempLinks] = useState({});
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [selectedApptId, setSelectedApptId] = useState(null);
    const [sessionNote, setSessionNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const mainRef = useRef(null);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const res = await api.get('/appointments/schedule');
            if (res.data.success) {
                setAppointments(res.data.data);
            }
        } catch (err) {
            toast.error("Cloud Sync Failed.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    // GSAP Entrance
    // useEffect(() => {
    //     if (!loading) {
    //         gsap.from(".schedule-card", {
    //             opacity: 0,
    //             y: 20,
    //             stagger: 0.1,
    //             duration: 0.6,
    //             ease: "power2.out"
    //         });
    //     }
    // }, [loading, filter]);

    // --- GENERATE WORKING JITSI LINK (Instantly works) ---
    const generateAutoLink = (apptId) => {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        const code = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        // Jitsi doesn't require "Meeting Creation" - the URL IS the room.
        const generatedLink = `https://meet.jit.si/MindHeal-Session-${code}`;
        
        setTempLinks(prev => ({ ...prev, [apptId]: generatedLink }));
        toast.success("Secure Video Room Created!");
    };

    const handleSaveLink = async (id) => {
        const link = tempLinks[id];
        if (!link || !link.startsWith('http')) return toast.error("Enter a valid URL");

        const tid = toast.loading("Finalizing and sharing...");
        try {
            const res = await api.put(`/appointments/status/${id}`, { meetingLink: link });
            if (res.data.success) {
                toast.success("Link locked and shared with client.", { id: tid });
                fetchSchedule(); 
            }
        } catch (err) {
            toast.error("Save failed.", { id: tid });
        }
    };

    const handleMarkDoneClick = (id) => {
        setSelectedApptId(id);
        setNoteModalOpen(true);
    };

    const handleConfirmCompletion = async () => {
        setSubmitting(true);
        const tid = toast.loading("Archiving session...");
        try {
            await api.patch(`/appointments/complete/${selectedApptId}`, { sessionNotes: sessionNote });            
            toast.success("Session Successful", { id: tid });
            setNoteModalOpen(false);
            setSessionNote("");
            fetchSchedule();
        } catch (err) {
            toast.error("Update failed.", { id: tid });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredList = appointments.filter(a => 
        filter === 'upcoming' ? a.status === 'scheduled' : (a.status === 'completed')
    );

    return (
        <Box className="schedule-viewport" ref={mainRef}>
            <div className="schedule-container">
                
                {/* --- HEADER --- */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={5}>
                    <Box>
                        <Typography variant="h4" fontWeight="900" color="#0f172a">
                            My Appointments
                        </Typography>
                        <Typography color="textSecondary">Manage your professional schedule and sessions.</Typography>
                    </Box>
                    
                    <Box className="schedule-tabs">
                        <button className={`sch-tab-btn ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>
                            Upcoming Sessions
                        </button>
                        <button className={`sch-tab-btn ${filter === 'history' ? 'active' : ''}`} onClick={() => setFilter('history')}>
                            Session History
                        </button>
                    </Box>
                </Box>

                {/* --- CONTENT --- */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
                ) : filteredList.length === 0 ? (
                    <Box textAlign="center" py={15} sx={{ bgcolor: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                        <EventBusyIcon sx={{ fontSize: 50, color: '#cbd5e1', mb: 1 }} />
                        <Typography color="textSecondary">No scheduled sessions found.</Typography>
                    </Box>
                ) : (
                    filteredList.map((appt) => (
                        <div key={appt._id} className="schedule-card">
                            <div className="sch-main-body">
                                <div className="sch-date-pill">
                                    <Typography className="s-month" variant="caption">
                                        {new Date(appt.date).toLocaleString('default', { month: 'short' })}
                                    </Typography>
                                    <Typography className="s-day" variant="h5" fontWeight="900">
                                        {new Date(appt.date).getDate()}
                                    </Typography>
                                </div>

                                <div className="sch-client-details">
                                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                                        <Avatar src={`http://localhost:5000/${appt.client?.profileImage?.replace(/\\/g, '/')}`} />
                                        <div className="sch-client-name">{appt.client?.name}</div>
                                        <Chip 
                                            icon={<AccessTimeFilledRoundedIcon sx={{fontSize: '14px !important'}}/>} 
                                            label={appt.timeSlot} 
                                            size="small" 
                                            sx={{ fontWeight: 800, bgcolor: '#eff6ff', color: '#3b82f6' }}
                                        />
                                    </Box>
                                    <div className="sch-issue-summary">
                                        Reason: {appt.issue || appt.userIssueDescription || 'General Consultation'}
                                    </div>
                                </div>

                                {filter === 'upcoming' && (
                                    <Button 
                                        variant="contained" 
                                        color="success" 
                                        startIcon={<CheckCircleRoundedIcon />}
                                        onClick={() => handleMarkDoneClick(appt._id)}
                                        sx={{ fontWeight: 700, borderRadius: '10px', textTransform: 'none' }}
                                    >
                                        Mark Done
                                    </Button>
                                )}
                            </div>

                            {/* --- DYNAMIC ACTION BAR --- */}
                            {filter === 'upcoming' && (
                                <div className="sch-action-bar">
                                    {appt.meetingLink ? (
                                        <>
                                            <div className="sch-link-verified">
                                                <VerifiedRoundedIcon sx={{ fontSize: 18 }} />
                                                <span>MEETING READY</span>
                                            </div>
                                            <Button 
                                                className="btn-sch-join"
                                                variant="contained"
                                                startIcon={<VideoCallRoundedIcon />}
                                                onClick={() => window.open(appt.meetingLink, '_blank')}
                                            >
                                                Join Session
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="sch-link-setup-wrapper">
                                            <div className="sch-link-setup">
                                                <Tooltip title="Auto-Generate Secure Room">
                                                    <IconButton onClick={() => generateAutoLink(appt._id)} color="primary" sx={{bgcolor: '#f1f5f9', mr: 1}}>
                                                        <AutoFixHighRoundedIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <input 
                                                    type="text" 
                                                    className="sch-url-input" 
                                                    placeholder="Paste Zoom Link or use Auto-Generator..."
                                                    value={tempLinks[appt._id] || ""}
                                                    onChange={(e) => setTempLinks({ ...tempLinks, [appt._id]: e.target.value })}
                                                />
                                                <Button className="btn-sch-save" onClick={() => handleSaveLink(appt._id)}>
                                                    Save & Lock
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Show Notes in History */}
                            {filter === 'history' && appt.notes && (
                                <Box p={2.5} m={2} bgcolor="#f8fafc" borderRadius="14px" border="1px solid #e2e8f0">
                                    <Typography variant="caption" fontWeight="900" color="#3b82f6" display="block" mb={1}>
                                        SESSION RECAP
                                    </Typography>
                                    <Typography variant="body2" color="#475569" lineHeight={1.6}>{appt.notes}</Typography>
                                </Box>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* --- COMPLETION DIALOG --- */}
            <Dialog 
                open={noteModalOpen} 
                onClose={() => !submitting && setNoteModalOpen(false)}
                PaperProps={{ sx: { borderRadius: '24px', width: '500px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Finalize Session</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" mb={3}>
                        Add professional notes about this session. These help track the client's progress.
                    </Typography>
                    <TextField
                        fullWidth multiline rows={4} variant="outlined"
                        placeholder="Observation, feedback, or next steps..."
                        value={sessionNote}
                        onChange={(e) => setSessionNote(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setNoteModalOpen(false)} sx={{ fontWeight: 700, color: '#94a3b8' }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleConfirmCompletion} 
                        disabled={submitting}
                        sx={{ borderRadius: '10px', px: 4, bgcolor: '#0f172a', fontWeight: 700 }}
                    >
                        {submitting ? "Saving..." : "Save & Close"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MySchedule;