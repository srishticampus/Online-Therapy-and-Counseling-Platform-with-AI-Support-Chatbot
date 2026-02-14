import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import api from '../../services/api'; // Your Axios instance
import '../../styles/UserLogin.css';

// MUI Icons
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FavoriteIcon from '@mui/icons-material/Favorite';

const UserLogin = () => {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  // --- STATE ---
  const [showPw, setShowPw] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [clickCount, setClickCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const heartColors = ['#FF4D4D', '#FF8C00', '#FFD700', '#4CAF50', '#2196F3', '#9C27B0', '#F48FB1', '#2DD4BF'];

  // --- API HANDLER: LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();

    // 1. Show Loading Toast
    const toastId = toast.loading("Verifying your credentials...");
    setLoading(true);

    try {
      // 2. Call Backend API
      const response = await api.post('/auth/login', formData);

      if (response.data.success) {
        // 3. Store Data in LocalStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // 4. Success Message
        toast.success(`Welcome back, ${response.data.user.name}!`, { id: toastId });
        triggerPoppers(); // Small celebration

        // 5. Role-Based Navigation
        setTimeout(() => {
          const role = response.data.user.role;
          if (role === 'admin') navigate('/admin-dashboard');
          else if (role === 'counselor') navigate('/counselor-dashboard');
          else navigate('/user-dashboard');
        }, 1500);
      }
    } catch (err) {
      // 6. Handle Errors (401, 403, 500)
      const errorMsg = err.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- INTERACTION: HEARTS & POPPERS ---
  const handleLeftClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const randomColor = heartColors[Math.floor(Math.random() * heartColors.length)];
    const id = Date.now();
    setHearts((prev) => [...prev, { id, x, y, color: randomColor }]);

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount % 10 === 0) {
      toast("Peace achieved! 10 Clicks.", { icon: '✨', position: 'bottom-left' });
      triggerPoppers();
    }
  };

  const triggerPoppers = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6, x: 0.25 }, // Fires from the visual side
      colors: heartColors
    });
  };

  // --- GSAP EFFECTS ---
  useEffect(() => {
    let ctx = gsap.context(() => {
      // Entrance Animation
      gsap.from(".user-login-form-content > *", {
        y: 20, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power2.out"
      });

      // Passive Blob Drifting
      gsap.to(".user-login-blob-1", { x: "+=100", y: "+=50", duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".user-login-blob-2", { x: "-=80", y: "-=100", duration: 12, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".user-login-blob-3", { x: "+=50", y: "+=150", duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, panelRef);

    return () => ctx.revert();
  }, []);

  // Animate Spawning Hearts
  useEffect(() => {
    if (hearts.length > 0) {
      const lastHeart = hearts[hearts.length - 1];
      const heartEl = document.getElementById(`heart-${lastHeart.id}`);
      if (heartEl) {
        gsap.fromTo(heartEl,
          { opacity: 1, scale: 0.5, y: 0 },
          {
            opacity: 0, scale: 2.5, y: -200, duration: 2, ease: "power2.out",
            onComplete: () => setHearts((prev) => prev.filter(h => h.id !== lastHeart.id))
          }
        );
      }
    }
  }, [hearts]);

  return (
    <div className="user-login-wrapper" ref={panelRef}>

      {/* --- LEFT SIDE: INTERACTIVE VISUAL --- */}
      <div className="user-login-image-panel" onClick={handleLeftClick}>
        <div className="user-login-canvas-bg"></div>
        <div className="user-login-moving-blob user-login-blob-1"></div>
        <div className="user-login-moving-blob user-login-blob-2"></div>
        <div className="user-login-moving-blob user-login-blob-3"></div>

        {hearts.map((heart) => (
          <div
            key={heart.id}
            id={`heart-${heart.id}`}
            className="user-login-heart-spawn"
            style={{
              left: heart.x - 15,
              top: heart.y - 15,
              color: heart.color,
              filter: `drop-shadow(0 0 10px ${heart.color}80)`
            }}
          >
            <FavoriteIcon sx={{ fontSize: 35 }} />
          </div>
        ))}

        <div className="user-login-image-text">
          <PsychologyIcon sx={{ fontSize: 60, mb: 3, color: '#3b82f6' }} />
          <h1>MindHeal</h1>
          <p>
            "Wellness is not a destination, but a process." <br />
            Take a breath. Click anywhere on this side to relax.
            <br />
            <span style={{ fontSize: '0.9rem', color: '#3b82f6', marginTop: '10px', display: 'block' }}>
              Mindfulness points: {clickCount}
            </span>
          </p>
        </div>
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="user-login-form-panel">
        <div className="user-login-form-content">
          <h1 className="user-login-form-title">Welcome back</h1>
          <p className="user-login-form-subtitle">Login to access your personalized wellness dashboard</p>

          <form onSubmit={handleLogin}>
            {/* Email Address */}
            <div className="user-login-input-group">
              <label className="user-login-input-label">Email Address</label>
              <div className="user-login-input-container">
                <EmailOutlinedIcon className="user-login-icon-prefix" />
                <input
                  type="email"
                  name="email"
                  className="user-login-input-field"
                  placeholder="Enter your email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password */}
            <div className="user-login-input-group">
              <label className="user-login-input-label">Password</label>
              <div className="user-login-input-container">
                <LockOutlinedIcon className="user-login-icon-prefix" />
                <input
                  type={showPw ? "text" : "password"}
                  name="password"
                  className="user-login-input-field"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="off"
                />
                <div className="user-login-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                </div>
              </div>
            </div>

            <div className="user-login-action-bar">
              <Link to="/forgot-password" title="Reset Password" className="user-login-forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="user-login-submit-btn" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="user-login-signup-box">
            Don't have an account? <Link to="/register" className="user-login-signup-link">Create account</Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UserLogin;