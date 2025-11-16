import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Camera } from "lucide-react";
import { SocialProof } from "@/components/SocialProof";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

import { BrowseByStyle } from "@/components/BrowseByStyle";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturedPhotographers } from "@/components/FeaturedPhotographers";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const [navSolid, setNavSolid] = useState(false);
  
  // Intersection observers for scroll animations
  const socialProofAnim = useIntersectionObserver();
  const howItWorksAnim = useIntersectionObserver();
  const browseStyleAnim = useIntersectionObserver();
  const featuredAnim = useIntersectionObserver();
  const ctaAnim = useIntersectionObserver();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRole(session.user.id);
      }
    });

    // Scroll effects for nav and parallax
    const handleScroll = () => {
      const solid = window.scrollY > window.innerHeight * 0.75;
      setNavSolid(solid);
      
      const media = document.querySelector('.mammut-video, .mammut-img');
      if (media instanceof HTMLElement) {
        const t = Math.min(1, window.scrollY / window.innerHeight);
        media.style.transform = `scale(${1.02 + t * 0.03}) translateY(${t * 10}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      if (data.role === "creator") {
        navigate("/creator/dashboard");
      } else if (data.role === "client") {
        navigate("/client/discover");
      }
    }
  };

  return (
    <div className="page-frame">
      {/* Navigation Header */}
      <header className={`navbar ${navSolid ? 'is-solid' : ''}`}>
        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-4 flex-shrink-0">
          <Link to="/discover" className="text-sm font-semibold hover:text-cp-green transition-colors whitespace-nowrap">
            Find Photographers
          </Link>
          <Link to="/auth" className="text-sm font-semibold hover:text-cp-green transition-colors whitespace-nowrap">
            Become a Photographer
          </Link>
        </nav>
        
        {/* Mobile: Left spacer */}
        <div className="md:hidden w-10"></div>
        
        {/* Logo - Centered */}
        <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          <Camera className={`w-5 h-5 md:w-6 md:h-6 ${navSolid ? 'text-cp-green' : 'text-white'}`} />
          <span className={`text-lg md:text-xl font-bold tracking-tight ${navSolid ? 'text-cp-ink' : 'text-white'}`}>SHOW CASE</span>
        </div>
        
        {/* Theme Toggle */}
        <div className="flex items-center flex-shrink-0">
          <ThemeToggle />
        </div>
      </header>

      {/* Mammut-style Hero Section */}
      <section className="mammut-hero" aria-label="Intro">
        <div className="mammut-media">
          <video 
            className="mammut-video" 
            autoPlay 
            muted 
            loop 
            playsInline
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="mammut-content">
          <p className="eyebrow">Hire local photographers in minutes</p>
          <h1 className="display">
            <span className="soft">FIND YOUR</span><br/>
            <span className="strong">PERFECT MATCH</span>
          </h1>
          <p className="sub">Browse, compare, and book—weddings, surf, portraits and more.</p>
          <div className="cta-row">
            <button 
              onClick={() => navigate("/discover")}
              className="btn btn-primary"
            >
              I am looking for a photographer
            </button>
            <button 
              onClick={() => navigate("/auth")}
              className="btn btn-ghost"
            >
              I am a photographer
            </button>
          </div>
          <p className="mt-4 text-white/80 text-sm">
            Free to browse • No signup to view profiles
          </p>
        </div>

        <div className="scroll-indicator" aria-hidden="true">
          <span></span>
        </div>
      </section>


      {/* Social Proof */}
      <section 
        ref={socialProofAnim.ref}
        className={`py-6 bg-cp-cream transition-all duration-700 ${
          socialProofAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="trust-strip max-w-4xl">
          <SocialProof />
        </div>
      </section>

      {/* How It Works */}
      <section
        ref={howItWorksAnim.ref}
        className={`transition-all duration-700 ${
          howItWorksAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <HowItWorks />
      </section>

      {/* Browse by Style */}
      <section
        ref={browseStyleAnim.ref}
        className={`transition-all duration-700 ${
          browseStyleAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <BrowseByStyle />
      </section>

      {/* Featured Photographers */}
      <section
        ref={featuredAnim.ref}
        className={`transition-all duration-700 ${
          featuredAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <FeaturedPhotographers />
      </section>

      {/* CTA Sections - Two Tiles */}
      <section 
        ref={ctaAnim.ref}
        className={`section-sm bg-white transition-all duration-700 ${
          ctaAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* For Clients */}
          <div 
            className={`tile p-10 text-center transition-all duration-700 ${
              ctaAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: ctaAnim.isVisible ? "100ms" : "0ms" }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cp-green/10 mb-5">
              <Camera className="w-8 h-8 text-cp-green" />
            </div>
            <h3 className="text-2xl font-bold text-cp-ink mb-3">Need a photographer?</h3>
            <p className="text-cp-muted text-base mb-6 leading-relaxed">
              Browse talented photographers, view portfolios, and book the perfect match for your moments.
            </p>
            <button
              onClick={() => navigate("/discover")}
              className="btn-primary btn-md"
            >
              View Photographers
            </button>
          </div>

          {/* For Photographers */}
          <div 
            className={`tile p-10 text-center transition-all duration-700 ${
              ctaAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: ctaAnim.isVisible ? "200ms" : "0ms" }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cp-green/10 mb-5">
              <Camera className="w-8 h-8 text-cp-green" />
            </div>
            <h3 className="text-2xl font-bold text-cp-ink mb-3">Are you a photographer?</h3>
            <p className="text-cp-muted text-base mb-6 leading-relaxed">
              Join our community, showcase your work, and connect with clients looking for your talent.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="btn-secondary btn-md"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
