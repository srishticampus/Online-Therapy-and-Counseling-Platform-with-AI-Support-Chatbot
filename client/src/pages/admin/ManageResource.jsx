import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Chip, IconButton } from '@mui/material';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import InsertLinkRoundedIcon from '@mui/icons-material/InsertLinkRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import VideoFileRoundedIcon from '@mui/icons-material/VideoFileRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'; 
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/ManageResource.css';

const ManageResource = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const formRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);

    // Separate state for files
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [contentFile, setContentFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Meditation",
        type: "article",
        contentUrl: "", // Used only for 'article' links or existing file URLs
        tags: ""
    });

    // Refs for hidden file inputs
    const thumbInputRef = useRef(null);
    const contentInputRef = useRef(null);

    useEffect(() => {
        if (isEditMode) {
            const fetchDetails = async () => {
                try {
                    const res = await api.get(`/resources/${id}`);
                    if (res.data.success) {
                        const r = res.data.data;
                        setFormData({ 
                            ...r, 
                            tags: r.tags ? r.tags.join(', ') : "" 
                        });
                        // Set existing thumbnail for preview
                        setThumbnailPreview(r.thumbnail || "");
                    }
                } catch (err) {
                    toast.error("Resource not found.");
                    navigate('/admin/resources');
                } finally {
                    setFetching(false);
                }
            };
            fetchDetails();
        }
        
        // Animations
        const ctx = gsap.context(() => {
            gsap.fromTo(".anim-field", 
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power3.out" }
            );
        }, formRef);
        return () => ctx.revert();
    }, [id, isEditMode, navigate]);

    // Handle Text Changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle File Changes
    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        if (field === 'thumbnail') {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file)); // Create local preview
        } else if (field === 'content') {
            setContentFile(file);
        }
    };

   const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title) return toast.error("Title is required.");
        if (formData.type === 'article' && !formData.contentUrl) return toast.error("Article Link is required.");
        // Check if new file is missing in create mode (for video/pdf)
        if (!isEditMode && formData.type !== 'article' && !contentFile) return toast.error("Please upload a file.");

        setLoading(true);
        const tid = toast.loading(isEditMode ? "Syncing updates..." : "Uploading assets & publishing...");

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('type', formData.type);
        data.append('tags', formData.tags);

        if (formData.type === 'article') {
            data.append('contentUrl', formData.contentUrl);
        }

        if (thumbnailFile) {
            data.append('thumbnail', thumbnailFile);
        }
        if (contentFile && formData.type !== 'article') {
            data.append('file', contentFile);
        }

        try {
            // FIX: Do NOT manually set Content-Type header. 
            // Axios detects FormData and sets the correct boundary automatically.
            
            if (isEditMode) {
                await api.put(`/resources/${id}`, data);
            } else {
                await api.post('/resources', data);
            }
            
            toast.success(isEditMode ? "Resource Updated" : "Resource Published", { id: tid });
            setTimeout(() => navigate('/admin/resources'), 1000);
        } catch (err) {
            console.error("Upload Error:", err);
            // Show the specific message from the backend if available
            const errorMsg = err.response?.data?.error || "Upload failed. Check file size/type.";
            toast.error(errorMsg, { id: tid });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <CircularProgress thickness={5} size={60} sx={{ color: 'var(--rm-blue)' }} />
        </Box>
    );

    return (
        <div className="rm-viewport">
            <div className="rm-container">
                
                {/* HEADER NAV */}
                <div className="rm-nav-header">
                    <Button 
                        startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />}
                        component={Link} to="/admin/resources"
                        className="rm-back-btn"
                    >
                        Back to Library
                    </Button>
                </div>

                <div className="rm-card" ref={formRef}>
                    <div className="rm-card-header">
                        <div>
                            <Typography variant="h5" fontWeight="800" color="var(--rm-navy)">
                                {isEditMode ? "Edit Resource" : "Upload Resource"}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" mt={0.5}>
                                {isEditMode ? "Update details or replace files." : "Upload videos, PDFs, or link articles."}
                            </Typography>
                        </div>
                        <Chip 
                            label={isEditMode ? "EDITING" : "NEW UPLOAD"} 
                            className={`rm-status-chip ${isEditMode ? 'edit' : 'new'}`}
                        />
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="rm-card-body">
                            <div className="rm-layout-split">
                                
                                {/* LEFT COLUMN: FORM */}
                                <div className="rm-form-column">
                                    <div className="rm-field-group anim-field">
                                        <label className="rm-label">Title</label>
                                        <input 
                                            name="title" className="rm-input" 
                                            placeholder="e.g. Morning Meditation" 
                                            value={formData.title} onChange={handleChange} autoFocus
                                        />
                                    </div>

                                    <div className="rm-row anim-field">
                                        <div className="rm-field-group">
                                            <label className="rm-label">Category</label>
                                            <div className="select-wrapper">
                                                <select name="category" className="rm-input" value={formData.category} onChange={handleChange}>
                                                    <option value="Meditation">Meditation</option>
                                                    <option value="Anxiety">Anxiety</option>
                                                    <option value="Depression">Depression</option>
                                                    <option value="Stress">Stress</option>
                                                    <option value="Relationships">Relationships</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="rm-field-group">
                                            <label className="rm-label">Format</label>
                                            <div className="select-wrapper">
                                                <select name="type" className="rm-input" value={formData.type} onChange={handleChange}>
                                                    <option value="article">Article (Link)</option>
                                                    <option value="video">Video (Upload)</option>
                                                    <option value="pdf">PDF (Upload)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rm-field-group anim-field">
                                        <label className="rm-label">Description</label>
                                        <textarea 
                                            name="description" className="rm-input rm-textarea" rows="4"
                                            placeholder="Content summary..."
                                            value={formData.description} onChange={handleChange}
                                        />
                                    </div>

                                    {/* DYNAMIC CONTENT SECTION */}
                                    <div className="rm-field-group anim-field">
                                        <label className="rm-label">
                                            {formData.type === 'article' ? "Article Link" : `Upload ${formData.type === 'pdf' ? 'Document' : 'Video'}`}
                                        </label>
                                        
                                        {formData.type === 'article' ? (
                                            <div className="rm-input-icon-wrapper">
                                                <InsertLinkRoundedIcon className="rm-input-icon" />
                                                <input 
                                                    name="contentUrl" className="rm-input pl-10" 
                                                    placeholder="https://example.com/article" 
                                                    value={formData.contentUrl} onChange={handleChange}
                                                />
                                            </div>
                                        ) : (
                                            /* FILE UPLOAD BOX */
                                            <div 
                                                className={`rm-upload-box ${contentFile ? 'has-file' : ''}`}
                                                onClick={() => contentInputRef.current.click()}
                                            >
                                                <input 
                                                    type="file" 
                                                    hidden 
                                                    ref={contentInputRef} 
                                                    accept={formData.type === 'pdf' ? "application/pdf" : "video/*"}
                                                    onChange={(e) => handleFileChange(e, 'content')}
                                                />
                                                <div className="rm-upload-content">
                                                    {contentFile ? (
                                                        <>
                                                            {formData.type === 'pdf' ? <DescriptionRoundedIcon sx={{fontSize:40, color:'#3b82f6'}}/> : <VideoFileRoundedIcon sx={{fontSize:40, color:'#3b82f6'}}/>}
                                                            <div className="file-info">
                                                                <span className="file-name">{contentFile.name}</span>
                                                                <span className="file-size">{(contentFile.size / (1024*1024)).toFixed(2)} MB</span>
                                                            </div>
                                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setContentFile(null); }}>
                                                                <CloseRoundedIcon fontSize="small"/>
                                                            </IconButton>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CloudUploadRoundedIcon sx={{fontSize: 32, color: '#94a3b8', mb: 1}}/>
                                                            <Typography variant="body2" fontWeight="600" color="textSecondary">
                                                                Click to browse {formData.type === 'pdf' ? 'PDF' : 'Video'}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                Max size: 100MB
                                                            </Typography>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {/* Helper text if in edit mode and no new file selected */}
                                        {isEditMode && formData.type !== 'article' && !contentFile && (
                                            <Typography variant="caption" sx={{color:'#16a34a', mt:0.5, display:'block'}}>
                                                ✓ Current file active. Upload new one to replace.
                                            </Typography>
                                        )}
                                    </div>

                                    <div className="rm-field-group anim-field">
                                        <label className="rm-label">Tags</label>
                                        <input 
                                            name="tags" className="rm-input" 
                                            placeholder="calm, sleep, focus" 
                                            value={formData.tags} onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: PREVIEW & THUMBNAIL */}
                                <div className="rm-preview-column anim-field">
                                    
                                    {/* THUMBNAIL UPLOAD */}
                                    <label className="rm-label">Thumbnail Image</label>
                                    <div 
                                        className="rm-thumbnail-upload"
                                        onClick={() => thumbInputRef.current.click()}
                                        style={{ backgroundImage: thumbnailPreview ? `url(${thumbnailPreview})` : 'none' }}
                                    >
                                        <input 
                                            type="file" 
                                            hidden 
                                            ref={thumbInputRef} 
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'thumbnail')}
                                        />
                                        {!thumbnailPreview && (
                                            <div className="rm-thumb-placeholder">
                                                <CloudUploadRoundedIcon />
                                                <span>Upload Cover</span>
                                            </div>
                                        )}
                                        <div className="rm-thumb-overlay">
                                            <span>Change Image</span>
                                        </div>
                                    </div>

                                    {/* CARD PREVIEW */}
                                    <label className="rm-label" style={{marginTop: 30}}>Card Preview</label>
                                    <div className="rm-preview-card">
                                        <div className="rm-preview-image-wrapper">
                                            {thumbnailPreview ? (
                                                <img src={thumbnailPreview} alt="Preview" />
                                            ) : (
                                                <div className="rm-placeholder-icon"><ImageNotSupportedIcon fontSize="large"/></div>
                                            )}
                                            <div className="rm-preview-badge">{formData.type}</div>
                                        </div>
                                        <div className="rm-preview-content">
                                            <div className="rm-preview-cat">{formData.category}</div>
                                            <div className="rm-preview-title">{formData.title || "Untitled Resource"}</div>
                                            <div className="rm-preview-desc">{formData.description || "Description will appear here..."}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="rm-footer">
                            <Button component={Link} to="/admin/resources" className="rm-btn-cancel">
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="rm-btn-save"
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={18} color="inherit"/> : <SaveRoundedIcon/>}
                            >
                                {isEditMode ? "Save Changes" : "Publish Resource"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ManageResource;