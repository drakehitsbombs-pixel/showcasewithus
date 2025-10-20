import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Heart, Zap, ArrowRight } from "lucide-react";
import { HeroSlideshow } from "@/components/HeroSlideshow";
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
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-50 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-white" />
            <span className="text-xl font-bold text-white">Show Case</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <HeroSlideshow />
        <div className="relative z-20 container mx-auto px-4 py-32 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-6 shadow-glow">
            <Camera className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl">
            Book photographers you'll actually love
          </h1>
          <p className="text-xl md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto drop-shadow-lg font-medium">
            Swipe, match, and book—weddings, surf, portraits and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gradient-primary shadow-glow text-lg h-14 px-8" 
              onClick={() => navigate("/auth")}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 text-lg h-14 px-8" 
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <SocialProof />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-16 text-lg max-w-2xl mx-auto">
            Finding the perfect photographer has never been easier
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div 
              className="text-center animate-fade-in bg-card rounded-2xl p-8 shadow-card hover:shadow-elevated transition-all" 
              style={{ animationDelay: "0ms" }}
            >
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Find your style</h3>
              <p className="text-muted-foreground text-base">
                Browse by style, budget, and date.
              </p>
            </div>
            <div 
              className="text-center animate-fade-in bg-card rounded-2xl p-8 shadow-card hover:shadow-elevated transition-all" 
              style={{ animationDelay: "100ms" }}
            >
              <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Match & chat</h3>
              <p className="text-muted-foreground text-base">
                Like a profile to match, then message right away.
              </p>
            </div>
            <div 
              className="text-center animate-fade-in bg-card rounded-2xl p-8 shadow-card hover:shadow-elevated transition-all" 
              style={{ animationDelay: "200ms" }}
            >
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Book with confidence</h3>
              <p className="text-muted-foreground text-base">
                Lock a time and keep everything in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Browse by Category</h2>
          <p className="text-center text-muted-foreground mb-10 text-lg">
            Find photographers specialized in your needs
          </p>
          <CategoryChips />
        </div>
      </section>

      {/* Showcase Preview Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">From the community</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stunning work from talented photographers on Show Case
            </p>
          </div>
          <ShowcaseGrid />
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              variant="outline" 
              className="gradient-primary text-primary-foreground border-0"
              onClick={() => navigate("/client/showcase")}
            >
              View Showcase
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Countdown CTA Strip */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Weekend dates fill up fast—see who's free
          </h3>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-primary hover:bg-white/90 text-lg h-12 px-8"
            onClick={() => navigate("/client/discover?tab=search")}
          >
            Find Available Photographers
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">Show Case</span>
              </div>
              <p className="text-muted-foreground max-w-md">
                Find and book photographers for weddings, events, surf, portraits, and more.
                Connect with talented creators and bring your vision to life.
              </p>
            </div>
            <div className="flex flex-wrap gap-8">
              <div>
                <h4 className="font-semibold mb-3">Explore</h4>
                <ul className="space-y-2">
                  <li>
                    <button 
                      onClick={() => navigate("/client/discover")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Discover
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigate("/client/showcase")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Showcase
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigate("/surfing")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Surfing
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Support</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Contact Us
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Show Case. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
