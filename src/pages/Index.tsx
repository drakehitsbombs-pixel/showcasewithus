import { useEffect } from "react";
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
  
  // Intersection observers for scroll animations
  const socialProofAnim = useIntersectionObserver();
  const ctaAnim = useIntersectionObserver();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRole(session.user.id);
      }
    });
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
      <header className="navbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
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
          <Camera className="w-5 h-5 md:w-6 md:h-6 text-cp-green" />
          <span className="text-lg md:text-xl font-bold tracking-tight text-cp-ink">SHOW CASE</span>
        </div>
        
        {/* Theme Toggle */}
        <div className="flex items-center flex-shrink-0">
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section - Full Screen */}
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow text-white/90 uppercase tracking-widest text-xs md:text-sm font-semibold mb-4 md:mb-6">
            Hire local photographers in minutes
          </p>
          
          <h1 className="mb-6 text-4xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[0.9]">
            <span>FIND YOUR</span><br />
            <span className="headline-line-2">PERFECT MATCH</span>
          </h1>
          
          <p className="mb-8 text-lg md:text-2xl text-white/95 max-w-2xl mx-auto leading-relaxed font-light px-4">
            Show Case helps you find <span className="font-semibold">THE</span> right photographer. Swipe through local talent, 
            match with your style, and book—weddings, surf, portraits and more.
          </p>
          
          <div className="cta flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
            <button 
              onClick={() => navigate("/discover")}
              className="w-full sm:w-auto px-8 py-4 bg-primary hover:brightness-90 text-primary-foreground rounded-full font-semibold text-sm md:text-base transition-all shadow-lg"
            >
              I am looking for a photographer
            </button>
            <button 
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full font-semibold text-sm md:text-base transition-all"
            >
              I am a photographer
            </button>
          </div>
          
          <p className="mt-6 text-white/80 text-sm">
            Free to browse • No signup to view profiles
          </p>
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
