import React, { useState, useEffect, useRef } from 'react';
import { Typography, Avatar, Button, CircularProgress, Chip, Fade } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/Profile.css';

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [formData, setFormData] = useState({ ...user });
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(
        user?.profileImage ? (user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000/${user.profileImage.replace(/\\/g, '/')}`) : ""
    );

    const fileInputRef = useRef(null);
    const cardRef = useRef(null);

    // Regex Constants
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const nameRegex = /^[A-Za-z\s]*$/;

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".profile-main-card", { opacity: 0, scale: 0.95, duration: 0.6, ease: "back.out(1.2)" });
            gsap.from(".anim-item", { opacity: 0, x: -20, stagger: 0.1, delay: 0.2 });
        }, cardRef);
        return () => ctx.revert();
    }, []);

    // 1. Real-time validation in handleChange
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Block numbers/symbols in Name
        if (name === 'name' && !nameRegex.test(value)) return;

        // Block non-digits in Experience
        if (name === 'experience') {
            if (value !== '' && !/^\d+$/.test(value)) return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleImageUpdate = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleDiscard = () => {
        setIsEditing(false);
        setFormData({ ...user });
        setPreview(user?.profileImage ? (user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000/${user.profileImage.replace(/\\/g, '/')}`) : "");
        setImageFile(null);
    };

    // 2. Pre-submission validation
    const validate = () => {
        if (!formData.name || formData.name.trim().length < 2) {
            toast.error("Please enter a valid name (min 2 characters)");
            return false;
        }
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address");
            return false;
        }
        if (user.role === 'counselor') {
            if (formData.experience === "" || formData.experience === null) {
                toast.error("Experience is required");
                return false;
            }
        }
        return true;
    };

    const handleSaveProfile = async () => {
        if (!validate()) return;

        setLoading(true);
        const data = new FormData();
        
        // Append form fields
        Object.keys(formData).forEach(key => {
            // Don't send profileImage string if we have a new file
            if (key !== 'profileImage' && formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        if (imageFile) data.append('profileImage', imageFile);

        try {
            const res = await api.put('/auth/update-profile', data);
            if (res.data.success) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setUser(res.data.user);
                setFormData(res.data.user);
                setIsEditing(false);
                toast.success("Profile Synchronized Successfully");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    const renderField = (label, name, displayValue, icon, type = "text", isDropdown = false, options = []) => (
        <div className="profile-field-group anim-item">
            <div className="profile-label-row">
                {React.cloneElement(icon, { className: "field-icon" })}
                <span className="profile-label-text">{label}</span>
            </div>
            {isEditing ? (
                isDropdown ? (
                    <select 
                        name={name} 
                        className="profile-input-field" 
                        value={formData[name] || ''} 
                        onChange={handleChange}
                    >
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                ) : (
                    <input 
                        type={type} 
                        name={name} 
                        className="profile-input-field" 
                        value={formData[name] || ''} 
                        onChange={handleChange} 
                        autoComplete="off"
                    />
                )
            ) : (
                <div className="profile-display-box">
                    <Typography className="profile-display-value">
                        {displayValue || "Not provided"}
                    </Typography>
                </div>
            )}
        </div>
    );

    return (
        <div className="profile-viewport" ref={cardRef}>
            <div className="profile-main-card">
                
                {/* HEADER */}
                <div className="profile-card-header">
                    <div className="header-info">
                        <Typography className="profile-title" variant="h5">Account Settings</Typography>
                        <Typography className="profile-subtitle">Manage your public profile and professional identity.</Typography>
                    </div>
                    <div className="header-actions">
                        {!isEditing ? (
                            <Button startIcon={<EditRoundedIcon />} className="btn-edit-main" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </Button>
                        ) : (
                            <Button startIcon={<CloseRoundedIcon />} className="btn-discard-main" onClick={handleDiscard}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                <div className="profile-content-layout">
                    {/* LEFT SIDE: AVATAR & IDENTITY */}
                    <div className="profile-sidebar">
                        <div className="avatar-container">
                            <div className={`avatar-wrapper ${isEditing ? 'editing' : ''}`}>
                                <Avatar src={preview} className="profile-avatar-large">
                                    {user.name ? user.name.charAt(0) : 'U'}
                                </Avatar>
                                {isEditing && (
                                    <div className="avatar-overlay" onClick={() => fileInputRef.current.click()}>
                                        <PhotoCameraIcon />
                                        <Typography variant="caption">Change</Typography>
                                    </div>
                                )}
                            </div>
                            <input type="file" hidden ref={fileInputRef} onChange={handleImageUpdate} accept="image/*" />
                        </div>
                        
                        <div className="sidebar-identity">
                            <Typography variant="h6" className="sidebar-name">{user.name}</Typography>
                            <Chip label={user.role.toUpperCase()} className={`role-chip ${user.role}`} />
                            <div className={`status-indicator ${user.isApproved ? 'active' : 'pending'}`}>
                                <span className="dot"></span>
                                {user.isApproved ? "Verified Account" : "Pending Approval"}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: DATA GRID */}
                    <div className="profile-data-grid">
                        <Typography className="section-divider">General Information</Typography>
                        <div className="grid-row">
                            {renderField("Full Name", "name", user.name, <PersonRoundedIcon />)}
                            {renderField("Email Address", "email", user.email, <EmailRoundedIcon />, "email")}
                        </div>

                        {user.role === 'counselor' && (
                            <>
                                <Typography className="section-divider">Professional Credentials</Typography>
                                <div className="grid-row">
                                    {renderField("License ID", "licenseId", user.licenseId, <SecurityRoundedIcon />)}
                                    {renderField("Counselor Code", "counselorCode", user.counselorCode, <PersonRoundedIcon />)}
                                </div>
                                <div className="grid-row">
                                    {/* Display suffix "Years" only in view mode */}
                                    {renderField("Experience", "experience", `${user.experience || 0} Years`, <WorkRoundedIcon />, "text")}
                                    {renderField("Specialization", "specialization", user.specialization, <SchoolRoundedIcon />, "text", true, 
                                        ["Clinical Psychology", "Anxiety Specialist", "Depression Specialist", "Marriage & Family", "Trauma Support"])}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* FOOTER SAVE BUTTON */}
                <Fade in={isEditing}>
                    <div className="profile-footer-bar">
                        <Button 
                            className="btn-save-final"
                            onClick={handleSaveProfile} 
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleRoundedIcon />}
                        >
                            {loading ? "Updating..." : "Save Changes"}
                        </Button>
                    </div>
                </Fade>
            </div>
        </div>
    );
};

export default Profile;