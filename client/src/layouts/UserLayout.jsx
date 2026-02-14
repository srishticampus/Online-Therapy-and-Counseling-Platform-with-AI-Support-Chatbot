import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, IconButton, Typography, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar,
  Badge, Menu, MenuItem, Divider, useMediaQuery, useTheme, Chip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import gsap from 'gsap';

// Icons
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import FolderSpecialRoundedIcon from '@mui/icons-material/FolderSpecialRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import FaceRoundedIcon from '@mui/icons-material/FaceRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import MoreTimeRoundedIcon from '@mui/icons-material/MoreTimeRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import '../styles/UserLayout.css';

const drawerWidth = 280;

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // --- NEW: LOGOUT MODAL STATE ---
  const [logoutOpen, setLogoutOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || { role: 'user', name: 'Guest' };
  const role = user.role;

  const userLinks = [
    { text: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/user-dashboard' },
    { text: 'AI Companion', icon: <AutoAwesomeRoundedIcon />, path: '/user/ai-chat' },
    { text: 'Robot Therapist', icon: <SmartToyRoundedIcon />, path: '/user/robot-ai' },
    { text: 'Book Session', icon: <EventAvailableRoundedIcon />, path: '/user/book' },
    { text: 'Appointments', icon: <FolderSpecialRoundedIcon />, path: '/user/appointments' },
    { text: 'Mood Tracker', icon: <FaceRoundedIcon />, path: '/user/mood' },
  ];

  const counselorLinks = [
    { text: 'Overview', icon: <DashboardRoundedIcon />, path: '/counselor-dashboard' },
    { text: 'Availability', icon: <MoreTimeRoundedIcon />, path: '/counselor/availability' },
    { text: 'My Clients', icon: <PsychologyRoundedIcon />, path: '/counselor/clients' },
    { text: 'My Schedule', icon: <EventAvailableRoundedIcon />, path: '/counselor/schedule' },
  ];

  const currentMenu = role === 'counselor' ? counselorLinks : userLinks;

  useEffect(() => {
    gsap.fromTo(".user-page-body", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
  }, [location.pathname]);

  // --- HANDLER: OPEN MODAL ---
  const handleLogoutClick = () => {
    setAnchorEl(null); // Close dropdown if open
    setLogoutOpen(true);
  };

  // --- HANDLER: CONFIRM LOGOUT ---
  const handleLogoutConfirm = () => {
    localStorage.clear();
    setLogoutOpen(false);
    navigate('/login');
  };

  // --- REUSABLE SIDEBAR CONTENT ---
  const SidebarContent = (
    <Box className="user-sidebar-inner">
      <div className="user-sidebar-logo">
        <PsychologyRoundedIcon sx={{ color: '#3B82F6', fontSize: 35 }} />
        <Typography variant="h5" fontWeight="900" letterSpacing="-1px" color="white">MindHeal</Typography>
      </div>

      <Box sx={{ px: 3, my: 3 }}>
        <Chip
          label={role === 'counselor' ? 'PROFESSIONAL' : 'MEMBER'}
          className="user-role-chip"
        />
      </Box>

      <List className="user-menu-list">
        {currentMenu.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              className={`user-menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <ListItemIcon className="user-menu-icon">{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }}
              />
              {location.pathname === item.path && <div className="user-active-indicator" />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 3, mt: 'auto' }}>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 2 }} />
        {/* UPDATED: Calls handleLogoutClick instead of direct logout */}
        <ListItemButton onClick={handleLogoutClick} className="user-logout-btn">
          <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}><LogoutRoundedIcon /></ListItemIcon>
          <ListItemText primary="Logout Session" primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box className="user-layout-wrapper">
      {/* MOBILE DRAWER */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            bgcolor: '#0F172A',
            border: 'none',
            boxShadow: '15px 0 30px rgba(0,0,0,0.4)'
          }
        }}
      >
        {SidebarContent}
      </Drawer>

      {/* DESKTOP SIDEBAR */}
      <Box sx={{ display: { xs: 'none', lg: 'block' }, width: drawerWidth, flexShrink: 0 }}>
        <Box className="user-sidebar-persistent">
          {SidebarContent}
        </Box>
      </Box>

      {/* MAIN CONTENT AREA */}
      <Box className="user-main-content">
        <AppBar position="sticky" elevation={0} className="user-navbar">
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: '80px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 2, display: { lg: 'none' }, color: '#0F172A' }}>
                <MenuRoundedIcon />
              </IconButton>
              <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: '-0.5px', color: '#0F172A' }}>
                {currentMenu.find(m => m.path === location.pathname)?.text || 'Overview'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                onClick={(e) => setAnchorEl(e.currentTarget)}
                className="user-profile-pill"
              >
                <Avatar
                  src={user.profileImage ? `http://localhost:5000/${user.profileImage.replace(/\\/g, '/')}` : ''}
                  sx={{ width: 35, height: 35, border: '2px solid #3B82F6', bgcolor: '#3B82F6' }}
                >
                  {user.name?.charAt(0)}
                </Avatar>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="subtitle2" fontWeight="900" lineHeight={1} color="#0F172A">{user.name}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Portal Access</Typography>
                </Box>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{ className: 'user-profile-menu' }}
              >
                <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>Account Settings</MenuItem>
                <Divider />
                {/* UPDATED: Calls handleLogoutClick */}
                <MenuItem onClick={handleLogoutClick} sx={{ color: '#EF4444', fontWeight: 800 }}>Sign Out</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <main className="user-page-body">
          <Outlet />
        </main>
      </Box>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        PaperProps={{
          style: { borderRadius: 20, width: '400px' }
        }}
      >
        <Box sx={{ textAlign: 'center', pt: 2 }}>
          <WarningAmberRoundedIcon sx={{ fontSize: 48, color: '#f59e0b' }} />
        </Box>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, color: '#0F172A' }}>
          Sign Out?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: 'center', color: '#64748B', fontSize: '0.95rem' }}>
            You will need to login again to access your dashboard. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button 
            onClick={() => setLogoutOpen(false)} 
            sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLogoutConfirm} 
            variant="contained" 
            sx={{ 
              bgcolor: '#EF4444', 
              color: 'white', 
              fontWeight: 700, 
              textTransform: 'none', 
              borderRadius: '10px',
              padding: '8px 24px',
              '&:hover': { bgcolor: '#DC2626' }
            }}
          >
            Yes, Sign Out
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default UserLayout;