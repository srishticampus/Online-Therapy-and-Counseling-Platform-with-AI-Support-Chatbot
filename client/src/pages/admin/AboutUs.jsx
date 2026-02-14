import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../../styles/AboutUs.css'; 

// Import Images
import emotionalSupport from "../../assets/emotionalSupport.jpg";
import FeelGood from "../../assets/FeelGood.jpg";
import happyface from "../../assets/happyface.jpg";

// Register Plugin
gsap.registerPlugin(ScrollTrigger);

function AboutUs() {
  const compRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      
      // 1. Hero Animation (Slightly slower, more elegant)
      const tl = gsap.timeline();
      tl.from(".about-hero-title", {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out"
      })
      .from(".about-hero-subtitle", {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      }, "-=0.8");

      // 2. Section Animations
      const sections = gsap.utils.toArray('.about-section');

      sections.forEach((section) => {
        const imgWrapper = section.querySelector('.about-image-wrapper');
        const content = section.querySelector('.about-content');

        // Image Parallax Reveal
        gsap.from(imgWrapper, {
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play none none reverse"
          },
          y: 50, // Move up instead of side (more modern)
          opacity: 0,
          scale: 0.95, // Subtle zoom in
          duration: 1,
          ease: "power3.out"
        });

        // Content Slide In
        gsap.from(content, {
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
          },
          y: 30,
          opacity: 0,
          duration: 1,
          delay: 0.2,
          ease: "power3.out"
        });
      });

    }, compRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="about-container" ref={compRef}>
      
      {/* --- HERO HEADER --- */}
      <section className="about-hero">
        <h1 className="about-hero-title">Who We Are</h1>
        <p className="about-hero-subtitle">
          Dedicated to democratizing mental health support. We combine 
          human empathy with advanced technology to ensure no one fights alone.
        </p>
      </section>

      {/* --- SECTION 1 --- */}
      <section className="about-section">
        <div className="about-image-wrapper">
          <img src={emotionalSupport} alt="Providing Emotional Support" className="about-img" />
        </div>
        <div className="about-content">
          <h2 className="about-heading">
            <span>Our Mission</span>
            Bridging The Gap
          </h2>
          <p className="about-text">
            We believe that mental healthcare should be accessible to everyone, 
            regardless of location or schedule. Our mission is to bridge the 
            gap between professional therapy and daily emotional support. By 
            integrating AI assistance with licensed professionals, we create 
            a safety net that catches you when you fall.
          </p>
        </div>
      </section>

      {/* --- SECTION 2 (Reversed by CSS) --- */}
      <section className="about-section">
        <div className="about-image-wrapper">
          <img src={FeelGood} alt="Feeling Good and Wellness" className="about-img" />
        </div>
        <div className="about-content">
          <h2 className="about-heading">
            <span>Wellness First</span>
            A Holistic Approach
          </h2>
          <p className="about-text">
            Wellness isn't just about fixing problems; it's about fostering 
            positivity. We focus on "Feeling Good" by offering tools for 
            mindfulness, mood tracking, and self-reflection. We aim to 
            empower users to understand their emotions and build resilience 
            against the stresses of modern life.
          </p>
        </div>
      </section>

      {/* --- SECTION 3 --- */}
      <section className="about-section">
        <div className="about-image-wrapper">
          <img src={happyface} alt="Happy Community" className="about-img" />
        </div>
        <div className="about-content">
          <h2 className="about-heading">
            <span>Community</span>
            Building Happiness
          </h2>
          <p className="about-text">
            At the core of our platform is the human desire for connection and 
            happiness. We strive to create a stigma-free environment where 
            seeking help is seen as a strength. Whether you are chatting with 
            our AI or speaking to a doctor, our goal is to put a genuine 
            smile on your face and peace in your mind.
          </p>
        </div>
      </section>

    </div>
  );
}

export default AboutUs;