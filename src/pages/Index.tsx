import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Sparkles, Heart, Zap, ArrowRight } from "lucide-react";
import { CategoryChips } from "@/components/CategoryChips";
import { ShowcaseGrid } from "@/components/ShowcaseGrid";
import { SocialProof } from "@/components/SocialProof";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

const Index = () => {
  const navigate = useNavigate();
  
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
        <nav className="flex items-center gap-4 flex-shrink-0">
          <button onClick={() => navigate("/discover")} className="text-sm font-semibold hover:text-cp-green transition-colors whitespace-nowrap">
            Find Photographers
          </button>
          <button onClick={() => navigate("/auth")} className="text-sm font-semibold hover:text-cp-green transition-colors whitespace-nowrap">
            Become a Photographer
          </button>
        </nav>
        
        <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          <Camera className="w-6 h-6 text-cp-green" />
          <span className="text-xl font-bold tracking-tight text-cp-ink">SHOW CASE</span>
        </div>
        
        <div className="flex items-center flex-shrink-0">
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section - Full Screen */}
      <section className="hero">
        <div className="max-w-5xl mx-auto">
          <p className="eyebrow text-white/90 uppercase tracking-widest text-sm font-semibold mb-6">
            The marketplace without the hassle
          </p>
          
          <h1 className="mb-6">
            <span>FIND YOUR</span><br />
            <span className="headline-line-2">PERFECT MATCH</span>
          </h1>
          
          <p className="mb-8">
            Show Case helps you find THE right photographer. Swipe through local talent, 
            match with your style, and book—weddings, surf, portraits and more.
          </p>
          
          <div className="cta">
            <button 
              onClick={() => navigate("/discover")}
              className="btn-primary btn-lg"
            >
              I am looking for a photographer
            </button>
            <button 
              onClick={() => navigate("/auth")}
              className="btn-secondary btn-lg"
            >
              I am a photographer
            </button>
          </div>
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
        className={`section-sm bg-cp-cream transition-all duration-700 ${
          howItWorksAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center mb-16">
          <p className="text-cp-gold uppercase tracking-widest text-sm font-bold mb-3">Simple Process</p>
          <h2 className="text-4xl md:text-5xl font-bold text-cp-ink mb-3">How It Works</h2>
          <p className="text-cp-muted text-lg max-w-2xl mx-auto">
            Finding the perfect photographer has never been easier
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div 
            className={`float-card text-center transition-all duration-700 ${
              howItWorksAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: howItWorksAnim.isVisible ? "100ms" : "0ms" }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cp-green/10 mb-6">
              <Sparkles className="w-10 h-10 text-cp-green" />
            </div>
            <div className="text-cp-gold font-black text-5xl mb-4">01</div>
            <h3 className="text-2xl font-bold text-cp-ink mb-3">Browse Profiles</h3>
            <p className="text-cp-muted leading-relaxed">
              Explore verified photographers in your area with detailed portfolios and reviews
            </p>
          </div>
          
          <div 
            className={`float-card text-center transition-all duration-700 ${
              howItWorksAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: howItWorksAnim.isVisible ? "200ms" : "0ms" }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cp-green/10 mb-6">
              <Heart className="w-10 h-10 text-cp-green" />
            </div>
            <div className="text-cp-gold font-black text-5xl mb-4">02</div>
            <h3 className="text-2xl font-bold text-cp-ink mb-3">Match & Connect</h3>
            <p className="text-cp-muted leading-relaxed">
              Swipe through options and connect with photographers whose style matches yours
            </p>
          </div>
          
          <div 
            className={`float-card text-center transition-all duration-700 ${
              howItWorksAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: howItWorksAnim.isVisible ? "300ms" : "0ms" }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cp-green/10 mb-6">
              <Zap className="w-10 h-10 text-cp-green" />
            </div>
            <div className="text-cp-gold font-black text-5xl mb-4">03</div>
            <h3 className="text-2xl font-bold text-cp-ink mb-3">Book Instantly</h3>
            <p className="text-cp-muted leading-relaxed">
              Schedule your session, manage details, and get beautiful photos delivered
            </p>
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section 
        ref={browseStyleAnim.ref}
        className={`section-sm bg-white transition-all duration-700 ${
          browseStyleAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center mb-12">
          <p className="text-cp-gold uppercase tracking-widest text-sm font-bold mb-3">Explore Styles</p>
          <h2 className="text-4xl md:text-5xl font-bold text-cp-ink mb-3">Browse by Style</h2>
          <p className="text-cp-muted text-lg max-w-2xl mx-auto mb-8">
            Find photographers who specialize in what you need
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <CategoryChips />
        </div>
      </section>

      {/* Featured Photographers */}
      <section 
        ref={featuredAnim.ref}
        className={`section-sm bg-cp-cream transition-all duration-700 ${
          featuredAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center mb-12">
          <p className="text-cp-gold uppercase tracking-widest text-sm font-bold mb-3">Top Talent</p>
          <h2 className="text-4xl md:text-5xl font-bold text-cp-ink mb-3">Featured Photographers</h2>
          <p className="text-cp-muted text-lg max-w-2xl mx-auto">
            Top-rated professionals ready to capture your special moments
          </p>
        </div>
        <ShowcaseGrid />
        <div className="text-center mt-10">
          <button
            onClick={() => navigate("/discover")}
            className="btn-primary btn-lg inline-flex items-center gap-2"
          >
            View All Photographers
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
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
            style={{ transitionDelay: ctaAnim.isVisible ? "250ms" : "0ms" }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cp-gold/10 mb-5">
              <Sparkles className="w-8 h-8 text-cp-gold" />
            </div>
            <h3 className="text-2xl font-bold text-cp-ink mb-3">Are you a photographer?</h3>
            <p className="text-cp-muted text-base mb-6 leading-relaxed">
              Join our platform to connect with clients, showcase your work, and grow your business.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="px-6 py-3 rounded-full bg-cp-gold text-white font-bold hover:brightness-110 transition-all text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="section">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="font-bold text-lg mb-6 uppercase tracking-wide text-cp-ink">Explore</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => navigate("/discover")} className="text-cp-muted hover:text-cp-green transition-colors text-sm">
                    Find Photographers
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/auth")} className="text-cp-muted hover:text-cp-green transition-colors text-sm">
                    Become a Photographer
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/auth")} className="text-cp-muted hover:text-cp-green transition-colors text-sm">
                    Sign In
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6 uppercase tracking-wide text-cp-ink">Support</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => navigate("/help")} className="text-cp-muted hover:text-cp-green transition-colors text-sm">
                    Help Center
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/contact")} className="text-cp-muted hover:text-cp-green transition-colors text-sm">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-cp-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Camera className="w-6 h-6 text-cp-green" />
              <span className="font-bold text-xl tracking-tight text-cp-ink">SHOW CASE</span>
            </div>
            <p className="text-cp-muted text-sm">
              © {new Date().getFullYear()} Show Case. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
