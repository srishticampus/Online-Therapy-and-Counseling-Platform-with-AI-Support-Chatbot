import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Avatar, Button, CircularProgress,
    Dialog, DialogContent, IconButton, Zoom, Rating, Divider
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import GoogleIcon from '@mui/icons-material/Google';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import RateReviewIcon from '@mui/icons-material/RateReview';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/BookAppointment.css';

const BookAppoinment = () => {
    // --- STATE ---
    const [counselors, setCounselors] = useState([]);
    const [selectedCounselor, setSelectedCounselor] = useState(null);
    const [loading, setLoading] = useState(false);

    // Booking Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]); // This will hold [{time: '...', isBooked: bool}]
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

    // 1. Fetch Counselors on Mount
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

    // 2. Fetch Availability when Date or Selected Counselor changes
    useEffect(() => {
        if (selectedCounselor && date) {
            const getSlots = async () => {
                setFetchingSlots(true);
                try {
                    // API Call to your getCounselorAvailability controller
                    const res = await api.get(`/appointments/availability/${selectedCounselor._id}?date=${date}`);
                    setSlots(res.data.slots); // Array of objects
                    setSlot(""); // Reset selected slot when date/counselor changes
                } catch (err) {
                    console.error("Slot fetch error", err);
                    toast.error("Could not fetch availability for this date.");
                } finally {
                    setFetchingSlots(false);
                }
            };
            getSlots();
        }
    }, [selectedCounselor, date]);

    // 3. Fetch Reviews & Stats when Selected Counselor changes
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
                    console.error("Failed to fetch reviews/stats", err);
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

    // GSAP Entrance


    // Handle Payment Modal
    const handleProceed = () => {
        if (!slot) return toast.error("Please select a time slot first.");
        setOpenPay(true);
    };

    // Final Booking Logic (Linked to your bookAppointment controller)
    const handlePayment = async () => {
        if (!gpayId.trim()) return toast.error("Please enter a valid UPI ID.");

        setProcessing(true);
        const tid = toast.loading("Processing transaction...");

        try {
            const res = await api.post('/appointments/book', {
                counselorId: selectedCounselor._id,
                date,
                timeSlot: slot,
                issue // Matches backend schema 'issue'
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
            toast.error(err.response?.data?.error || "Slot might have just been taken.", { id: tid });
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

                                        {/* RATINGS BADGE */}
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
                                                <Typography variant="caption" fontWeight="600" color="#cbd5e1">
                                                    No reviews yet
                                                </Typography>
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
                                                    disabled={s.isBooked} // TRUE = Disable button
                                                    className={`slot-btn-lg ${slot === s.time ? 'selected' : ''} ${s.isBooked ? 'booked' : ''}`}
                                                    onClick={() => setSlot(s.time)}
                                                >
                                                    {s.time}
                                                </button>
                                            )) : <Typography color="error" variant="caption">No availability defined for this day.</Typography>}
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

                        {/* REVIEWS SECTION */}
                        <div className="session-reviews-section">
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} mt={4} pt={3} borderTop="1px solid #e2e8f0">
                                <Typography variant="h6" fontWeight="800" color="#0f172a">Client Reviews</Typography>
                                {counselorStats?.totalReviews > 0 && (
                                    <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', fontWeight: 600 }}>
                                        View All ({counselorStats.totalReviews})
                                    </Typography>
                                )}
                            </Box>

                            {fetchingStats ? (
                                <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
                            ) : counselorReviews.length > 0 ? (
                                <div className="reviews-list">
                                    {counselorReviews.map((rev) => (
                                        <div key={rev._id} className="review-item" style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '12px' }}>
                                            <div className="review-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Avatar
                                                    src={`http://localhost:5000/${rev.client?.profileImage?.replace(/\\/g, '/')}`}
                                                    sx={{ width: 36, height: 36 }}
                                                >
                                                    {rev.client?.name?.charAt(0) || 'U'}
                                                </Avatar>
                                                <div className="review-meta">
                                                    <Typography variant="subtitle2" fontWeight="700" color="#0f172a">
                                                        {rev.client?.name || 'Anonymous User'}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {new Date(rev.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </div>
                                                <Box ml="auto">
                                                    <Rating value={rev.rating} readOnly size="small" sx={{ color: '#f59e0b' }} />
                                                </Box>
                                            </div>
                                            <Typography variant="body2" color="#475569" sx={{ mt: 1.5, lineHeight: 1.6, fontStyle: 'italic' }}>
                                                "{rev.comment}"
                                            </Typography>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Box textAlign="center" py={4} bgcolor="#f8fafc" borderRadius={2} border="1px dashed #cbd5e1">
                                    <RateReviewIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                                    <Typography variant="body2" color="textSecondary" fontWeight="500">
                                        No reviews yet for this counselor.
                                    </Typography>
                                </Box>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="empty-state-box">
                        <TouchAppIcon sx={{ fontSize: 80, opacity: 0.1 }} />
                        <Typography variant="h5" fontWeight="800" color="textSecondary" mt={2}>Select a Counselor</Typography>
                        <Typography variant="body2" color="textSecondary">Pick a professional from the left to view available timings.</Typography>
                    </div>
                )}
            </div>

            {/* --- PAYMENT MODAL --- */}
            <Dialog
                open={openPay}
                onClose={() => !processing && setOpenPay(false)}
                PaperProps={{ className: 'pay-glass-modal', sx: { width: '400px', m: 2 } }}
                TransitionComponent={Zoom}
            >
                <IconButton onClick={() => setOpenPay(false)} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
                <DialogContent sx={{ p: '40px 30px 30px' }}>
                    <div className="pay-header-brand"><div className="google-pay-logo"><GoogleIcon sx={{ fontSize: 24 }} /> <span>Pay</span></div></div>
                    <div className="pay-amount-box"><span className="pay-currency">$</span><span className="pay-amount-value">200.00</span></div>
                    <div className="pay-input-group">
                        <label className="pay-label-tiny">UPI ID / VPA</label>
                        <input type="text" placeholder="username@okhdfcbank" className="pay-custom-input" value={gpayId} onChange={(e) => setGpayId(e.target.value)} />
                    </div>
                    <Button className="pay-confirm-btn" variant="contained" onClick={handlePayment} disabled={processing}>
                        {processing ? "Processing..." : "Pay Securely"}
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BookAppoinment;