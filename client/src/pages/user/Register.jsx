import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import '../../styles/Register.css';

// MUI Icons
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';

const Register = () => {
  const navigate = useNavigate();
  const scopeRef = useRef(null);

  const [role, setRole] = useState('user');
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false); // Separate state for confirm pass
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseId: '',
    counselorCode: '',
    specialization: 'Clinical Psychology',
    experience: ''
  });

  // Validation Regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const nameRegex = /^[A-Za-z\s]*$/;
  // Strong Password: Min 8 chars, 1 Upper, 1 Lower, 1 Number, 1 Special Char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Real-time restriction for Name (Alphabets only)
    if (name === 'name') {
      if (!nameRegex.test(value)) return; 
    }

    // Real-time restriction for Experience (Numbers only)
    if (name === 'experience') {
        if (value !== '' && !/^\d+$/.test(value)) return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    if (formData.name.trim().length < 2) {
        toast.error("Please enter a valid name");
        return false;
    }
    if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return false;
    }
    if (role === 'counselor' && (!formData.experience || formData.experience < 0)) {
        toast.error("Please enter a valid number of years for experience");
        return false;
    }
    if (!passwordRegex.test(formData.password)) {
        toast.error("Password must be 8+ characters with uppercase, lowercase, number, and special character");
        return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const toastId = toast.loading("Creating your MindHeal profile...");
    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('role', role);
    if (imageFile) data.append('profileImage', imageFile);

    if (role === 'counselor') {
      data.append('licenseId', formData.licenseId);
      data.append('counselorCode', formData.counselorCode);
      data.append('specialization', formData.specialization);
      data.append('experience', formData.experience);
    }

    try {
      const response = await api.post('/auth/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success(response.data.message, { id: toastId, duration: 5000 });
        navigate('/login');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Registration failed. Try again.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-split-container" ref={scopeRef}>
      <div className="reg-left-panel">
        <div className="reg-blob blob-large"></div>
        <div className="reg-blob blob-med"></div>
        <div className="reg-left-content">
          <h1 className="reg-left-title">Empowering Your Mental Wellness.</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.7, lineHeight: 1.7 }}>
            Connect with licensed therapists and AI support. Start your journey today.
          </p>
        </div>
      </div>

      <div className="reg-right-panel">
        <div className="reg-form-wrapper">
          <div className="reg-form-header reg-animate">
            <h2 className="reg-form-title-text">Create Account</h2>
            <p style={{ color: '#64748b' }}>Select your role and fill in your details.</p>
          </div>

          <div className="reg-tabs reg-animate">
            <button type="button" className={`reg-tab-item ${role === 'user' ? 'active' : ''}`} onClick={() => setRole('user')}>User Account</button>
            <button type="button" className={`reg-tab-item ${role === 'counselor' ? 'active' : ''}`} onClick={() => setRole('counselor')}>Counselor Profile</button>
          </div>

          <form onSubmit={handleSubmit} className="reg-form-element-container">
            <div className="reg-avatar-row reg-animate">
              <input type="file" id="regAvatar" hidden onChange={handleImage} />
              <label htmlFor="regAvatar" className="reg-avatar-box">
                {preview ? <img src={preview} alt="Profile" /> : <PhotoCameraIcon color="disabled" />}
              </label>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Profile Picture</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Click to upload</p>
              </div>
            </div>

            <div className="reg-grid">
              <div className="reg-input-group reg-animate">
                <label className="reg-label">Full Name</label>
                <div className="reg-input-container">
                  <PersonOutlineIcon className="reg-input-icon" />
                  <input 
                    type="text" 
                    name="name" 
                    className="reg-field" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="John Doe" 
                    required 
                  />
                </div>
              </div>

              <div className="reg-input-group reg-animate">
                <label className="reg-label">Email Address</label>
                <div className="reg-input-container">
                  <MailOutlineIcon className="reg-input-icon" />
                  <input 
                    type="email" 
                    name="email" 
                    className="reg-field" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="john@example.com" 
                    required 
                  />
                </div>
              </div>

              {role === 'counselor' && (
                <>
                  <div className="reg-input-group reg-animate">
                    <label className="reg-label">License Number</label>
                    <div className="reg-input-container">
                      <VerifiedUserIcon className="reg-input-icon" />
                      <input type="text" name="licenseId" className="reg-field" value={formData.licenseId} onChange={handleChange} placeholder="LIC-12345" required />
                    </div>
                  </div>
                  <div className="reg-input-group reg-animate">
                    <label className="reg-label">Counselor ID</label>
                    <div className="reg-input-container">
                      <BadgeOutlinedIcon className="reg-input-icon" />
                      <input type="text" name="counselorCode" className="reg-field" value={formData.counselorCode} onChange={handleChange} placeholder="CID-0099" required />
                    </div>
                  </div>
                  <div className="reg-full reg-input-group reg-animate">
                    <label className="reg-label">Specialization</label>
                    <div className="reg-input-container">
                      <HistoryEduIcon className="reg-input-icon" />
                      <select name="specialization" className="reg-field" value={formData.specialization} onChange={handleChange}>
                        <option value="Clinical Psychology">Clinical Psychology</option>
                        <option value="Anxiety Specialist">Anxiety Specialist</option>
                        <option value="Marriage & Family">Marriage & Family</option>
                      </select>
                    </div>
                  </div>
                  <div className="reg-full reg-input-group reg-animate">
                    <label className="reg-label">Experience (Years)</label>
                    <div className="reg-input-container">
                      <WorkHistoryIcon className="reg-input-icon" />
                      <input 
                        type="number" 
                        name="experience" 
                        className="reg-field" 
                        value={formData.experience} 
                        onChange={handleChange} 
                        placeholder="e.g. 5" 
                        min="0"
                        required 
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="reg-input-group reg-animate">
                <label className="reg-label">Password</label>
                <div className="reg-input-container">
                  <LockOutlinedIcon className="reg-input-icon" />
                  <input 
                    type={showPass ? "text" : "password"} 
                    name="password" 
                    className="reg-field" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="••••••••" 
                    required 
                  />
                  <div className="reg-password-eye" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </div>
                </div>
              </div>

              <div className="reg-input-group reg-animate">
                <label className="reg-label">Confirm Password</label>
                <div className="reg-input-container">
                  <LockOutlinedIcon className="reg-input-icon" />
                  <input 
                    type={showConfirmPass ? "text" : "password"} 
                    name="confirmPassword" 
                    className="reg-field" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    placeholder="••••••••" 
                    required 
                  />
                  {/* Added Eye Icon for Confirm Password */}
                  <div className="reg-password-eye" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                    {showConfirmPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="reg-btn-submit reg-animate" disabled={loading}>
              {loading ? "Processing..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </button>
          </form>

          <p className="reg-animate" style={{ textAlign: 'center', marginTop: '30px', color: '#64748b', paddingBottom: '40px' }}>
            Already a member? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 800, textDecoration: 'none' }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;