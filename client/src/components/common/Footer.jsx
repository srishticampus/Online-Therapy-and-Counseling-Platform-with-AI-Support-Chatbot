import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, IconButton } from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmergencyIcon from '@mui/icons-material/WarningAmber';

import '../../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer-main-container">
      <div className="footer-content-grid">
        
        {/* COLUMN 1: BRAND */}
        <div className="footer-brand-side">
          <div className="footer-logo-box">
            <PsychologyIcon sx={{ color: '#3b82f6', fontSize: 35 }} />
            <span className="footer-brand-name">MindHeal</span>
          </div>
          <p className="footer-brand-desc">
            Revolutionizing mental healthcare with 24/7 AI-driven support and certified professional counseling sessions.
          </p>
          <div className="footer-social-row">
            <a href="#" className="footer-social-circle"><FacebookIcon fontSize="small"/></a>
            <a href="#" className="footer-social-circle"><TwitterIcon fontSize="small"/></a>
            <a href="#" className="footer-social-circle"><LinkedInIcon fontSize="small"/></a>
            <a href="#" className="footer-social-circle"><InstagramIcon fontSize="small"/></a>
          </div>
        </div>

        {/* COLUMN 2: QUICK LINKS */}
        <div>
          <h4 className="footer-heading">Ecosystem</h4>
          <ul className="footer-list">
            <li><Link to="/" className="footer-list-link">Home Portal</Link></li>
            <li><Link to="/about" className="footer-list-link">Our Mission</Link></li>
            <li><Link to="/contact" className="footer-list-link">Get Support</Link></li>
            <li><Link to="/login" className="footer-list-link">Counselor Login</Link></li>
          </ul>
        </div>

        {/* COLUMN 3: RESOURCES */}
        <div>
          <h4 className="footer-heading">Support</h4>
          <ul className="footer-list">
            <li><Link to="/faq" className="footer-list-link">FAQs</Link></li>
            <li><Link to="/privacy" className="footer-list-link">Privacy Policy</Link></li>
            <li><Link to="/terms" className="footer-list-link">Terms of Service</Link></li>
            <li><Link to="/careers" className="footer-list-link">Join as Counselor</Link></li>
          </ul>
        </div>

        {/* COLUMN 4: EMERGENCY */}
        <div>
          <h4 className="footer-heading">Emergency</h4>
          <div className="footer-crisis-box">
            <Typography variant="caption" sx={{ color: '#fca5a5', fontWeight: 900, display: 'block', mb: 1 }}>
              IMMEDIATE HELP
            </Typography>
            <p className="footer-crisis-text">
              In a crisis? Call 911 or text HOME to 741741 to connect with a Crisis Counselor.
            </p>
          </div>
        </div>

      </div>

      <div className="footer-bottom-divider"></div>

      <div className="footer-legal-row">
        <p className="footer-copy-text">
          &copy; {new Date().getFullYear()} MindHeal Platform. All Rights Reserved.
        </p>
        <Box display="flex" gap={3}>
            <Link to="/privacy" className="footer-list-link" style={{fontSize: '0.8rem'}}>Privacy</Link>
            <Link to="/terms" className="footer-list-link" style={{fontSize: '0.8rem'}}>Terms</Link>
            <Link to="/cookies" className="footer-list-link" style={{fontSize: '0.8rem'}}>Cookies</Link>
        </Box>
      </div>

      {/* MEDICAL DISCLAIMER - CRITICAL FOR PROFESSIONALISM */}
      <div className="footer-disclaimer-box">
        <p className="footer-disclaimer-text">
          Disclaimer: MindHeal provides AI support and connects users with licensed therapists. The AI chatbot is not a replacement for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health providers with any questions you may have regarding a medical condition.
        </p>
      </div>
    </footer>
  );
};

export default Footer;