import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, IconButton, Typography, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, 
  Badge, Menu, MenuItem, Divider, useMediaQuery, useTheme,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import gsap from 'gsap';
import api from '../services/api'; 

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MailIcon from '@mui/icons-material/Mail';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import '../styles/AdminLayout.css';

const drawerWidth = 280;

const AdminLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // --- STATE FOR NOTIFICATIONS & MODAL ---
  const [pendingCount, setPendingCount] = useState(0);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin-dashboard' },
    { text: 'Counselor Approval', icon: <VerifiedUserIcon />, path: '/admin/verify-counselors' },
    { text: 'Users List', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Appointments', icon: <EventNoteIcon />, path: '/admin/appointments' },
    { text: 'Resources', icon: <PsychologyIcon />, path: '/admin/resources' },
    { text: 'Messages', icon: <MailIcon />, path: '/admin/contact' }, 
  ];

  // Animation
  useEffect(() => {
    gsap.fromTo(".admin-page-container", 
      { opacity: 0, y: 10 }, 
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, [location.pathname]);

  // --- FETCH NOTIFICATIONS ---
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/contact?status=pending');
        if (res.data.success) {
          setPendingCount(res.data.count);
        }
      } catch (err) {
        console.error("Failed to fetch notifications");
      }
    };
    fetchNotifications();
  }, [location.pathname]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // --- LOGOUT HANDLERS ---
  const handleLogoutClick = () => {
    setAnchorEl(null); // Close dropdown if open
    setLogoutOpen(true); // Open Modal
  };

  const handleLogoutConfirm = () => {
    localStorage.clear();
    setLogoutOpen(false);
    navigate('/admin/login');
  };

  const SidebarContent = (
    <Box className="admin-sidebar-inner">
      <div className="admin-sidebar-logo">
        <PsychologyIcon sx={{ color: '#3b82f6', fontSize: 32 }} />
        <Typography variant="h6" fontWeight="900" letterSpacing="-1px" color="white">
          MindHeal <span style={{fontSize: '10px', color: '#3b82f6'}}>ADMIN</span>
        </Typography>
      </div>
      
      <List className="admin-menu-list">
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              className={`admin-menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <ListItemIcon className="admin-menu-icon">
                {item.text === 'Messages' && pendingCount > 0 ? (
                    <Badge badgeContent={pendingCount} color="error" sx={{'& .MuiBadge-badge': {fontSize: '0.6rem', height: 16, minWidth: 16}}}>
                        {item.icon}
                    </Badge>
                ) : item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }} 
              />
              {location.pathname === item.path && <div className="active-indicator" />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 3, mt: 'auto' }}>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.08)', mb: 2 }} />
        {/* Updated Logout Button in Sidebar */}
        <ListItemButton onClick={handleLogoutClick} className="admin-logout-btn">
          <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout Session" primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box className="admin-main-wrapper">
      {/* MOBILE DRAWER */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            bgcolor: '#0f172a', 
            border: 'none',
            boxShadow: '10px 0 25px rgba(0,0,0,0.5)'
          },
        }}
      >
        {SidebarContent}
      </Drawer>

      {/* DESKTOP SIDEBAR */}
      <Box sx={{ display: { xs: 'none', lg: 'block' }, width: drawerWidth, flexShrink: 0 }}>
        <Box className="admin-sidebar-persistent">
            {SidebarContent}
        </Box>
      </Box>

      {/* MAIN CONTENT AREA */}
      <Box className="admin-content-area">
        <AppBar position="static" elevation={0} className="admin-navbar">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton color="inherit" onClick={handleDrawerToggle} sx={{ mr: 2, display: { lg: 'none' } }}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" fontWeight="900" className="nav-page-title">
                {menuItems.find(m => m.path === location.pathname)?.text || 'Overview'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
              
              <IconButton 
                color="inherit" 
                className="nav-icon-btn"
                onClick={() => navigate('/admin/contact')}
              >
                <Badge badgeContent={pendingCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              
              <Box className="admin-profile-pill" onClick={handleProfileMenu}>
                <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32, fontWeight: 700, fontSize: '0.9rem' }}>A</Avatar>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                   <Typography variant="caption" className="profile-name">System Admin</Typography>
                </Box>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{ className: 'profile-menu-paper' }}
              >
                <MenuItem onClick={handleClose}>Admin Profile</MenuItem>
                <MenuItem onClick={handleClose}>Security Settings</MenuItem>
                <Divider />
                {/* Updated Logout Button in Menu */}
                <MenuItem onClick={handleLogoutClick} sx={{ color: '#ef4444', fontWeight: 800 }}>Logout</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <main className="admin-page-container">
          <Outlet />
        </main>
      </Box>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        PaperProps={{
          style: { borderRadius: 20, padding: '10px', width: '400px' }
        }}
      >
        <Box sx={{ textAlign: 'center', pt: 2 }}>
          <WarningAmberRoundedIcon sx={{ fontSize: 48, color: '#ef4444' }} />
        </Box>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 900, color: '#0f172a' }}>
          Terminate Session?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: 'center', color: '#64748B', fontSize: '0.95rem' }}>
            You are about to log out of the Admin Console. You will need to re-authenticate to access system data.
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
            Yes, Log Out
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AdminLayout;