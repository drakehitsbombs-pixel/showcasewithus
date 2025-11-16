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
  const ctaAnim = useIntersectionObserver();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRole(session.user.id);
      }
    });

    // Scroll effects for nav
    const handleScroll = () => {
      const solid = window.scrollY > window.innerHeight * 0.66;
      setNavSolid(solid);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("users_extended")
      .select("role")
      .eq("id", userId)
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
      <header className={`site-header ${navSolid ? 'is-solid' : ''}`}>
        <div className="nav">
          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/discover">Find Photographers</Link>
            <Link to="/auth">Become a Photographer</Link>
          </nav>
          
          {/* Mobile: Left spacer */}
          <div className="md:hidden w-10"></div>
          
          {/* Logo - Centered */}
          <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
            <Camera className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-lg md:text-xl font-bold tracking-tight">SHOW CASE</span>
          </div>
          
          {/* Theme Toggle */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" aria-label="Intro">
        <div className="hero__media">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            poster="/hero-bg-optimized.webp"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="hero__content">
          <p className="eyebrow">Hire local photographers in minutes</p>
          <h1 className="display">
            <span className="soft">Find your</span><br/>
            <span className="strong">perfect match</span>
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
          <p className="hero__reassure">Free to browse • No signup to view profiles</p>
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
      <HowItWorks />

      {/* Browse by Style */}
      <BrowseByStyle />

      {/* Featured Photographers */}
      <FeaturedPhotographers />

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
