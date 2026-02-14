import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, Avatar, Chip, CircularProgress, 
    InputBase, IconButton, Tooltip 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import FilterListIcon from '@mui/material/Tooltip';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/ViewAllAppoinment.css';

const ViewAllAppoinment = () => {
    const [appointments, setAppointments] = useState([]);
    const [filteredAppts, setFilteredAppts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    const tableRef = useRef(null);

    // --- FETCH ALL APPOINTMENTS (ADMIN) ---
    const fetchAll = async () => {
        try {
            setLoading(true);
            const res = await api.get('/appointments/admin/all');
            if (res.data.success) {
                setAppointments(res.data.data);
                setFilteredAppts(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to fetch global records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // --- SEARCH LOGIC ---
    useEffect(() => {
        const results = appointments.filter(appt => 
            appt.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appt.counselor?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredAppts(results);
    }, [searchTerm, appointments]);

    // --- GSAP ANIMATION ---
    

    // --- STATUS HELPERS ---
    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'primary';
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box className="adm-appt-viewport">
            <Box className="adm-appt-container">
                
                {/* --- HEADER --- */}
                <div className="adm-appt-header">
                    <div>
                        <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ letterSpacing: '-1.5px' }}>
                            Platform Bookings
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Monitoring {appointments.length} total sessions across the MindHeal ecosystem.
                        </Typography>
                    </div>

                    <div className="adm-search-box">
                        <SearchIcon sx={{ color: '#94a3b8' }} />
                        <InputBase 
                            placeholder="Search by Client or Counselor..." 
                            className="adm-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* --- TABLE CONTENT --- */}
                <TableContainer component={Paper} className="adm-table-card">
                    <Table sx={{ minWidth: 1000 }} ref={tableRef}>
                        <TableHead className="adm-table-head">
                            <TableRow>
                                <TableCell>Client (Patient)</TableCell>
                                <TableCell>Assigned Counselor</TableCell>
                                <TableCell>Schedule Details</TableCell>
                                <TableCell>Session Status</TableCell>
                                <TableCell>Payment</TableCell>
                                <TableCell align="right">Logs</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={30} />
                                        <Typography mt={2} color="textSecondary">Decrypting platform logs...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAppts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <Typography color="textSecondary">No matching appointment records found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAppts.map((appt) => (
                                    <TableRow key={appt._id} className="adm-row-animate">
                                        
                                        {/* Client Info */}
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Avatar 
                                                    src={`http://localhost:5000/${appt.client?.profileImage?.replace(/\\/g, '/')}`} 
                                                    sx={{ width: 32, height: 32 }}
                                                />
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="700" lineHeight={1.2}>
                                                        {appt.client?.name || "Deleted User"}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {appt.client?.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        {/* Counselor Info */}
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Avatar 
                                                    src={`http://localhost:5000/${appt.counselor?.profileImage?.replace(/\\/g, '/')}`} 
                                                    sx={{ width: 32, height: 32, bgcolor: '#eff6ff' }}
                                                />
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="700" lineHeight={1.2}>
                                                        Dr. {appt.counselor?.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="primary" fontWeight="600">
                                                        {appt.counselor?.specialization}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        {/* Schedule */}
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="700" color="#1e293b">
                                                {appt.timeSlot}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(appt.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </Typography>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <Chip 
                                                label={appt.status} 
                                                size="small" 
                                                color={getStatusColor(appt.status)}
                                                className="status-pill"
                                            />
                                        </TableCell>

                                        {/* Payment */}
                                        <TableCell>
                                            <Chip 
                                                label={appt.paymentStatus === 'paid' ? 'Completed' : 'Pending'}
                                                size="small"
                                                className={`status-pill ${appt.paymentStatus === 'paid' ? 'pay-pill-paid' : 'pay-pill-unpaid'}`}
                                            />
                                        </TableCell>

                                        {/* Log Icon */}
                                        <TableCell align="right">
                                            <Tooltip title="View System Logs">
                                                <IconButton size="small">
                                                    <AssignmentTurnedInIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>

                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default ViewAllAppoinment;