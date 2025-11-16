import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [navSolid, setNavSolid] = useState(false);

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
      {/* Minimal Navigation Header */}
      <header className={`navbar ${navSolid ? 'is-solid' : ''}`}>
        <div className="flex-1"></div>
        
        {/* Right-aligned navigation */}
        <nav className="flex items-center gap-8">
          <button 
            onClick={() => navigate("/surfing")}
            className="text-sm font-medium uppercase tracking-wider hover:opacity-70 transition-opacity"
          >
            INSPIRATION
          </button>
          <button 
            onClick={() => navigate("/auth")}
            className="text-sm font-medium uppercase tracking-wider hover:opacity-70 transition-opacity"
          >
            JOIN
          </button>
          <button 
            onClick={() => navigate("/discover")}
            className="text-sm font-medium uppercase tracking-wider hover:opacity-70 transition-opacity"
          >
            PRIZES
          </button>
        </nav>
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
          <h1 className="display">
            <span className="soft">Go further,</span> yet stay<br/>
            <span className="strong">close.</span>
          </h1>
        </div>
      </section>
    </div>
  );
};

export default Index;
