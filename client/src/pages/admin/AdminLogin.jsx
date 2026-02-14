import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import gsap from 'gsap';
import toast from 'react-hot-toast'; // For notifications
import api from '../../services/api'; // Your Axios instance
import '../../styles/AdminLogin.css';

// MUI Icons
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const AdminLogin = () => {
  const mainRef = useRef(null);
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState({ email: '', password: '' });

  useEffect(() => {
    let ctx = gsap.context(() => {
      // 1. ANIME MOVING OBJECTS
      gsap.to(".admin-login-obj-1", {
        x: "30vw", y: "20vh", duration: 15, repeat: -1, yoyo: true, ease: "sine.inOut"
      });
      gsap.to(".admin-login-obj-2", {
        x: "-20vw", y: "-30vh", duration: 20, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1
      });
      gsap.to(".admin-login-obj-3", {
        rotate: 360, duration: 25, repeat: -1, ease: "none"
      });

      // 2. ENTRANCE ANIMATIONS
      const tl = gsap.timeline();
      tl.from(".admin-login-visual-area", { width: 0, duration: 1.2, ease: "power4.inOut" })
        .from(".admin-login-glass-content", { opacity: 0, scale: 0.8, duration: 1, ease: "power3.out" }, "-=0.5")
        .from(".admin-login-form-box > *", { y: 30, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out" }, "-=0.8");
    }, mainRef);
    return () => ctx.revert();
  }, []);

  // --- API INTEGRATION: ADMIN LOGIN ---
  const handleAdminSubmit = async (e) => {
    e.preventDefault();

    // Start loading toast
    const toastId = toast.loading("Authorizing master access...");
    setLoading(true);

    try {
      // Call your backend admin-login route
      const response = await api.post('/auth/admin-login', adminData);

      if (response.data.success) {
        // 1. Store Admin Token and Role
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);

        // 2. Success Feedback
        toast.success("Master access granted. Welcome, Admin.", { id: toastId });

        // 3. Redirect to Admin Dashboard
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 1500);
      }
    } catch (err) {
      // Handle 401 Unauthorized or Server errors
      const errMsg = err.response?.data?.message || "Invalid Admin Credentials";
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-main-container" ref={mainRef}>

      {/* LEFT: MOVING OBJECTS BACKGROUND */}
      <div className="admin-login-visual-area">
        <div className="admin-login-moving-object admin-login-obj-1"></div>
        <div className="admin-login-moving-object admin-login-obj-2"></div>
        <div className="admin-login-moving-object admin-login-obj-3"></div>

        <div className="admin-login-glass-content">
          <VerifiedUserIcon className="admin-login-hero-icon" />
          <h1 className="admin-login-visual-title">Central Authority</h1>
          <p style={{ color: '#94a3b8', maxWidth: '350px', margin: '0 auto', lineHeight: 1.6 }}>
            Authorized Personnel Only. Providing access to the MindHeal core administration and management tools.
          </p>
        </div>
      </div>

      {/* RIGHT: PROFESSIONAL MINIMALIST FORM */}
      <div className="admin-login-form-area">
        <div className="admin-login-form-box">

          <div className="admin-login-form-header">
            <h2 className="admin-login-form-title">System Sign In</h2>
            <p className="admin-login-form-subtitle">Admin Portal Verification</p>
          </div>

          <form onSubmit={handleAdminSubmit}>
            {/* EMAIL */}
            <div className="admin-login-field-group">
              <label className="admin-login-field-label">Official Email</label>
              <div className="admin-login-input-wrapper">
                <AlternateEmailIcon className="admin-login-input-icon" />
                <input
                  type="email"
                  className="admin-login-input-control"
                  placeholder="Enter your email"
                  required
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="admin-login-field-group">
              <label className="admin-login-field-label">Security Key</label>
              <div className="admin-login-input-wrapper">
                <VpnKeyIcon className="admin-login-input-icon" />
                <input
                  type={showPass ? "text" : "password"}
                  className="admin-login-input-control"
                  placeholder="Enter secure key"
                  required
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                  autoComplete="off"
                />
                <div className="admin-login-pw-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </div>
              </div>
            </div>

            <button type="submit" className="admin-login-btn-submit" disabled={loading}>
              {loading ? "Authenticating..." : "Authorize & Access"}
            </button>
          </form>

          <p style={{ marginTop: '40px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
            Powered by MindHeal Security Stack v2.0
          </p>
        </div>
      </div>

    </div>
  );
};

export default AdminLogin;