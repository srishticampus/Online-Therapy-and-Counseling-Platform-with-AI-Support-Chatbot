import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';

// Import CSS
import '../../styles/LandingPage.css'; // Make sure this path matches where you saved the CSS above

// Import Images
import consilling from '../../assets/consilling.jpg';
import humanemotions from '../../assets/humanemotions.jpg';
import tension from '../../assets/tension.jpg';
import main from '../../assets/main.jpg';

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

function LandingPage() {
  const navigate = useNavigate();
  // We use a ref to scope GSAP selectors to this component only
  const componentRef = useRef(null);

  useEffect(() => {
    // GSAP Context is crucial for React Strict Mode compatibility
    let ctx = gsap.context(() => {
      
      // 1. Hero Animation Timeline
      const tl = gsap.timeline();
      
      tl.from(".landing-hero-content h1, .landing-hero-content p, .landing-hero-content button", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        clearProps: "all" // Ensures styles are removed after animation so they remain visible
      })
      .from(".landing-hero-img", {
        x: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        clearProps: "all"
      }, "-=0.6");

      // 2. Scroll Trigger Animations for Zig-Zag Sections
      const sections = document.querySelectorAll('.landing-section');
      
      sections.forEach((section) => {
        // We look for specific classes inside the current section
        const imgWrapper = section.querySelector('.landing-section-image-wrapper');
        const content = section.querySelector('.landing-section-content');

        if(imgWrapper && content) {
          // Animate Image
          gsap.from(imgWrapper, {
            scrollTrigger: {
              trigger: section,
              start: "top 85%", // Triggers slightly earlier to ensure visibility
              toggleActions: "play none none reverse",
            },
            x: -50,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out"
          });

          // Animate Text
          gsap.from(content, {
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
            },
            x: 50,
            opacity: 0,
            duration: 0.8,
            delay: 0.2, 
            ease: "power2.out"
          });
        }
      });

    }, componentRef); // Scoped to this component

    // Cleanup function when component unmounts
    return () => ctx.revert();

  }, []);

  return (
    <div className="landing-page-container" ref={componentRef}>
      
      {/* --- HERO SECTION --- */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-title">Your Mental Health Matters, Anytime, Anywhere.</h1>
          <p className="landing-subtitle">
            Connect with licensed therapists, track your mood, and chat with our 
            AI companion 24/7. A safe space for your journey to wellness.
          </p>
          <button className="landing-cta-btn" onClick={() => navigate('/login')}>
            Get Started Today
          </button>
        </div>
        <div className="landing-hero-image-wrapper">
          <img src={main} alt="Mental Health Support" className="landing-hero-img" />
        </div>
      </section>

      {/* --- ZIG ZAG SECTION 1 --- */}
      <section className="landing-section">
        <div className="landing-section-image-wrapper">
          <img src={tension} alt="Stress and Anxiety" className="landing-section-img" />
        </div>
        <div className="landing-section-content">
          <h2 className="landing-section-title">Overwhelmed by Stress?</h2>
          <p className="landing-section-desc">
            Life can be heavy. Whether it's work pressure, anxiety, or personal 
            struggles, carrying the weight alone leads to burnout. Identifying 
            tension is the first step toward healing. Our platform helps you 
            monitor these signs before they escalate.
          </p>
        </div>
      </section>

      {/* --- ZIG ZAG SECTION 2 (Reversed by CSS) --- */}
      <section className="landing-section">
        <div className="landing-section-image-wrapper">
          <img src={humanemotions} alt="AI Emotional Support" className="landing-section-img" />
        </div>
        <div className="landing-section-content">
          <h2 className="landing-section-title">24/7 AI Emotional Support</h2>
          <p className="landing-section-desc">
            Need someone to talk to at 3 AM? Our advanced AI Chatbot is trained 
            to listen with empathy, provide coping strategies, and guide you 
            through breathing exercises. It understands human emotions and is 
            always there when you need a listening ear.
          </p>
        </div>
      </section>

      {/* --- ZIG ZAG SECTION 3 --- */}
      <section className="landing-section">
        <div className="landing-section-image-wrapper">
          <img src={consilling} alt="Professional Counseling" className="landing-section-img" />
        </div>
        <div className="landing-section-content">
          <h2 className="landing-section-title">Licensed Professional Therapy</h2>
          <p className="landing-section-desc">
            Sometimes, you need human expertise. Connect with certified 
            therapists via secure video calls. Book appointments, share your 
            progress, and work through deep-rooted issues in a confidential, 
            professional environment tailored to your needs.
          </p>
        </div>
      </section>

    </div>
  );
}

export default LandingPage;