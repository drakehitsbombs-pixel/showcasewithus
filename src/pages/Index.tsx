import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Camera } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRole(session.user.id);
      }
    });

    // Scroll effects for parallax
    const handleScroll = () => {
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
      {/* Transparent Navigation Header */}
      <header className="navbar">
        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-4 flex-shrink-0">
          <Link to="/discover" className="text-sm font-semibold text-white hover:text-white/70 transition-colors whitespace-nowrap">
            Find Photographers
          </Link>
          <Link to="/auth" className="text-sm font-semibold text-white hover:text-white/70 transition-colors whitespace-nowrap">
            Become a Photographer
          </Link>
        </nav>
        
        {/* Mobile: Left spacer */}
        <div className="md:hidden w-10"></div>
        
        {/* Logo - Centered */}
        <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          <Camera className="w-5 h-5 md:w-6 md:h-6 text-white" />
          <span className="text-lg md:text-xl font-bold tracking-tight text-white">SHOW CASE</span>
        </div>
        
        {/* Theme Toggle */}
        <div className="flex items-center flex-shrink-0">
          <ThemeToggle />
        </div>
      </header>

      {/* Minimal Hero Section */}
      <section className="mammut-hero" aria-label="Intro">
        <div className="mammut-media">
          <video 
            className="mammut-video" 
            autoPlay 
            muted 
            loop 
            playsInline 
            poster="/hero-bg-optimized.webp"
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
        </div>
      </section>
    </div>
  );
};

export default Index;
