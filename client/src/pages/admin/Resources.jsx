import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Typography, CircularProgress, IconButton, 
    Button, Dialog, DialogTitle, DialogContent, 
    DialogActions, Fab, Portal, Zoom 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/Resources.css';

const CATEGORIES = ["All", "Meditation", "Anxiety", "Depression", "Stress", "Relationships"];

const Resources = () => {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");
    
    // Auth State
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    const isAdmin = localStorage.getItem('role') === 'admin';

    // Content Viewer State
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedRes, setSelectedRes] = useState(null);

    // Delete Modal State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const res = await api.get('/resources');
            console.log(res);
            
            setResources(res.data.data);
        } catch (err) {
            toast.error("Failed to connect to the library.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchResources(); }, []);

    useEffect(() => {
        if (!loading) {
            gsap.fromTo(".res-card", 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power3.out", clearProps: "all" }
            );
        }
    }, [loading, activeCategory]);

    const filtered = resources.filter(r => {
        const matchesCat = activeCategory === "All" || r.category === activeCategory;
        const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    // --- HANDLERS ---

    const handleEditClick = (id) => navigate(`/admin/resources/edit/${id}`);
    const handleAddClick = () => navigate('/admin/resources/add');

    const handleDelete = async () => {
        const tid = toast.loading("Removing resource...");
        try {
            await api.delete(`/resources/${deleteTargetId}`);
            toast.success("Purged from library", { id: tid });
            setDeleteConfirmOpen(false);
            fetchResources();
        } catch (err) { toast.error("Delete failed", { id: tid }); }
    };

    // --- CONTENT VIEWER LOGIC ---
    const handleViewContent = (resource) => {
        // If it's an external link (Article), open in new tab
        if (resource.type === 'article' || resource.contentUrl.startsWith('http')) {
            window.open(resource.contentUrl, '_blank');
        } else {
            // If it's an internal file (Video/PDF), open the modal
            setSelectedRes(resource);
            setViewerOpen(true);
        }
    };

    const getFileUrl = (path) => {
        if (!path) return "";
        // Ensure path uses forward slashes and points to your backend uploads
        return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
    };

    return (
        <Box className="res-viewport">
            {/* HERO */}
            <div className="res-hero">
                <Typography variant="h3" fontWeight="900">Healing Resources</Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>Professional guides to navigate your mental health journey.</Typography>
                
                <div className="res-search-container">
                    <SearchIcon sx={{ position: 'absolute', left: 20, top: 18, color: '#94a3b8' }} />
                    <input 
                        className="res-search-input" 
                        placeholder="Search for topics, articles, or videos..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* FILTERS */}
            <div className="res-category-bar">
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat} 
                        className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* GRID */}
            <Box maxWidth="1200px" margin="0 auto">
                {loading ? (
                    <Box textAlign="center" py={10}><CircularProgress thickness={5} /></Box>
                ) : filtered.length === 0 ? (
                    <Typography align="center" color="textSecondary" mt={10}>No content found.</Typography>
                ) : (
                    <div className="res-grid">
                        {filtered.map((res) => (
                            <div key={res._id} className="res-card">
                                <div className="res-thumb-container">
                                    {/* Handle Local vs External Thumbnail */}
                                    <img 
                                        src={res.thumbnail?.startsWith('http') ? res.thumbnail : getFileUrl(res.thumbnail)} 
                                        className="res-thumb" 
                                        alt="" 
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'; }}
                                    />
                                    <div className="res-type-badge">{res.type}</div>
                                </div>
                                <div className="res-content">
                                    <Typography className="res-title">{res.title}</Typography>
                                    <Typography className="res-desc">{res.description}</Typography>
                                    <div className="res-footer">
                                        <Button 
                                            variant="contained" 
                                            size="small"
                                            startIcon={
                                                res.type === 'video' ? <PlayCircleOutlineIcon /> : 
                                                res.type === 'pdf' ? <PictureAsPdfIcon /> : <LaunchRoundedIcon />
                                            }
                                            onClick={() => handleViewContent(res)}
                                            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 800, bgcolor: 'var(--res-navy)' }}
                                        >
                                            {res.type === 'article' ? 'Read Article' : `View ${res.type}`}
                                        </Button>
                                        
                                        {isAdmin && (
                                            <Box className="admin-actions-box">
                                                <IconButton 
                                                    size="small" 
                                                    className="btn-icon-action edit"
                                                    onClick={() => handleEditClick(res._id)} 
                                                    sx={{ color: '#3b82f6' }}
                                                >
                                                    <EditRoundedIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    className="btn-icon-action delete"
                                                    onClick={() => { setDeleteTargetId(res._id); setDeleteConfirmOpen(true); }} 
                                                    sx={{ color: '#ef4444' }}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Box>

            {/* ADMIN ADD BUTTON */}
            {isAdmin && (
                <Portal>
                    <Fab 
                        color="primary" 
                        className="admin-fab"
                        sx={{ position: 'fixed', bottom: 40, right: 40, zIndex: 9999 }} 
                        onClick={handleAddClick}
                    >
                        <AddIcon />
                    </Fab>
                </Portal>
            )}

            {/* --- CONTENT VIEWER MODAL (Video/PDF) --- */}
            <Dialog 
                open={viewerOpen} 
                onClose={() => setViewerOpen(false)}
                fullWidth maxWidth="md"
                PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', bgcolor: '#000' } }}
            >
                <Box position="relative" width="100%" height={selectedRes?.type === 'pdf' ? "80vh" : "auto"}>
                    
                    {/* Close Button Overlay */}
                    <IconButton 
                        onClick={() => setViewerOpen(false)} 
                        sx={{ position: 'absolute', top: 10, right: 10, color: 'white', zIndex: 10, bgcolor: 'rgba(0,0,0,0.5)' }}
                    >
                        <CloseRoundedIcon />
                    </IconButton>

                    {selectedRes?.type === 'video' && (
                        <video 
                            controls 
                            autoPlay 
                            src={getFileUrl(selectedRes.contentUrl)} 
                            style={{ width: '100%', display: 'block', maxHeight: '80vh' }}
                        />
                    )}

                    {selectedRes?.type === 'pdf' && (
                        <iframe 
                            src={getFileUrl(selectedRes.contentUrl)} 
                            width="100%" 
                            height="100%" 
                            title="PDF Viewer"
                            style={{ border: 'none' }}
                        />
                    )}

                </Box>
                {/* Title Bar */}
                <Box p={2} bgcolor="#1e293b" color="white">
                    <Typography variant="h6">{selectedRes?.title}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>{selectedRes?.description}</Typography>
                </Box>
            </Dialog>

            {/* DELETE MODAL */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <Box textAlign="center" pt={3}><WarningAmberRoundedIcon sx={{ fontSize: 60, color: '#ef4444' }} /></Box>
                <DialogTitle textAlign="center" fontWeight="900">Confirm Deletion</DialogTitle>
                <DialogContent><Typography textAlign="center" color="textSecondary">This content will be removed permanently.</Typography></DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 4 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} sx={{ fontWeight: 800, borderRadius: '10px' }}>Delete Resource</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Resources;