import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Divider } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../../services/api'; // Your axios instance
import toast from 'react-hot-toast';
import gsap from 'gsap';
import '../../styles/MoodTracker.css';

// Icons
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import BoltIcon from '@mui/icons-material/Bolt';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddTaskIcon from '@mui/icons-material/AddTask';

// Register ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Configuration for Moods
const MOOD_OPTIONS = [
  { label: "Awful", score: 1, emoji: "😫", color: "#ef4444" },
  { label: "Bad", score: 2, emoji: "😔", color: "#f97316" },
  { label: "Okay", score: 3, emoji: "😐", color: "#eab308" },
  { label: "Good", score: 4, emoji: "🙂", color: "#22c55e" },
  { label: "Great", score: 5, emoji: "🤩", color: "#3b82f6" },
];

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [energy, setEnergy] = useState(5);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const pageRef = useRef(null);

  // --- FETCH DATA ---
  const fetchMoodData = async () => {
    try {
      const res = await api.get('/mood/history');
      if (res.data.success) setLogs(res.data.data);
    } catch (err) {
      console.error("Failed to load mood history");
    }
  };

  useEffect(() => {
    fetchMoodData();
    // GSAP Entrance
    gsap.fromTo(".mood-card-anim", 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" }
    );
  }, []);

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) return toast.error("Please select a mood emoji.");

    setLoading(true);
    const tid = toast.loading("Saving entry...");

    try {
      const res = await api.post('/mood/add', {
        mood: selectedMood.label,
        score: selectedMood.score,
        energyLevel: energy,
        note
      });

      if (res.data.success) {
        toast.success("Mood Logged!", { id: tid });
        setSelectedMood(null);
        setEnergy(5);
        setNote("");
        fetchMoodData(); // Refresh chart
      }
    } catch (err) {
      toast.error("Failed to save.", { id: tid });
    } finally {
      setLoading(false);
    }
  };

  // --- CHART CONFIG ---
  const chartData = {
    labels: logs.map(l => new Date(l.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Mood Score',
        data: logs.map(l => l.score),
        borderColor: '#3b82f6',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
          return gradient;
        },
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#0f172a',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3b82f6'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 13 },
        padding: 10,
        callbacks: {
          label: (ctx) => {
             const score = ctx.raw;
             const m = MOOD_OPTIONS.find(opt => opt.score === score);
             return ` ${m?.emoji} ${m?.label}`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0, max: 6,
        grid: { display: true, color: '#f1f5f9' },
        ticks: { 
            stepSize: 1, 
            callback: (val) => MOOD_OPTIONS.find(m => m.score === val)?.emoji || '' 
        }
      },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="mood-page-wrapper" ref={pageRef}>
      <div className="mood-container">
        
        {/* Header */}
        <div className="mood-header">
            <div>
                <h1 className="mood-title">Mood Tracker</h1>
                <Typography color="textSecondary">Monitor your emotional well-being over time.</Typography>
            </div>
            <Button variant="outlined" sx={{color: '#3b82f6', borderColor: '#e2e8f0'}} onClick={fetchMoodData}>
                Refresh Data
            </Button>
        </div>

        <div className="mood-dashboard-grid">
            
            {/* --- LEFT: LOGGING FORM --- */}
            <div className="mood-card mood-card-anim">
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <FaceRetouchingNaturalIcon color="primary" />
                    <Typography variant="h6" fontWeight="700">How are you feeling?</Typography>
                </Box>

                <div className="mood-selection-grid">
                    {MOOD_OPTIONS.map((opt) => (
                        <div 
                            key={opt.label}
                            className={`mood-option-btn ${selectedMood?.label === opt.label ? 'active' : ''}`}
                            onClick={() => setSelectedMood(opt)}
                        >
                            <span className="mood-emoji">{opt.emoji}</span>
                            <span className="mood-label">{opt.label}</span>
                        </div>
                    ))}
                </div>

                <div className="mood-input-group">
                    <label className="mood-input-label">
                        <BoltIcon sx={{fontSize: 16, verticalAlign: 'text-top', mr: 0.5}}/> Energy Level ({energy}/10)
                    </label>
                    <input 
                        type="range" min="1" max="10" 
                        value={energy} 
                        className="mood-slider"
                        onChange={(e) => setEnergy(parseInt(e.target.value))}
                    />
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="textSecondary">Low</Typography>
                        <Typography variant="caption" color="textSecondary">High</Typography>
                    </Box>
                </div>

                <div className="mood-input-group">
                    <label className="mood-input-label">
                        <NoteAltIcon sx={{fontSize: 16, verticalAlign: 'text-top', mr: 0.5}}/> Journal Note
                    </label>
                    <textarea 
                        className="mood-textarea" 
                        rows="3" 
                        placeholder="What's on your mind? (Optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                <Button 
                    className="btn-submit-mood" 
                    onClick={handleSubmit} 
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddTaskIcon />}
                >
                    {loading ? "Saving Entry..." : "Log Mood"}
                </Button>
            </div>

            {/* --- RIGHT: ANALYTICS & HISTORY --- */}
            <div className="mood-card mood-card-anim">
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <TimelineIcon color="primary" />
                    <Typography variant="h6" fontWeight="700">Emotional Trend</Typography>
                </Box>

                <div className="chart-wrapper">
                    {logs.length > 1 ? (
                        <Line data={chartData} options={chartOptions} />
                    ) : (
                        <Box height="100%" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bgcolor="#f8fafc" borderRadius="12px">
                            <Typography color="textSecondary" fontWeight="600">Not enough data</Typography>
                            <Typography variant="caption" color="textSecondary">Log at least 2 entries to see the chart.</Typography>
                        </Box>
                    )}
                </div>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" fontWeight="800" color="textSecondary" textTransform="uppercase">
                    Recent Entries
                </Typography>

                <div className="recent-history-list">
                    {logs.slice().reverse().slice(0, 3).map((log) => {
                        const m = MOOD_OPTIONS.find(opt => opt.score === log.score);
                        return (
                            <div key={log._id} className="history-item" style={{ borderLeftColor: m?.color }}>
                                <span style={{ fontSize: '1.5rem' }}>{m?.emoji}</span>
                                <Box flexGrow={1}>
                                    <Typography variant="subtitle2" fontWeight="700">{log.mood}</Typography>
                                    <Typography variant="caption" color="textSecondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {log.note || "No notes provided."}
                                    </Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Typography variant="caption" display="block" fontWeight="700" color="textSecondary">
                                        {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {new Date(log.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                            </div>
                        );
                    })}
                    {logs.length === 0 && <Typography variant="body2" color="textSecondary" align="center">No history available.</Typography>}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default MoodTracker;