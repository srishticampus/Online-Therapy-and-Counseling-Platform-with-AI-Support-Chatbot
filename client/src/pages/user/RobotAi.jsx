import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, CircularProgress, Tooltip, Zoom, Fab, Paper, Fade, Menu, MenuItem } from '@mui/material';
import Spline from '@splinetool/react-spline';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import PsychologyIcon from '@mui/icons-material/Psychology';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import LanguageIcon from '@mui/icons-material/Language';
import api from '../../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const LANGUAGES = [
    { label: 'English', code: 'en-US', flag: '🇺🇸' },
    { label: 'Malayalam', code: 'ml-IN', flag: '🇮🇳' },
    { label: 'Tamil', code: 'ta-IN', flag: '🇮🇳' },
    { label: 'Hindi', code: 'hi-IN', flag: '🇮🇳' },
    { label: 'Telugu', code: 'te-IN', flag: '🇮🇳' }
];

const RobotAi = () => {
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [aiReply, setAiReply] = useState("");
    const [splineLoading, setSplineLoading] = useState(true);
    const [splineError, setSplineError] = useState(false);
    const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
    const [anchorEl, setAnchorEl] = useState(null);

    const recognitionRef = useRef(null);
    const synth = window.speechSynthesis;
    const containerRef = useRef(null);

    useEffect(() => {
        if (!splineLoading) {
            gsap.from(".ui-fade-in", {
                y: 30,
                opacity: 0,
                stagger: 0.15,
                duration: 1,
                ease: "power4.out"
            });
        }
    }, [splineLoading]);

    // Initialize/Update Speech Recognition when language changes
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = selectedLang.code;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                handleVoiceCommand(transcript);
            };

            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onerror = (event) => {
                setIsListening(false);
                if (event.error === 'no-speech') {
                    toast.error("I didn't hear anything. Try again?");
                } else {
                    toast.error("Catching that was hard. Try again?");
                }
            };
        }
    }, [selectedLang]);

    // Ensure voices are loaded for multi-language TTS
    useEffect(() => {
        const loadVoices = () => {
            synth.getVoices();
        };
        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
    }, [synth]);

    const speak = (text) => {
        if (isMuted || !text || !window.speechSynthesis) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = selectedLang.code;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error('SpeechSynthesis error:', event);
            setIsSpeaking(false);
        };

        const voices = window.speechSynthesis.getVoices();

        if (voices.length > 0) {
            // 1. Preferred Online/Natural voices for exact lang
            let voice = voices.find(v => v.lang === selectedLang.code &&
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Online')));

            // 2. Exact lang code match
            if (!voice) voice = voices.find(v => v.lang === selectedLang.code);

            // 3. Name-based search (Crucial for Malayalam fallback)
            if (!voice) {
                const searchLabel = selectedLang.label.toLowerCase();
                voice = voices.find(v => v.name.toLowerCase().includes(searchLabel));
            }

            // 4. Lang prefix match (e.g., 'ml')
            if (!voice) {
                const langPrefix = selectedLang.code.split('-')[0];
                voice = voices.find(v => v.lang.startsWith(langPrefix));
            }

            if (voice) {
                utterance.voice = voice;
            } else if (selectedLang.code.startsWith('ml')) {
                // Specific toast for Malayalam if no voice is found
                toast.error("Malayalam voice not found on this device. Try using Microsoft Edge or installing a language pack.");
            }
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 150);
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setAiReply("");
            recognitionRef.current.start();
            setIsListening(true);
            if (synth.speaking) synth.cancel();
        }
    };

    const handleVoiceCommand = async (transcript) => {
        if (!transcript.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/ai/chat', {
                message: transcript,
                language: selectedLang.label // Pass selected language to AI
            });
            if (res.data.success) {
                setAiReply(res.data.reply);
                speak(res.data.reply);
            }
        } catch (err) {
            toast.error("Neural link failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleLangClick = (event) => setAnchorEl(event.currentTarget);
    const handleLangClose = (lang) => {
        if (lang) setSelectedLang(lang);
        setAnchorEl(null);
    };

    return (
        <Box ref={containerRef} sx={{
            width: '100%', height: 'calc(100vh - 80px)',
            bgcolor: '#05050599', position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Orbitron', sans-serif",
            height: '100vh',
            overflowY: 'hidden',
        }}>

            {/* AMBIENT GLOWS */}
            <Box sx={{
                position: 'absolute', top: '10%', left: '5%', width: '30vw', height: '30vw',
                background: 'radial-gradient(circle, rgba(0, 242, 255, 0.03) 0%, transparent 70%)',
                filter: 'blur(80px)', zIndex: 0
            }} />
            <Box sx={{
                position: 'absolute', bottom: '10%', right: '5%', width: '40vw', height: '40vw',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.02) 0%, transparent 70%)',
                filter: 'blur(100px)', zIndex: 0
            }} />

            {/* HEADER UI */}
            <Box className="ui-fade-in" sx={{
                position: 'absolute', top: 30, left: 30, right: 30, zIndex: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Box sx={{
                        width: 50, height: 50, borderRadius: '15px',
                        bgcolor: 'rgba(0, 242, 255, 0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(0, 242, 255, 0.2)',
                        boxShadow: '0 0 30px rgba(0, 242, 255, 0.1)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <PsychologyIcon sx={{ color: '#00f2ff', fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ color: '#fff', fontWeight: 900, letterSpacing: 3, fontSize: '1rem', textShadow: '0 0 10px rgba(0,242,255,0.3)' }}>
                            CYBER-MIND ELITE
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 8, height: 8, borderRadius: '50%',
                                bgcolor: '#00f2ff', boxShadow: '0 0 10px #00f2ff',
                                animation: 'pulse-glow 2s infinite'
                            }} />
                            <Typography sx={{ color: 'rgba(0, 242, 255, 0.7)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: 1.5 }}>
                                {selectedLang.label.toUpperCase()} MODE
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box display="flex" gap={2}>
                    <Tooltip title="Language Settings">
                        <IconButton
                            onClick={handleLangClick}
                            sx={{
                                color: '#00f2ff',
                                bgcolor: 'rgba(0, 242, 255, 0.05)',
                                border: '1px solid rgba(0, 242, 255, 0.2)',
                                transition: 'all 0.3s ease',
                                '&:hover': { bgcolor: 'rgba(0, 242, 255, 0.15)', transform: 'translateY(-2px)' }
                            }}
                        >
                            <LanguageIcon />
                        </IconButton>
                    </Tooltip>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => handleLangClose()}
                        PaperProps={{
                            sx: {
                                bgcolor: 'rgba(10, 10, 10, 0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(0, 242, 255, 0.2)',
                                color: '#fff',
                                mt: 1.5,
                                '& .MuiMenuItem-root:hover': { bgcolor: 'rgba(0, 242, 255, 0.1)' }
                            }
                        }}
                    >
                        {LANGUAGES.map((lang) => (
                            <MenuItem key={lang.code} onClick={() => handleLangClose(lang)} sx={{ gap: 2, py: 1.5, px: 3 }}>
                                <Typography fontSize="1.2rem">{lang.flag}</Typography>
                                <Typography fontWeight={600} fontSize="0.9rem">{lang.label}</Typography>
                            </MenuItem>
                        ))}
                    </Menu>

                    <IconButton
                        onClick={() => setIsMuted(!isMuted)}
                        sx={{
                            color: isMuted ? '#ff0055' : '#00f2ff',
                            bgcolor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                        }}
                    >
                        {isMuted ? <VolumeOffRoundedIcon /> : <VolumeUpRoundedIcon />}
                    </IconButton>
                </Box>
            </Box>

            {/* ROBOT VIEWPORT */}
            <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
                {(splineLoading && !splineError) && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, zIndex: 2 }}>
                        <CircularProgress size={40} thickness={3} sx={{ color: '#00f2ff' }} />
                        <Typography sx={{ color: '#00f2ff', letterSpacing: 5, fontSize: '0.7rem', fontWeight: 900 }}>INITIALIZING CORE...</Typography>
                    </Box>
                )}

                {splineError && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                        <Typography sx={{ color: '#ff0055', fontWeight: 900 }}>NEURAL SCENE OFFLINE</Typography>
                    </Box>
                )}

                <Fade in={!splineLoading} timeout={1500}>
                    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                        <Spline
                            scene="https://prod.spline.design/LTI01XzKZPFnvGco/scene.splinecode"
                            onLoad={() => setSplineLoading(false)}
                            onError={() => {
                                setSplineError(true);
                                setSplineLoading(false);
                            }}
                        />
                    </Box>
                </Fade>

                {/* AI REPLY CAPTION - Updated to Dark Text on Light Background */}
                {aiReply && !isListening && (
                    <Zoom in={true}>
                        <Paper elevation={0} sx={{
                            position: 'absolute', bottom: '28%', left: '40%', transform: 'translateX(-50%)',
                            p: 3, width: '85%', maxWidth: '650px', borderRadius: '24px',
                            bgcolor: 'rgba(255, 255, 255, 0.95)', // White Background
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0, 242, 255, 0.3)', textAlign: 'center',
                            zIndex: 5, boxShadow: '0 15px 40px rgba(0,0,0,0.4)'
                        }}>
                            <Typography sx={{ color: '#1e293b', fontSize: '1.2rem', lineHeight: 1.6, fontWeight: 700 }}>
                                {aiReply}
                            </Typography>
                        </Paper>
                    </Zoom>
                )}
            </Box>

            {/* CONTROLS AREA */}
            <Box sx={{
                position: 'absolute', bottom: 60, left: 0, right: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10
            }}>
                <Box className="ui-fade-in" sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography sx={{
                        color: isListening ? '#00f2ff' : 'rgba(255,255,255,0.4)',
                        fontWeight: 900, fontSize: '0.8rem', letterSpacing: 5,
                        transition: 'all 0.4s ease'
                    }}>
                        {isListening ? "TRANSMITTING..." : loading ? "CORE DECODING..." : "NEURAL INTERFACE"}
                    </Typography>
                </Box>

                <Box sx={{ position: 'relative' }}>
                    {(isListening || isSpeaking || loading) && (
                        <Box sx={{
                            position: 'absolute', inset: -15, borderRadius: '50%',
                            border: '2px solid #2563eb',
                            animation: 'wave-ripple 2s infinite linear'
                        }} />
                    )}

                    <Fab
                        onClick={toggleListening}
                        disabled={loading}
                        sx={{
                            width: 90, height: 90,
                            bgcolor: isListening ? '#ff0055' : '#2563eb', // Updated to Professional Deep Blue
                            color: '#fff',
                            boxShadow: isListening ? '0 0 50px #ff0055' : '0 0 40px rgba(37, 99, 235, 0.5)',
                            transition: 'all 0.4s ease',
                            '&:hover': { transform: 'scale(1.1)', bgcolor: isListening ? '#ff0055' : '#1d4ed8' },
                            '&.Mui-disabled': { bgcolor: '#222', color: '#444' }
                        }}
                    >
                        {loading ? <CircularProgress size={30} sx={{ color: '#fff' }} /> :
                            isListening ? <StopRoundedIcon sx={{ fontSize: 40 }} /> :
                                <MicRoundedIcon sx={{ fontSize: 40 }} />}
                    </Fab>

                    {isSpeaking && (
                        <Box sx={{ position: 'absolute', right: -65, top: '50%', transform: 'translateY(-50%)' }}>
                            <GraphicEqIcon sx={{ color: '#2563eb', fontSize: 35, animation: 'bounce-eq 1s infinite' }} />
                        </Box>
                    )}
                </Box>
            </Box>

            <style>{`
                @keyframes wave-ripple {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                @keyframes pulse-glow {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes bounce-eq {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(1.5); }
                }
                canvas { outline: none !important; }
                .spline-watermark { display: none !important; }
            `}</style>
        </Box>
    );
};

export default RobotAi;