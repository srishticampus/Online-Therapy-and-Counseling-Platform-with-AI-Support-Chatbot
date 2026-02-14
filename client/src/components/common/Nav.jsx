import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Menu, 
  MenuItem, 
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Fade
} from '@mui/material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PsychologyIcon from '@mui/icons-material/Psychology'; 
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE ---
  const [anchorEl, setAnchorEl] = useState(null); 
  const [mobileOpen, setMobileOpen] = useState(false); 
  const [scrolled, setScrolled] = useState(false); 

  const open = Boolean(anchorEl);

  // --- SCROLL LOGIC ---
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- HANDLERS ---
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNavigate = (path) => {
    navigate(path);
    handleClose();
    setMobileOpen(false);
  };

  // Dynamic Styles based on scroll and page
  const isHome = location.pathname === "/";
  const navBg = scrolled || !isHome ? "#0f172a" : "transparent";
  const navBlur = scrolled ? "blur(10px)" : "none";

  const linkStyle = {
    color: '#fff',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    mx: 1.5,
    '&:hover': { color: '#3b82f6', backgroundColor: 'transparent' }
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={scrolled ? 4 : 0}
        sx={{ 
          backgroundColor: navBg, 
          backdropFilter: navBlur,
          transition: 'all 0.3s ease-in-out',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: 80 }}>
            
            {/* --- LOGO SECTION --- */}
            <Box 
              onClick={() => handleNavigate('/')}
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1 }}
            >
              <PsychologyIcon sx={{ fontSize: 35, color: '#3b82f6' }} />
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 800,
                  letterSpacing: '-1px',
                  color: 'white',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                MindHeal
              </Typography>
            </Box>

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* --- DESKTOP LINKS --- */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              <Button component={Link} to="/" sx={linkStyle}>Home</Button>
              <Button component={Link} to="/about" sx={linkStyle}>About</Button>
              <Button component={Link} to="/contact" sx={linkStyle}>Contact Us</Button>

              {/* LOGIN PILL BUTTON */}
              <Button
                onClick={handleMenuClick}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{ 
                  ml: 2,
                  px: 3,
                  py: 1,
                  borderRadius: '50px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#2563eb' },
                  boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)'
                }}
              >
                Login
              </Button>

              {/* DROPDOWN MENU */}
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: '12px',
                    minWidth: 200,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    p: 1
                  }
                }}
              >
                <MenuItem onClick={() => handleNavigate('/admin/login')} sx={{ borderRadius: '8px', py: 1.5 }}>
                  <AdminPanelSettingsIcon sx={{ mr: 1.5, color: '#64748b' }} />
                  <Typography fontWeight={600}>Admin Portal</Typography>
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => handleNavigate('/login')} sx={{ borderRadius: '8px', py: 1.5 }}>
                  <PersonIcon sx={{ mr: 1.5, color: '#64748b' }} />
                  <Typography fontWeight={600}>User / Counselor</Typography>
                </MenuItem>
              </Menu>
            </Box>

            {/* --- MOBILE HAMBURGER --- */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
                <MenuIcon fontSize="large" />
              </IconButton>
            </Box>

          </Toolbar>
        </Container>
      </AppBar>

      {/* --- MOBILE DRAWER --- */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 280, bgcolor: '#0f172a', color: 'white' } }}
      >
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={800}>MindHeal</Typography>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        <List sx={{ p: 2 }}>
          {['Home', 'About', 'Contact Us'].map((text) => (
            <ListItem key={text} disablePadding>
              <ListItemButton onClick={() => handleNavigate(text === 'Home' ? '/' : `/${text.toLowerCase().replace(" ", "")}`)}>
                <ListItemText primary={text} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
          <Typography variant="caption" sx={{ color: '#94a3b8', px: 2, mb: 1, display: 'block' }}>PORTAL ACCESS</Typography>
          <ListItemButton onClick={() => handleNavigate('/admin/login')} sx={{ borderRadius: '10px', mb: 1 }}>
            <ListItemText primary="Admin Login" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigate('/login')} sx={{ borderRadius: '10px', bgcolor: '#3b82f6' }}>
            <ListItemText primary="User Login" />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;