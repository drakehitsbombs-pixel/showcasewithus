import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Sparkles, Heart, Zap, ArrowRight } from "lucide-react";
import { CategoryChips } from "@/components/CategoryChips";
import { ShowcaseGrid } from "@/components/ShowcaseGrid";
import { SocialProof } from "@/components/SocialProof";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();

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
      <header className="navbar">
        <nav className="flex items-center gap-8">
          <button onClick={() => navigate("/discover")} className="text-sm font-medium hover:text-cp-green transition-colors">
            Find Photographers
          </button>
          <button onClick={() => navigate("/auth")} className="text-sm font-medium hover:text-cp-green transition-colors">
            Become a Photographer
          </button>
        </nav>
        
        <div className="flex items-center gap-2">
          <Camera className="w-7 h-7 text-cp-green" />
          <span className="text-2xl font-bold tracking-tight text-cp-ink">SHOW CASE</span>
        </div>
        
        <div className="flex items-center gap-8">
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <p className="text-white/90 uppercase tracking-widest text-sm font-semibold mb-8">
          The marketplace without the hassle
        </p>
        
        <h1>
          <span>FIND YOUR</span><br />
          <span className="headline-line-2">PERFECT MATCH</span>
        </h1>
        
        <p>
          Show Case helps you find THE right photographer. Swipe through local talent, 
          match with your style, and book—weddings, surf, portraits and more.
        </p>
        
        <div className="cta">
          <button 
            onClick={() => navigate("/discover")}
            className="btn-primary"
          >
            I am looking for a photographer
          </button>
          <button 
            onClick={() => navigate("/auth")}
            className="btn-secondary"
          >
            I am a photographer
          </button>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-8 bg-cp-cream">
        <div className="trust-strip">
          <SocialProof />
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-cp-cream">
        <div className="text-center mb-20">
          <p className="text-cp-gold uppercase tracking-widest text-sm font-bold mb-4">Simple Process</p>
          <h2 className="text-4xl md:text-5xl font-bold text-cp-ink mb-4">How It Works</h2>
          <p className="text-cp-muted text-lg max-w-2xl mx-auto">
            Finding the perfect photographer has never been easier
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="float-card text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cp-green/10 mb-6">
              <Sparkles className="w-10 h-10 text-cp-green" />
            </div>
            <div className="text-cp-gold font-black text-5xl mb-4">01</div>
            <h3 className="text-2xl font-bold text-cp-ink mb-3">Browse Profiles</h3>
            <p className="text-cp-muted leading-relaxed">
              Explore verified photographers in your area with detailed portfolios and reviews
            </p>
          </div>
          
          <div className="float-card text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cp-green/10 mb-6">
              <Heart className="w-10 h-10 text-cp-green" />
            </div>
            <div className="text-cp-gold font-black text-5xl mb-4">02</div>
            <h3 className="text-2xl font-bold text-cp-ink mb-3">Match & Connect</h3>
            <p className="text-cp-muted leading-relaxed">
              Swipe through options and connect with photographers whose style matches yours
            </p>
          </div>
          
          <div className="float-card text-center">
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
      <section className="section bg-white">
        <div className="text-center mb-16">
          <p className="text-cp-gold uppercase tracking-widest text-sm font-bold mb-4">Explore Styles</p>
          <h2 className="text-4xl md:text-5xl font-bold text-cp-ink mb-4">Browse by Style</h2>
          <p className="text-cp-muted text-lg max-w-2xl mx-auto">
            Find photographers who specialize in what you need
          </p>
        </div>
        <CategoryChips />
      </section>

      {/* Featured Photographers */}
      <section className="section bg-cp-cream">
        <div className="text-center mb-16">
          <p className="text-cp-gold uppercase tracking-widest text-sm font-bold mb-4">Top Talent</p>
          <h2 className="text-4xl md:text-5xl font-bold text-cp-ink mb-4">Featured Photographers</h2>
          <p className="text-cp-muted text-lg max-w-2xl mx-auto">
            Top-rated professionals ready to capture your special moments
          </p>
        </div>
        <ShowcaseGrid />
        <div className="text-center mt-12">
          <button
            onClick={() => navigate("/discover")}
            className="px-8 py-3 rounded-full bg-cp-green text-white font-semibold hover:brightness-90 transition-all inline-flex items-center gap-2"
          >
            View All Photographers
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* CTA Sections - Two Tiles */}
      <section className="section bg-white">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* For Clients */}
          <div className="tile p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cp-green/10 mb-6">
              <Camera className="w-10 h-10 text-cp-green" />
            </div>
            <h3 className="text-3xl font-bold text-cp-ink mb-4">Need a photographer?</h3>
            <p className="text-cp-muted text-lg mb-8 leading-relaxed">
              Browse talented photographers, view portfolios, and book the perfect match for your moments.
            </p>
            <button
              onClick={() => navigate("/discover")}
              className="px-8 py-3 rounded-full bg-cp-green text-white font-semibold hover:brightness-90 transition-all"
            >
              View Photographers
            </button>
          </div>

          {/* For Photographers */}
          <div className="tile p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cp-gold/10 mb-6">
              <Sparkles className="w-10 h-10 text-cp-gold" />
            </div>
            <h3 className="text-3xl font-bold text-cp-ink mb-4">Are you a photographer?</h3>
            <p className="text-cp-muted text-lg mb-8 leading-relaxed">
              Join our platform to connect with clients, showcase your work, and grow your business.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="px-8 py-3 rounded-full bg-cp-gold text-white font-semibold hover:brightness-110 transition-all"
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
