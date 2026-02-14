import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import api from '../../services/api'; // Import your Axios instance
import toast from 'react-hot-toast'; // Import Toast
import { CircularProgress } from '@mui/material';
import '../../styles/ContactUs.css'; 

// Material UI Icons
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

gsap.registerPlugin(ScrollTrigger);

function ContactUs() {
  const containerRef = useRef(null);
  
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '', // Maps to "Department" in UI
    message: ''
  });

  // --- GSAP ANIMATIONS ---
  // useEffect(() => {
  //   let ctx = gsap.context(() => {
  //     const tl = gsap.timeline();
  //     tl.from(".contact-reveal", {
  //       y: 30,
  //       opacity: 0,
  //       duration: 0.8,
  //       stagger: 0.2,
  //       ease: "power3.out"
  //     });

  //     gsap.from(".contact-card", {
  //       scrollTrigger: {
  //         trigger: ".contact-info-section",
  //         start: "top 80%"
  //       },
  //       y: 40,
  //       opacity: 0,
  //       duration: 0.6,
  //       stagger: 0.1,
  //       ease: "power2.out"
  //     });

  //     gsap.from(".contact-main-wrapper", {
  //       scrollTrigger: {
  //         trigger: ".contact-form-section",
  //         start: "top 75%"
  //       },
  //       y: 30,
  //       opacity: 0,
  //       duration: 0.8,
  //       ease: "power2.out"
  //     });

  //   }, containerRef);

  //   return () => ctx.revert();
  // }, []);

  // --- HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Sending your message...");

    try {
      // Endpoint matches router: app.use('/api/contact', contactRoutes) -> POST /
      const res = await api.post('/contact', formData);

      if (res.data.success) {
        toast.success("Message sent successfully!", { id: toastId });
        // Reset Form
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to send message.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-viewport" ref={containerRef}>
      
      {/* --- HERO SECTION --- */ }
      <header className="contact-header">
        <div className="contact-max-width">
          <div className="contact-header-content">
            <span className="contact-tag contact-reveal">Get in Touch</span>
            <h1 className="contact-title contact-reveal">Let's start a conversation</h1>
            <p className="contact-subtitle contact-reveal">
              Our team is here to support your mental health journey. Reach out 
              via any of these channels or fill out the secure form below.
            </p>
          </div>
        </div>
      </header>

      {/* --- INFO CARDS --- */}
      <section className="contact-info-section">
        <div className="contact-max-width">
          <div className="contact-cards-grid">
            <div className="contact-card">
              <div className="contact-icon-circle"><EmailOutlinedIcon /></div>
              <h3 className="contact-card-title">Email Us</h3>
              <p className="contact-card-text">support@mindheal.com</p>
              <p className="contact-card-text">hello@mindheal.com</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon-circle"><LocalPhoneOutlinedIcon /></div>
              <h3 className="contact-card-title">Call Us</h3>
              <p className="contact-card-text">Main: +1 (800) 123-4567</p>
              <p className="contact-card-text">Emergency: 988 (Mental Health)</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon-circle"><LocationOnOutlinedIcon /></div>
              <h3 className="contact-card-title">Visit Us</h3>
              <p className="contact-card-text">123 Wellness Avenue</p>
              <p className="contact-card-text">New York, NY 10001</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FORM SECTION --- */}
      <section className="contact-form-section">
        <div className="contact-max-width">
          <div className="contact-main-wrapper">
            
            {/* Left Panel */}
            <aside className="contact-aside">
              <div className="contact-aside-content">
                <h2 className="contact-aside-title">Secure Inquiry</h2>
                <p className="contact-aside-text">
                  Have a specific question? Our specialized support agents 
                  usually respond within 2-4 business hours.
                </p>
                
                <div className="contact-features-list">
                    <div className="contact-feature-item">
                        <span className="contact-feature-dot"></span>
                        <span>24/7 Technical Monitoring</span>
                    </div>
                    <div className="contact-feature-item">
                        <span className="contact-feature-dot"></span>
                        <span>Expert Clinical Support</span>
                    </div>
                    <div className="contact-feature-item">
                        <span className="contact-feature-dot"></span>
                        <span>Private & Encrypted Data</span>
                    </div>
                </div>
              </div>
            </aside>

            {/* Right Form */}
            <main className="contact-form-area">
              <form onSubmit={handleSubmit} className="contact-actual-form">
                <div className="contact-form-row">
                  <div className="contact-input-group">
                    <label className="contact-form-label">Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      className="contact-form-input" 
                      placeholder="John Doe" 
                      required 
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="contact-input-group">
                    <label className="contact-form-label">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      className="contact-form-input" 
                      placeholder="john@company.com" 
                      required 
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="contact-input-group">
                  <label className="contact-form-label">Department</label>
                  <select 
                    name="subject"
                    className="contact-form-input" 
                    required
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select a topic</option>
                    <option value="Billing Inquiry">Billing Inquiry</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Counseling Support">Counseling Support</option>
                    <option value="General Inquiry">Other</option>
                  </select>
                </div>

                <div className="contact-input-group">
                  <label className="contact-form-label">Message</label>
                  <textarea 
                    name="message"
                    className="contact-form-textarea" 
                    placeholder="How can we help you today?" 
                    required
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button type="submit" className="contact-submit-button" disabled={loading}>
                  {loading ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>Send Secure Message</span>
                      <SendRoundedIcon sx={{ fontSize: 18 }} />
                    </>
                  )}
                </button>
              </form>
            </main>

          </div>
        </div>
      </section>

    </div>
  );
}

export default ContactUs;