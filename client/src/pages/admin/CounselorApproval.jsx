import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Avatar, Button, Badge,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Icons
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckIcon from '@mui/icons-material/Check';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'; // Warning Icon

import '../../styles/CounselorApproval.css';

const CounselorApproval = () => {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- MODAL STATE ---
  const [openModal, setOpenModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const cardsRef = useRef(null);

  // --- API: Fetch Pending ---
  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/pending-counselors');
      setCounselors(res.data.data);
    } catch (err) {
      toast.error("Failed to load counselors list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // --- GSAP ANIMATION ---
  useEffect(() => {
    if (!loading && counselors.length > 0) {
      gsap.from(".professional-card", {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
        clearProps: "all"
      });
    }
  }, [loading, counselors]);

  // --- HANDLER: APPROVE ---
  const handleApprove = async (id) => {
    const tid = toast.loading("Updating counselor status...");
    try {
      const res = await api.put(`/admin/approve/${id}`);
      if (res.data.success) {
        toast.success("Counselor approved!", { id: tid });
        setCounselors(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      toast.error("Error approving counselor", { id: tid });
    }
  };

  // --- MODAL HANDLERS ---
  const handleOpenRejectModal = (id) => {
    setSelectedId(id);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedId(null);
  };

  // --- HANDLER: CONFIRM REJECT (API CALL) ---
  const handleConfirmReject = async () => {
    handleCloseModal(); // Close modal immediately
    const tid = toast.loading("Removing record...");

    try {
      const res = await api.delete(`/admin/reject/${selectedId}`);
      if (res.data.success) {
        toast.error("Application Deleted", { id: tid });
        setCounselors(prev => prev.filter(c => c._id !== selectedId));
      }
    } catch (err) {
      toast.error("Error rejecting counselor", { id: tid });
    }
  };

  return (
    <Box className="approval-wrapper">

      {/* HEADER SECTION */}
      <Box className="approval-page-header">
        <div className="header-info">
          <h1>Pending Approvals</h1>
          <p>Verify therapist credentials before granting portal access.</p>
        </div>
        <Badge badgeContent={counselors.length} color="primary">
          <VerifiedUserIcon sx={{ fontSize: 32, color: '#0f172a' }} />
        </Badge>
      </Box>

      {/* CONTENT AREA */}
      {loading ? (
        <Typography variant="body1" align="center" sx={{ mt: 10, color: '#94a3b8' }}>
          Syncing with server...
        </Typography>
      ) : counselors.length === 0 ? (
        <Box className="no-pending-box">
          <CheckIcon sx={{ fontSize: 50, color: '#10b981', mb: 2 }} />
          <Typography variant="h5" fontWeight="700">All caught up!</Typography>
          <Typography color="textSecondary">There are no pending counselor applications.</Typography>
        </Box>
      ) : (
        <div className="approval-cards-grid" ref={cardsRef}>
          {counselors.map((c) => (
            <div key={c._id} className="professional-card">

              {/* Card Top: Profile */}
              <div className="card-header-flex">
                <Avatar
                  variant="rounded"
                  src={`http://localhost:5000/${c.profileImage}`}
                  className="pro-avatar"
                >
                  {c.name.charAt(0)}
                </Avatar>
                <div>
                  <h3 className="pro-name">{c.name}</h3>
                  <span className="pro-specialization">{c.specialization}</span>
                </div>
              </div>

              {/* Card Middle: Data Grid */}
              <div className="pro-data-box">
                <div className="data-item">
                  <span className="data-label">License ID</span>
                  <div className="data-value">{c.licenseId}</div>
                </div>
                <div className="data-item">
                  <span className="data-label">Experience</span>
                  <div className="data-value">{c.experience} Years</div>
                </div>
                <div className="data-item">
                  <span className="data-label">Counselor Code</span>
                  <div className="data-value">{c.counselorCode || 'N/A'}</div>
                </div>
                <div className="data-item">
                  <span className="data-label">Email</span>
                  <div className="data-value" style={{ fontSize: '0.7rem', overflow: 'hidden' }}>{c.email}</div>
                </div>
              </div>

              {/* Card Bottom: Actions */}
              <div className="pro-action-row">
                <Button
                  variant="contained"
                  className="btn-approve"
                  startIcon={<CheckIcon />}
                  onClick={() => handleApprove(c._id)}
                >
                  Approve
                </Button>

                <Button
                  variant="outlined"
                  className="btn-reject"
                  onClick={() => handleOpenRejectModal(c._id)} // Open Modal Here
                >
                  <DeleteSweepIcon fontSize="small" />
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* --- REJECTION CONFIRMATION MODAL --- */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          style: { borderRadius: 20, padding: '10px' }
        }}
      >
        <Box sx={{ textAlign: 'center', pt: 2 }}>
          <WarningAmberRoundedIcon sx={{ fontSize: 50, color: '#ef4444' }} />
        </Box>
        <DialogTitle id="alert-dialog-title" sx={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
          {"Reject Application?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ textAlign: 'center', fontSize: '0.95rem' }}>
            Are you sure you want to reject this counselor? <br />
            <strong>This action will permanently delete their account request from the database.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button
            onClick={handleCloseModal}
            sx={{ color: '#64748b', fontWeight: 700, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReject}
            variant="contained"
            color="error"
            autoFocus
            sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', px: 3 }}
          >
            Yes, Reject & Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default CounselorApproval;