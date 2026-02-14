import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Avatar, IconButton, CircularProgress, Badge, Tooltip, Zoom } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/AIChat.css';

const Aichat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [hearts, setHearts] = useState([]);

    const scrollRef = useRef(null);
    const containerRef = useRef(null);

    // Get current user details for the Avatar
    const user = JSON.parse(localStorage.getItem('user')) || { role: 'user', name: 'Guest' };

    // --- INITIAL LOAD: FETCH HISTORY ---
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/ai/history');
                if (res.data.success) {
                    setMessages(res.data.data);
                }
            } catch (err) {
                console.error("No conversation history found.");
            }
        };
        fetchHistory();
    }, []);

    // --- AUTO SCROLL TO BOTTOM ---
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, loading, suggestions]); // Scroll when suggestions appear too

    // --- GSAP ANIMATION FOR MESSAGES ---
    useEffect(() => {
        if (messages.length > 0) {
            gsap.fromTo(".aichat-row:last-child", 
                { opacity: 0, y: 10 }, 
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
            );
        }
    }, [messages]);

    // --- HANDLER: SEND MESSAGE ---
    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { sender: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        const textToSend = input;
        setInput("");
        setLoading(true);
        setSuggestions([]); // Clear old suggestions while loading

        try {
            const res = await api.post('/ai/chat', { message: textToSend });
            if (res.data.success) {
                setMessages(prev => [...prev, {
                    sender: 'ai',
                    content: res.data.reply,
                    timestamp: new Date()
                }]);
                
                // Set suggested items from backend
                setSuggestions(res.data.suggestedItems || []);

                // Toast if sentiment is negative
                if (res.data.sentiment?.score < -0.3) {
                    toast("Take a deep breath. MindHeal is here for you.", { icon: '🧘' });
                }
            }
        } catch (err) {
            toast.error("AI node is momentarily busy. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLER: CLEAR CONVERSATION ---
    const handleClear = async () => {
        if (!window.confirm("This will permanently delete your chat history with MindHeal AI. Proceed?")) return;
        try {
            await api.delete('/ai/history');
            setMessages([]);
            setSuggestions([]);
            toast.success("History Cleared");
        } catch (err) {
            toast.error("Action failed");
        }
    };

    // --- RELAXATION INTERACTION (HEARTS) ---
    const handleRelax = (e) => {
        const id = Date.now();
        setHearts(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
        setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 1500);
    };

    // Helper to get correct URL for local/remote images
    const getThumbnailUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/150';
        return url.startsWith('http') ? url : `http://localhost:5000/${url.replace(/\\/g, '/')}`;
    };

    return (
        <div className="aichat-modern-viewport" ref={containerRef} onClick={handleRelax}>

            {/* BACKGROUND ANIMATED HEARTS */}
            {hearts.map(h => (
                <FavoriteRoundedIcon
                    key={h.id}
                    className="relax-heart"
                    style={{ left: h.x - 15, top: h.y - 15 }}
                />
            ))}

            <div className="aichat-hub" onClick={(e) => e.stopPropagation()}>

                {/* --- HEADER --- */}
                <Box display="flex" justifyContent="space-between" alignItems="center" p={3}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Badge variant="dot" color="success" overlap="circular">
                            <Avatar sx={{ bgcolor: 'var(--ai-navy)' }}>
                                <AutoAwesomeRoundedIcon />
                            </Avatar>
                        </Badge>
                        <Box>
                            <Typography variant="h6" fontWeight="900" sx={{ color: 'var(--ai-navy)', lineHeight: 1.2 }}>
                                MindHeal AI
                            </Typography>
                            <Typography variant="caption" color="textSecondary" fontWeight="600">
                                24/7 Empathetic Support
                            </Typography>
                        </Box>
                    </Box>
                    <Tooltip title="Clear Conversation">
                        <IconButton onClick={handleClear} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}>
                            <DeleteOutlineRoundedIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* --- CHAT AREA --- */}
                <div className="aichat-content-area" ref={scrollRef}>
                    {messages.length === 0 && !loading && (
                        <Box textAlign="center" mt={10}>
                            <PsychologyRoundedIcon sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                            <Typography variant="h5" fontWeight="800" color="#94a3b8">How can I support you?</Typography>
                            <Typography variant="body2" color="#cbd5e1">I am a judgment-free space to share your thoughts.</Typography>
                        </Box>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`aichat-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}>
                            <Avatar
                                src={msg.sender === 'user' && user.profileImage 
                                    ? `http://localhost:5000/${user.profileImage.replace(/\\/g, '/')}` 
                                    : undefined
                                }
                                sx={{
                                    width: 34, height: 34,
                                    bgcolor: msg.sender === 'user' ? '#3b82f6' : 'var(--ai-navy)',
                                    fontSize: '0.8rem',
                                    border: '1px solid #e2e8f0'
                                }}>
                                {msg.sender === 'user' 
                                    ? user.name.charAt(0) 
                                    : <AutoAwesomeRoundedIcon sx={{ fontSize: 16, color: 'white' }} />
                                }
                            </Avatar>
                            
                            <div className={`aichat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {/* AI TYING STATE */}
                    {loading && (
                        <div className="aichat-row ai-row">
                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'var(--ai-navy)' }}>
                                <AutoAwesomeRoundedIcon sx={{ fontSize: 16, color: 'white' }} />
                            </Avatar>
                            <Box display="flex" alignItems="center" gap={1} p={2}>
                                <CircularProgress size={14} thickness={6} />
                                <Typography variant="caption" color="textSecondary" fontWeight="800">
                                    MindHeal is reflecting...
                                </Typography>
                            </Box>
                        </div>
                    )}

                    {/* DYNAMIC SUGGESTIONS (THUMBNAIL CARDS) */}
                   {/* DYNAMIC SUGGESTIONS */}
{suggestions.length > 0 && !loading && (
    <Zoom in={true}>
        <div className="ai-insights-box">
            <Typography variant="overline" fontWeight="900" color="primary" sx={{ letterSpacing: 1.2, display:'block', mb:1.5, ml: 0.5 }}>
                <AutoAwesomeRoundedIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 1, mb: 0.3 }} />
                Recommended For You
            </Typography>
            
            <div className="insight-grid">
                {suggestions.map((item, idx) => (
                    <div key={idx} className="insight-card" onClick={() => window.open(item.contentUrl, '_blank')}>
                        
                        {/* Thumbnail with Hover Effect */}
                        <div className="insight-thumb-wrapper">
                            <img 
                                src={getThumbnailUrl(item.thumbnail)} 
                                alt={item.title} 
                                className="insight-thumb-img"
                                onError={(e) => e.target.src = 'https://via.placeholder.com/200x110?text=Resource'}
                            />
                            <div className="insight-play-icon">
                                {item.type === 'video' ? <PlayCircleOutlineIcon /> : <DescriptionIcon />}
                            </div>
                        </div>
                        
                        {/* Card Info */}
                        <div className="insight-info">
                            <Typography className="insight-title" title={item.title}>
                                {item.title}
                            </Typography>
                            
                            <div className="insight-meta">
                                {item.type === 'video' ? (
                                    <PlayCircleOutlineIcon sx={{ fontSize: 14, color: '#3b82f6' }} />
                                ) : (
                                    <HistoryEduRoundedIcon sx={{ fontSize: 14, color: '#10b981' }} />
                                )}
                                <Typography className="insight-type-badge">
                                    {item.type}
                                </Typography>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </Zoom>
)}
                </div>

                {/* --- FOOTER INPUT --- */}
                <div className="aichat-footer">
                    <form className="aichat-input-wrapper" onSubmit={handleSend}>
                        <input
                            className="aichat-field"
                            placeholder="Share your feelings here..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <IconButton 
                            type="submit" 
                            className="aichat-send-btn" 
                            disabled={!input.trim() || loading}
                        >
                            <SendRoundedIcon />
                        </IconButton>
                    </form>
                    <Typography variant="caption" display="block" textAlign="center" mt={2} color="#94a3b8" sx={{ fontSize: '0.7rem' }}>
                        I am an AI companion, not a doctor. For clinical emergencies, speak with your <strong>Assigned Counselor</strong>.
                    </Typography>
                </div>

            </div>
        </div>
    );
};

export default Aichat;