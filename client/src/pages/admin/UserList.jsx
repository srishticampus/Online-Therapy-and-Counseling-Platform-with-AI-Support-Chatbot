import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Avatar, Button, Chip, IconButton, Tooltip 
} from '@mui/material';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import api from '../../services/api'; 

// Icons
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GroupIcon from '@mui/icons-material/Group';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';

import '../../styles/UserList.css';

const UserList = () => {
  const [activeTab, setActiveTab] = useState('counselors'); // 'counselors' | 'clients'
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/all-users');
      setAllUsers(res.data.data);
    } catch (err) {
      toast.error("Cloud synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  // GSAP Animation Logic
  useEffect(() => {
    if (!loading) {
      gsap.fromTo(".directory-row", 
        { opacity: 0, x: -10 }, 
        { opacity: 1, x: 0, stagger: 0.05, duration: 0.4, ease: "power2.out", clearProps: "all" }
      );
    }
  }, [activeTab, loading]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the platform?`)) return;

    const tid = toast.loading(`Removing ${name}...`);
    try {
      await api.delete(`/admin/delete-user/${id}`);
      toast.success("User successfully purged.", { id: tid });
      setAllUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      toast.error("Authorization error: Purge failed.", { id: tid });
    }
  };

  // Filtering Logic
  const counselors = allUsers.filter(u => u.role === 'counselor' && u.isApproved);
  const clients = allUsers.filter(u => u.role === 'user');
  const displayData = activeTab === 'counselors' ? counselors : clients;

  return (
    <Box className="userlist-viewport" ref={componentRef}>
      
      {/* 1. TOP ANALYTICS BAR */}
      <div className="stats-grid">
        <div className="stat-item-card">
          <div className="stat-icon-box" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <BusinessCenterRoundedIcon />
          </div>
          <div>
            <Typography variant="h4" fontWeight="800">{counselors.length}</Typography>
            <Typography variant="caption" color="textSecondary">Active Professionals</Typography>
          </div>
        </div>

        <div className="stat-item-card">
          <div className="stat-icon-box" style={{ background: '#f0fdf4', color: '#10b981' }}>
            <GroupIcon />
          </div>
          <div>
            <Typography variant="h4" fontWeight="800">{clients.length}</Typography>
            <Typography variant="caption" color="textSecondary">Registered Clients</Typography>
          </div>
        </div>
      </div>

      {/* 2. HEADER & TABS */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#0f172a', letterSpacing: '-1px' }}>
            Member Directory
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage roles, view professional credentials, and handle account statuses.
          </Typography>
        </Box>

        <div className="management-tabs">
          <button 
            className={`m-tab ${activeTab === 'counselors' ? 'active' : ''}`}
            onClick={() => setActiveTab('counselors')}
          >
            Professionals
          </button>
          <button 
            className={`m-tab ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            Client Base
          </button>
        </div>
      </Box>

      {/* 3. DYNAMIC TABLE */}
      <TableContainer component={Paper} className="directory-table-card">
        <Table sx={{ minWidth: 800 }}>
          <TableHead className="directory-table-head">
            <TableRow>
              <TableCell>Identification</TableCell>
              {activeTab === 'counselors' ? (
                <>
                  <TableCell>Specialization</TableCell>
                  <TableCell>License ID</TableCell>
                  <TableCell>Exp.</TableCell>
                </>
              ) : (
                <>
                  <TableCell>Verification</TableCell>
                  <TableCell>Contact Point</TableCell>
                </>
              )}
              <TableCell>Join Date</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}>Syncing Directory...</TableCell></TableRow>
            ) : displayData.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}>No members found in this category.</TableCell></TableRow>
            ) : (
              displayData.map((user) => (
                <TableRow key={user._id} className="directory-row">
                  
                  {/* Common: Profile Info */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={`http://localhost:5000/${user.profileImage?.replace(/\\/g, '/')}`} 
                        sx={{ width: 42, height: 42, border: '2px solid #f1f5f9' }}
                      >
                        {user.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#1e293b', lineHeight: 1.2 }}>
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {user._id.slice(-6).toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* DYNAMIC COLUMNS BASED ON ROLE */}
                  {activeTab === 'counselors' ? (
                    <>
                      <TableCell>
                        <Chip label={user.specialization} size="small" sx={{ fontWeight: 700, bgcolor: '#eff6ff', color: '#3b82f6' }} />
                      </TableCell>
                      <TableCell><span className="pro-license-tag">{user.licenseId}</span></TableCell>
                      <TableCell><Typography variant="body2" fontWeight="600">{user.experience}Y</Typography></TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <Chip label="Verified Email" variant="outlined" size="small" sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b' }}>
                          <AlternateEmailRoundedIcon sx={{ fontSize: 14 }} /> {user.email}
                        </Typography>
                      </TableCell>
                    </>
                  )}

                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </TableCell>

                  {/* Actions Column */}
                 

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserList;