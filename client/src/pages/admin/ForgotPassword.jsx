import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../../styles/ForgotPassword.css';

// MUI Icons
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DialpadIcon from '@mui/icons-material/Dialpad';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(".forgot-password-card-content",
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
      );
    }, cardRef);
    return () => ctx.revert();
  }, [step]);

  // STEP 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Checking our records...");
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success("Verification code sent to your email!", { id: toastId });
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Email not found.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP (The Fix is here)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Please enter the 6-digit code.");

    const toastId = toast.loading("Verifying code...");
    setLoading(true);

    try {
      // We call the backend to check if OTP is valid before showing Step 3
      const response = await api.post('/auth/verify-otp', { email, otp });

      if (response.data.success) {
        toast.success("Code verified successfully!", { id: toastId });
        setStep(3); // Only move to password step if response is success
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP code.", { id: toastId });
      // Remains on Step 2 because of the error
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwords.new.length < 6) return toast.error("Password must be at least 6 characters.");
    if (passwords.new !== passwords.confirm) return toast.error("Passwords do not match.");

    const toastId = toast.loading("Updating your password...");
    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword: passwords.new
      });

      if (response.data.success) {
        toast.success("Password reset successful!", { id: toastId });
        setStep(4);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-viewport" ref={cardRef}>
      <div className="forgot-password-blob forgot-password-blob-1"></div>
      <div className="forgot-password-blob forgot-password-blob-2"></div>

      <div className="forgot-password-card">
        <div className="forgot-password-card-content">

          {step === 1 && (
            <>
              <div className="forgot-password-icon-box"><MailOutlineIcon sx={{ fontSize: 40 }} /></div>
              <h1 className="forgot-password-title">Identity Verification</h1>
              <p className="forgot-password-desc">Enter your email to receive a 6-digit security code.</p>
              <form className="forgot-password-form" onSubmit={handleRequestOtp}>
                <label className="forgot-password-label">Email Address</label>
                <div className="forgot-password-input-wrapper">
                  <MailOutlineIcon className="forgot-password-field-icon" />
                  <input type="email" className="forgot-password-input" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="forgot-password-submit-btn" disabled={loading}>Get Code</button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="forgot-password-icon-box" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}><MarkEmailReadIcon sx={{ fontSize: 40 }} /></div>
              <h1 className="forgot-password-title">Check Your Inbox</h1>
              <p className="forgot-password-desc">Code sent to <strong>{email}</strong>.</p>
              <form className="forgot-password-form" onSubmit={handleVerifyOtp}>
                <label className="forgot-password-label">6-Digit Code</label>
                <div className="forgot-password-input-wrapper">
                  <DialpadIcon className="forgot-password-field-icon" />
                  <input type="text" className="forgot-password-input" placeholder="Enter Code" maxLength="6" required value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>
                <button type="submit" className="forgot-password-submit-btn" disabled={loading}>Verify & Continue</button>
                <p className="forgot-password-resend-text">Code didn't arrive? <span onClick={() => setStep(1)}>Try again</span></p>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="forgot-password-icon-box" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}><VpnKeyIcon sx={{ fontSize: 40 }} /></div>
              <h1 className="forgot-password-title">New Password</h1>
              <p className="forgot-password-desc">Set your new secure password below.</p>
              <form className="forgot-password-form" onSubmit={handleResetPassword}>
                <div className="forgot-password-input-wrapper">
                  <VpnKeyIcon className="forgot-password-field-icon" />
                  <input type={showNewPass ? "text" : "password"} className="forgot-password-input" placeholder="New Password" required onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
                  <div className="forgot-password-eye-icon" onClick={() => setShowNewPass(!showNewPass)}>{showNewPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</div>
                </div>
                <div className="forgot-password-input-wrapper">
                  <VpnKeyIcon className="forgot-password-field-icon" />
                  <input type={showConfirmPass ? "text" : "password"} className="forgot-password-input" placeholder="Confirm Password" required onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                  <div className="forgot-password-eye-icon" onClick={() => setShowConfirmPass(!showConfirmPass)}>{showConfirmPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</div>
                </div>
                <button type="submit" className="forgot-password-submit-btn" disabled={loading}>Update Password</button>
              </form>
            </>
          )}

          {step === 4 && (
            <div className="forgot-password-success-view">
              <CheckCircleOutlineIcon className="forgot-password-success-icon" sx={{ fontSize: 60, color: '#10b981', mb: 2 }} />
              <h1 className="forgot-password-title">Success</h1>
              <p className="forgot-password-desc">Your password has been updated.</p>
              <button className="forgot-password-submit-btn" onClick={() => navigate('/login')}>Login Now</button>
            </div>
          )}

          {step !== 4 && (
            <Link to="/login" className="forgot-password-back-link"><ArrowBackIcon sx={{ fontSize: 18 }} /> Back to Login</Link>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;