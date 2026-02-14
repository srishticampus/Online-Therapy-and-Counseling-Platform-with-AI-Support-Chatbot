import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Avatar, IconButton, Button, CircularProgress, 
    Chip, Tooltip, Dialog, DialogTitle, DialogContent, 
    DialogContentText, DialogActions 
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import InboxIcon from '@mui/icons-material/Inbox';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/AdminContacts.css';

const AdminContact = () => {
    const [messages, setMessages] = useState([]);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, resolved

    // --- MODAL STATE ---
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [targetId, setTargetId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const detailRef = useRef(null);

    // --- FETCH MESSAGES ---
    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/contact');
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to sync inbox.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // --- GSAP ANIMATION FOR DETAIL VIEW ---
    useEffect(() => {
        if (selectedMsg && detailRef.current) {
            gsap.fromTo(detailRef.current, 
                { opacity: 0, y: 10 }, 
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
            );
        }
    }, [selectedMsg]);

    // --- HANDLER: MARK RESOLVED ---
    const handleResolve = async (id) => {
        const tid = toast.loading("Updating status...");
        try {
            await api.put(`/contact/${id}`, { status: 'resolved' });
            toast.success("Marked as Resolved", { id: tid });
            
            const updated = messages.map(m => m._id === id ? { ...m, status: 'resolved' } : m);
            setMessages(updated);
            
            if (selectedMsg?._id === id) {
                setSelectedMsg({ ...selectedMsg, status: 'resolved' });
            }
        } catch (err) {
            toast.error("Failed to update", { id: tid });
        }
    };

    // --- HANDLER: OPEN DELETE MODAL ---
    const handleDeleteClick = (id) => {
        setTargetId(id);
        setDeleteModalOpen(true);
    };

    // --- HANDLER: CONFIRM DELETE ---
    const handleConfirmDelete = async () => {
        setDeleting(true);
        const tid = toast.loading("Deleting message...");
        try {
            await api.delete(`/contact/${targetId}`);
            toast.success("Message deleted permanently", { id: tid });
            
            const remaining = messages.filter(m => m._id !== targetId);
            setMessages(remaining);
            
            // If the deleted message was open, close the detail view
            if (selectedMsg?._id === targetId) setSelectedMsg(null);
            
            setDeleteModalOpen(false);
        } catch (err) {
            toast.error("Delete failed", { id: tid });
        } finally {
            setDeleting(false);
        }
    };

    // Filter Logic
    const filteredList = messages.filter(msg => 
        filter === 'all' ? true : msg.status === filter
    );

    return (
        <div className="inbox-wrapper">
            
            {/* --- LEFT: LIST PANEL --- */}
            <div className="inbox-list-panel">
                <div className="inbox-header">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <h2>Support Inbox</h2>
                        <Tooltip title="Refresh">
                            <IconButton onClick={fetchMessages} size="small">
                                <RefreshRoundedIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <div className="inbox-tabs">
                        {['all', 'pending', 'resolved'].map(f => (
                            <button 
                                key={f}
                                className={`inbox-tab ${filter === f ? 'active' : ''}`}
                                onClick={() => { setFilter(f); setSelectedMsg(null); }}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="inbox-items-container">
                    {loading ? (
                        <Box display="flex" justifyContent="center" pt={5}><CircularProgress size={24}/></Box>
                    ) : filteredList.length === 0 ? (
                        <Box textAlign="center" pt={5} color="#94a3b8">
                            <Typography variant="body2">No messages found.</Typography>
                        </Box>
                    ) : (
                        filteredList.map(msg => (
                            <div 
                                key={msg._id} 
                                className={`inbox-item ${selectedMsg?._id === msg._id ? 'selected' : ''}`}
                                onClick={() => setSelectedMsg(msg)}
                            >
                                <div className="item-top-row">
                                    <span className="sender-name">{msg.name}</span>
                                    <span className="item-date">
                                        {new Date(msg.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                    </span>
                                </div>
                                <div className="item-subject">{msg.subject || "No Subject"}</div>
                                <div className="item-snippet">{msg.message}</div>
                                {msg.status === 'pending' && <div className="unread-dot" />}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- RIGHT: READING PANE --- */}
            <div className="inbox-detail-panel">
                {selectedMsg ? (
                    <>
                        <div className="detail-toolbar">
                            <Chip 
                                label={selectedMsg.status} 
                                className={`status-badge ${selectedMsg.status}`} 
                                size="small"
                            />
                            <Box>
                                {selectedMsg.status === 'pending' && (
                                    <Tooltip title="Mark as Resolved">
                                        <IconButton onClick={() => handleResolve(selectedMsg._id)} color="success">
                                            <CheckCircleOutlineRoundedIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                <Tooltip title="Delete Message">
                                    {/* Updated to open Modal */}
                                    <IconButton onClick={() => handleDeleteClick(selectedMsg._id)} color="error">
                                        <DeleteOutlineRoundedIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </div>

                        <div className="detail-content" ref={detailRef}>
                            <div className="detail-header">
                                <h1 className="detail-subject">{selectedMsg.subject || "No Subject"}</h1>
                                
                                <div className="sender-info-box">
                                    <Avatar sx={{ bgcolor: '#0f172a', width: 48, height: 48 }}>
                                        {selectedMsg.name.charAt(0)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="700">
                                            {selectedMsg.name}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {selectedMsg.email} &bull; {new Date(selectedMsg.createdAt).toLocaleString()}
                                        </Typography>
                                    </Box>
                                </div>
                            </div>

                            <div className="detail-body">
                                {selectedMsg.message}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="empty-selection">
                        <InboxIcon sx={{ fontSize: 80, opacity: 0.1, mb: 2 }} />
                        <Typography variant="h6" fontWeight="600" color="textSecondary">Select a message to read</Typography>
                    </div>
                )}
            </div>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            <Dialog 
                open={deleteModalOpen} 
                onClose={() => !deleting && setDeleteModalOpen(false)}
                PaperProps={{ style: { borderRadius: 20 } }}
            >
                <Box sx={{ textAlign: 'center', pt: 2 }}>
                    <WarningAmberRoundedIcon sx={{ fontSize: 50, color: '#ef4444' }} />
                </Box>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                    Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ textAlign: 'center', fontSize: '0.95rem' }}>
                        This action is irreversible. Are you sure you want to delete this message?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
                    <Button 
                        onClick={() => setDeleteModalOpen(false)} 
                        disabled={deleting}
                        sx={{ color: '#64748b', fontWeight: 700, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete} 
                        variant="contained" 
                        color="error"
                        disabled={deleting}
                        sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', px: 3 }}
                    >
                        {deleting ? "Deleting..." : "Yes, Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default AdminContact;