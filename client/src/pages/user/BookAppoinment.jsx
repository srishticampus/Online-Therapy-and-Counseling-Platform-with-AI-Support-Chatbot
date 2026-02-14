import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Avatar, Button, CircularProgress, 
    Dialog, DialogContent, IconButton, Zoom 
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import GoogleIcon from '@mui/icons-material/Google';
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
                    console.log(res)
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
                                <Avatar src={`http://localhost:5000/${selectedCounselor.profileImage?.replace(/\\/g, '/')}`} className="session-avatar-large"/>
                                <div className="session-pro-details">
                                    <h2>{selectedCounselor.name}</h2>
                                    <span className="session-badge">{selectedCounselor.specialization}</span>
                                    <Box display="flex" alignItems="center" gap={1} mt={1} color="#cbd5e1">
                                        <VerifiedUserIcon sx={{ fontSize: 16 }} />
                                        <Typography variant="caption" fontWeight="600">{selectedCounselor.experience} Years Experience</Typography>
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
                                        <Box display="flex" alignItems="center" gap={1}><CircularProgress size={16}/> <Typography variant="caption">Refreshing slots...</Typography></Box>
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