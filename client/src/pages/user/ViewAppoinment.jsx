import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, CircularProgress, Dialog, DialogContent, Rating, TextField } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VideocamIcon from '@mui/icons-material/Videocam';
import RateReviewIcon from '@mui/icons-material/RateReview';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/ViewAppointment.css';

const ViewAppoinment = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'
    const [reviewedCounselors, setReviewedCounselors] = useState([]);

    // --- REVIEW MODAL STATE ---
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // --- FETCH DATA ---
    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/appointments/my-bookings');
            console.log(res);

            if (res.data.success) {
                setAppointments(res.data.data);
            }

            // Fetch user's reviews
            const reviewsRes = await api.get('/reviews/my-reviews');
            if (reviewsRes.data.success) {
                const reviewedIds = reviewsRes.data.data.map(r => r.counselor?._id || r.counselor);
                setReviewedCounselors(reviewedIds);
            }
        } catch (err) {
            toast.error("Failed to load your schedule.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    // --- ANIMATION ---
    useEffect(() => {
        if (!loading) {
            gsap.fromTo(".appt-card",
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out", clearProps: "all" }
            );
        }
    }, [loading, filter]); // Re-run animation when filter changes

    // --- HANDLER: CANCEL ---
    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this session?")) return;
        const tid = toast.loading("Cancelling...");
        try {
            const res = await api.patch(`/appointments/cancel/${id}`);
            if (res.data.success) {
                toast.success("Appointment Cancelled", { id: tid });
                fetchAppointments(); // Refresh list
            }
        } catch (err) {
            toast.error("Could not cancel session", { id: tid });
        }
    };

    // --- HANDLERS: REVIEWS ---
    const openReviewModal = (appt) => {
        setReviewTarget(appt);
        setRating(0);
        setComment('');
        setReviewModalOpen(true);
    };

    const closeReviewModal = () => {
        setReviewModalOpen(false);
        setReviewTarget(null);
    };

    const handleSubmitReview = async () => {
        if (rating === 0) return toast.error("Please provide a rating (1-5 stars).");
        if (!comment.trim()) return toast.error("Please write a short review.");

        setSubmittingReview(true);
        const tid = toast.loading("Submitting review...");
        try {
            const res = await api.post('/reviews', {
                counselor: reviewTarget.counselor._id,
                rating,
                comment
            });
            if (res.data.success) {
                toast.success("Review submitted successfully!", { id: tid });
                setReviewedCounselors(prev => [...prev, reviewTarget.counselor._id]);
                closeReviewModal();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not submit review. You may have already reviewed this counselor.", { id: tid });
        } finally {
            setSubmittingReview(false);
        }
    };

    // --- HELPER: FILTER LOGIC ---
    const getFilteredAppointments = () => {
        const today = new Date();
        return appointments.filter(appt => {
            const apptDate = new Date(appt.date);
            if (filter === 'upcoming') {
                return (appt.status === 'scheduled' || appt.status === 'pending') && apptDate >= today.setHours(0, 0, 0, 0);
            }
            if (filter === 'completed') {
                return appt.status === 'completed' || (apptDate < today && appt.status !== 'cancelled');
            }
            // if (filter === 'cancelled') {
            //     return appt.status === 'cancelled';
            // }
            return false;
        });
    };

    const displayList = getFilteredAppointments();

    // --- HELPER: FORMAT DATE ---
    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return {
            day: d.getDate(),
            month: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear()
        };
    };

    return (
        <div className="view-viewport">
            <div className="view-container">

                {/* HEADER */}
                <div className="view-header">
                    <Typography className="view-title">My Sessions</Typography>
                    <Typography color="textSecondary">Track your therapy journey and upcoming meetings.</Typography>
                </div>

                {/* TABS */}
                <div className="view-tabs">
                    <button
                        className={`view-tab-btn ${filter === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`view-tab-btn ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        History
                    </button>
                    {/* <button 
                        className={`view-tab-btn ${filter === 'cancelled' ? 'active' : ''}`}
                        onClick={() => setFilter('cancelled')}
                    >
                        Cancelled
                    </button> */}
                </div>

                {/* LIST AREA */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={10}>
                        <CircularProgress />
                    </Box>
                ) : displayList.length === 0 ? (
                    <div className="empty-history">
                        <CalendarMonthIcon sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                        <Typography variant="h6" fontWeight="700">No {filter} appointments</Typography>
                        <Typography variant="body2">Your schedule is clear.</Typography>
                    </div>
                ) : (
                    <div className="appt-list-wrapper">
                        {displayList.map((appt) => {
                            const dateObj = formatDate(appt.date);
                            return (
                                <div key={appt._id} className="appt-card">
                                    {/* Date Column */}
                                    <div className="appt-date-box">
                                        <span className="date-month">{dateObj.month}</span>
                                        <span className="date-day">{dateObj.day}</span>
                                        <span className="date-year">{dateObj.year}</span>
                                    </div>

                                    {/* Details Column */}
                                    <div className="appt-details">
                                        <div className="counselor-info">
                                            <Avatar
                                                src={`http://localhost:5000/${appt.counselor?.profileImage?.replace(/\\/g, '/')}`}
                                                className="counselor-avatar"
                                            >
                                                {appt.counselor?.name?.charAt(0)}
                                            </Avatar>
                                            <div>
                                                <Typography variant="h6" fontWeight="800" color="#0f172a">
                                                    {appt.counselor?.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" fontWeight="600">
                                                    {appt.counselor?.specialization || "Professional Counselor"}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={0.5} mt={0.5} color="#3b82f6">
                                                    <Typography variant="body2" fontWeight="600">{appt.timeSlot}</Typography>
                                                </Box>
                                            </div>
                                        </div>

                                        {/* Actions Column */}
                                        <div className="appt-actions">
                                            <span className={`status-badge status-${appt.status}`}>
                                                {appt.status.toUpperCase()}
                                            </span>

                                            {appt.status === 'scheduled' && (
                                                <Button
                                                    variant="contained"
                                                    className="btn-join-meet"
                                                    startIcon={<VideocamIcon />}
                                                    onClick={() => window.open(appt.meetingLink || '#', '_blank')}
                                                    disabled={!appt.meetingLink}
                                                >
                                                    {appt.meetingLink ? "Join Session" : "Link Pending"}
                                                </Button>
                                            )}

                                            {appt.status === 'completed' && !reviewedCounselors.includes(appt.counselor?._id) && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    className="btn-review"
                                                    startIcon={<RateReviewIcon />}
                                                    onClick={() => openReviewModal(appt)}
                                                >
                                                    Write Review
                                                </Button>
                                            )}

                                            {/* Cancel Button only for Upcoming */}
                                            {/* {(appt.status === 'pending' || appt.status === 'scheduled') && (
                                                <Button 
                                                    size="small" 
                                                    startIcon={<CancelIcon />} 
                                                    className="btn-cancel-appt"
                                                    onClick={() => handleCancel(appt._id)}
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )} */}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* REVIEW MODAL */}
            <Dialog
                open={reviewModalOpen}
                onClose={!submittingReview ? closeReviewModal : undefined}
                PaperProps={{ className: 'review-modal', sx: { width: '400px', borderRadius: '16px' } }}
            >
                <DialogContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="800" color="#0f172a" mb={1}>Rate your Session</Typography>
                    <Typography variant="body2" color="textSecondary" mb={3}>
                        How was your experience with {reviewTarget?.counselor?.name}?
                    </Typography>

                    <Rating
                        value={rating}
                        onChange={(event, newValue) => setRating(newValue)}
                        size="large"
                        sx={{ fontSize: '3rem', mb: 3, color: '#f59e0b' }}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="Share your thoughts about the session..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    <Box display="flex" gap={2} width="100%">
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={closeReviewModal}
                            disabled={submittingReview}
                            sx={{ borderRadius: '8px', color: '#64748b', borderColor: '#cbd5e1' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSubmitReview}
                            disabled={submittingReview}
                            sx={{ borderRadius: '8px', bgcolor: '#3b82f6', color: 'white' }}
                        >
                            {submittingReview ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ViewAppoinment;