import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Avatar, Button, Chip, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FilterNoneIcon from '@mui/icons-material/FilterNone';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import api from '../../services/api'; // Use your axios instance
import '../../styles/CounselorPendingReq.css';

const CounselorPendingReq = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  // --- FETCH DATA ---
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments/schedule');
      if (res.data.success) {
        // Filter only 'pending' status on the client side
        const pending = res.data.data.filter(appt => appt.status === 'scheduled');
        setRequests(pending);
      }
    } catch (err) {
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // --- ANIMATION ---
  useEffect(() => {
    if (!loading && requests.length > 0) {
      gsap.fromTo(".req-card", 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [loading, requests]);

  // --- ACTION HANDLERS ---
  const handleStatusUpdate = async (id, status) => {
    // If rejecting, ask confirmation
    if (status === 'cancelled' && !window.confirm("Are you sure you want to decline this session?")) return;

    const tid = toast.loading(status === 'scheduled' ? "Accepting session..." : "Declining request...");

    try {
      // Endpoint: PUT /api/appointments/status/:id
      const res = await api.put(`/appointments/status/${id}`, { status });
      
      if (res.data.success) {
        toast.success(status === 'scheduled' ? "Session Confirmed!" : "Request Declined", { id: tid });
        // Remove from list locally for instant UI update
        setRequests(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed", { id: tid });
    }
  };

  return (
    <div className="req-viewport" ref={containerRef}>
      <div className="req-container">
        
        {/* HEADER */}
        <div className="req-header">
          <div className="req-title">
            <h1>Session Requests</h1>
            <p>Review and manage incoming client appointments.</p>
          </div>
          <Chip 
            icon={<NotificationsActiveIcon style={{color: 'white'}}/>} 
            label={`${requests.length} Pending`} 
            sx={{ bgcolor: '#3b82f6', color: 'white', fontWeight: 700, borderRadius: '8px', px: 1 }} 
          />
        </div>

        {/* CONTENT */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress />
          </Box>
        ) : requests.length === 0 ? (
          <div className="req-empty">
            <FilterNoneIcon sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
            <Typography variant="h5" fontWeight="700">All Caught Up!</Typography>
            <Typography variant="body2">You have no pending appointment requests.</Typography>
          </div>
        ) : (
          <div className="req-grid">
            {requests.map((req) => (
              <div key={req._id} className="req-card">
                
                {/* TOP: Client Profile */}
                <div className="req-card-top">
                  <Avatar 
                    src={`http://localhost:5000/${req.client?.profileImage?.replace(/\\/g, '/')}`} 
                    className="req-avatar"
                  >
                    {req.client?.name?.charAt(0)}
                  </Avatar>
                  <div className="req-client-info">
                    <h3>{req.client?.name}</h3>
                    <span>Client ID: {req.client?._id.slice(-4).toUpperCase()}</span>
                  </div>
                </div>

                {/* BODY: Date & Context */}
                <div className="req-card-body">
                  <div className="req-detail-row">
                    <CalendarMonthIcon color="primary" fontSize="small" />
                    <span>{new Date(req.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="req-detail-row">
                    <AccessTimeFilledIcon color="primary" fontSize="small" />
                    <span>{req.timeSlot}</span>
                  </div>

                  <div className="req-issue-box">
                    <span className="req-issue-label">REASON FOR VISIT</span>
                    <p className="req-issue-text">
                      "{req.issue || req.userIssueDescription || "No specific details provided."}"
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="req-card-actions">
                  <Button 
                    variant="contained" 
                    className="btn-req-accept"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleStatusUpdate(req._id, 'scheduled')}
                  >
                    Accept
                  </Button>
                  <Button 
                    variant="outlined" 
                    className="btn-req-decline"
                    startIcon={<CancelIcon />}
                    onClick={() => handleStatusUpdate(req._id, 'cancelled')}
                  >
                    Decline
                  </Button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default CounselorPendingReq;