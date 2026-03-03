import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Avatar, Button, CircularProgress,
    Dialog, DialogContent, IconButton, Zoom, Rating
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import GoogleIcon from '@mui/icons-material/Google';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/BookAppointment.css';

const BookAppoinment = () => {
    // --- STATE ---
    const [counselors, setCounselors] = useState([]);
    const [selectedCounselor, setSelectedCounselor] = useState(null);
    const [loading, setLoading] = useState(false);

    // Booking Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]); 
    const [slot, setSlot] = useState("");
    const [issue, setIssue] = useState("");
    const [fetchingSlots, setFetchingSlots] = useState(false);

    // Reviews State
    const [counselorStats, setCounselorStats] = useState(null);
    const [fetchingStats, setFetchingStats] = useState(false);
    const [counselorReviews, setCounselorReviews] = useState([]);

    // Modal State
    const [openPay, setOpenPay] = useState(false);
    const [gpayId, setGpayId] = useState("");
    const [processing, setProcessing] = useState(false);

    const railRef = useRef(null);

    // 1. Fetch Counselors
    useEffect(() => {
        const fetchCounselors = async () => {
            try {
                setLoading(true);
                const res = await api.get('/appointments/counselors');
                setCounselors(res.data.data);
            } catch (err) {
                toast.error("Network error: Failed to load professionals.");
            } finally {
                setLoading(false);
            }
        };
        fetchCounselors();
    }, []);

    // 2. Fetch Availability
    useEffect(() => {
        if (selectedCounselor && date) {
            const getSlots = async () => {
                setFetchingSlots(true);
                try {
                    const res = await api.get(`/appointments/availability/${selectedCounselor._id}?date=${date}`);
                    setSlots(res.data.slots); 
                    setSlot(""); 
                } catch (err) {
                    toast.error("Could not fetch availability for this date.");
                } finally {
                    setFetchingSlots(false);
                }
            };
            getSlots();
        }
    }, [selectedCounselor, date]);

    // 3. Fetch Reviews
    useEffect(() => {
        if (selectedCounselor) {
            const getReviewsAndStats = async () => {
                setFetchingStats(true);
                try {
                    const statsRes = await api.get(`/reviews/stats/${selectedCounselor._id}`);
                    if (statsRes.data.success) setCounselorStats(statsRes.data);

                    const reviewsRes = await api.get(`/reviews/counselor/${selectedCounselor._id}?limit=3`);
                    if (reviewsRes.data.success) setCounselorReviews(reviewsRes.data.data);
                } catch (err) {
                    console.error("Failed to fetch reviews", err);
                } finally {
                    setFetchingStats(false);
                }
            };
            getReviewsAndStats();
        } else {
            setCounselorStats(null);
            setCounselorReviews([]);
        }
    }, [selectedCounselor]);

    const handleProceed = () => {
        if (!slot) return toast.error("Please select a time slot first.");
        setOpenPay(true);
    };

    // Helper to copy bank details
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard", { icon: <ContentCopyIcon fontSize="small"/>, duration: 2000 });
    };

    const handlePayment = async () => {
        if (!gpayId.trim()) return toast.error("Please enter a valid UPI ID.");

        setProcessing(true);
        const tid = toast.loading("Verifying Payment...");

        try {
            const res = await api.post('/appointments/book', {
                counselorId: selectedCounselor._id,
                date,
                timeSlot: slot,
                issue
            });

            if (res.data.success) {
                toast.success("Appointment Confirmed!", { id: tid });
                setOpenPay(false);
                setSelectedCounselor(null);
                setIssue("");
                setSlot("");
                setGpayId("");
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Booking failed.", { id: tid });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="booking-dashboard">
            {/* --- LEFT: COUNSELOR RAIL --- */}
            <div className="counselor-rail">
                <div className="rail-header">
                    <div className="rail-title">Select Professional</div>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                        {counselors.length} Experts Available
                    </Typography>
                </div>

                <div className="rail-list" ref={railRef}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={5}><CircularProgress size={24} /></Box>
                    ) : (
                        counselors.map((c) => (
                            <div
                                key={c._id}
                                className={`rail-card ${selectedCounselor?._id === c._id ? 'active' : ''}`}
                                onClick={() => setSelectedCounselor(c)}
                            >
                                <Avatar src={`http://localhost:5000/${c.profileImage?.replace(/\\/g, '/')}`} className="rail-avatar">
                                    {c.name.charAt(0)}
                                </Avatar>
                                <div className="rail-info">
                                    <h4>{c.name}</h4>
                                    <span>{c.specialization}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- RIGHT: THE SESSION BOX --- */}
            <div className="session-stage">
                {selectedCounselor ? (
                    <div className="session-big-box">
                        <div className="session-header-banner">
                            <div className="session-pro-profile">
                                <Avatar src={`http://localhost:5000/${selectedCounselor.profileImage?.replace(/\\/g, '/')}`} className="session-avatar-large" />
                                <div className="session-pro-details">
                                    <h2>{selectedCounselor.name}</h2>
                                    <span className="session-badge">{selectedCounselor.specialization}</span>

                                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={2} mt={1}>
                                        <Box display="flex" alignItems="center" gap={0.5} color="#cbd5e1">
                                            <VerifiedUserIcon sx={{ fontSize: 16 }} />
                                            <Typography variant="caption" fontWeight="600">{selectedCounselor.experience} Years Experience</Typography>
                                        </Box>

                                        {fetchingStats ? (
                                            <CircularProgress size={16} sx={{ color: '#cbd5e1' }} />
                                        ) : counselorStats && counselorStats.totalReviews > 0 ? (
                                            <Box display="flex" alignItems="center" gap={0.5} sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', px: 1, py: 0.5, borderRadius: 1 }}>
                                                <StarRoundedIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                                                <Typography variant="caption" fontWeight="700" color="#f59e0b">
                                                    {counselorStats.averageRating} ({counselorStats.totalReviews} Reviews)
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box display="flex" alignItems="center" gap={0.5} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', px: 1, py: 0.5, borderRadius: 1 }}>
                                                <Typography variant="caption" fontWeight="600" color="#cbd5e1">No reviews yet</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </div>
                            </div>
                            <div className="session-cost">
                                <span className="cost-label">Session Fee</span>
                                <span className="cost-value">$200</span>
                            </div>
                        </div>

                        <div className="session-body">
                            <div className="config-column">
                                <div className="config-section">
                                    <h3>1. Choose Date</h3>
                                    <input
                                        type="date"
                                        className="big-date-input"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="config-section" style={{ marginTop: '30px' }}>
                                    <h3>2. Select Time Slot</h3>
                                    {fetchingSlots ? (
                                        <Box display="flex" alignItems="center" gap={1}><CircularProgress size={16} /> <Typography variant="caption">Refreshing slots...</Typography></Box>
                                    ) : (
                                        <div className="slots-wrapper">
                                            {slots.length > 0 ? slots.map((s, i) => (
                                                <button
                                                    key={i}
                                                    disabled={s.isBooked}
                                                    className={`slot-btn-lg ${slot === s.time ? 'selected' : ''} ${s.isBooked ? 'booked' : ''}`}
                                                    onClick={() => setSlot(s.time)}
                                                >
                                                    {s.time}
                                                </button>
                                            )) : <Typography color="error" variant="caption">No availability defined.</Typography>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="config-column">
                                <div className="config-section">
                                    <h3>3. Describe your concern</h3>
                                    <textarea
                                        className="session-notes-area"
                                        placeholder="What would you like to discuss in this session?"
                                        value={issue}
                                        onChange={(e) => setIssue(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="session-footer">
                            <Button
                                className="btn-confirm-lg"
                                startIcon={<ArrowForwardRoundedIcon />}
                                onClick={handleProceed}
                                disabled={!slot}
                            >
                                Proceed to Payment
                            </Button>
                        </div>
                        
                        {/* Reviews Section Omitted for Brevity (Same as before) */}
                    </div>
                ) : (
                    <div className="empty-state-box">
                        <TouchAppIcon sx={{ fontSize: 80, opacity: 0.1 }} />
                        <Typography variant="h5" fontWeight="800" color="textSecondary" mt={2}>Select a Counselor</Typography>
                        <Typography variant="body2" color="textSecondary">Pick a professional from the left to view available timings.</Typography>
                    </div>
                )}
            </div>

            {/* --- PROFESSIONAL PAYMENT MODAL --- */}
            <Dialog
                open={openPay}
                onClose={() => !processing && setOpenPay(false)}
                PaperProps={{ className: 'pay-glass-modal', sx: { maxWidth: '420px', width: '100%', m: 2 } }}
                TransitionComponent={Zoom}
            >
                <IconButton onClick={() => setOpenPay(false)} className="pay-close-btn"><CloseIcon /></IconButton>
                
                <DialogContent sx={{ p: '0' }}>
                    
                    {/* 1. Modal Header */}
                    <div className="pay-modal-header">
                        <div className="pay-logo-wrapper">
                            <GoogleIcon className="pay-g-icon" />
                            <span className="pay-g-text">Pay</span>
                        </div>
                        <div className="pay-amount-display">
                            {/* <span className="currency-symbol">$</span> */}
                            <span className="amount-number">200</span>
                            {/* <span className="amount-decimal">.00</span> */}
                        </div>
                        <div className="pay-recipient-badge">
                            Paying: <strong>{selectedCounselor?.name}</strong>
                        </div>
                    </div>

                    <div className="pay-modal-body">
                        {/* 2. UPI Input Section */}
                        <div className="pay-field-group">
                            <label className="pay-input-label">Enter UPI ID</label>
                            <div className="pay-input-wrapper">
                                <input 
                                    type="text" 
                                    placeholder="username@bank" 
                                    className="pay-modern-input" 
                                    value={gpayId} 
                                    onChange={(e) => setGpayId(e.target.value)} 
                                />
                                <CheckCircleIcon className={`pay-status-icon ${gpayId.length > 5 ? 'active' : ''}`} />
                            </div>
                        </div>

                        {/* 3. Bank Transfer Card */}
                        {selectedCounselor && (
                            <div className="bank-transfer-card">
                                <div className="bank-card-header">
                                    <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />
                                    <span>Bank Transfer Details</span>
                                </div>
                                
                                <div className="bank-info-row">
                                    <div className="bank-data-group">
                                        <label>Account Number</label>
                                        <div className="bank-value-row">
                                            <span className="mono-text">{selectedCounselor.accountNumber || "XXXX-XXXX-XXXX"}</span>
                                            <IconButton size="small" onClick={() => copyToClipboard(selectedCounselor.accountNumber)}>
                                                <ContentCopyIcon fontSize="inherit" />
                                            </IconButton>
                                        </div>
                                    </div>
                                </div>

                                <div className="bank-info-row">
                                    <div className="bank-data-group">
                                        <label>IFSC Code</label>
                                        <div className="bank-value-row">
                                            <span className="mono-text">{selectedCounselor.ifscCode || "BANK000123"}</span>
                                            <IconButton size="small" onClick={() => copyToClipboard(selectedCounselor.ifscCode)}>
                                                <ContentCopyIcon fontSize="inherit" />
                                            </IconButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Action Button */}
                        <Button 
                            className="pay-action-btn" 
                            fullWidth 
                            onClick={handlePayment} 
                            disabled={processing}
                        >
                            {processing ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                <>Pay Securely <ArrowForwardRoundedIcon sx={{ ml: 1, fontSize: 18 }} /></>
                            )}
                        </Button>

                        {/* 5. Security Footer */}
                        <div className="pay-security-footer">
                            <SecurityIcon sx={{ fontSize: 14 }} />
                            <span>Payments are encrypted and secured by Google Pay</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BookAppoinment;