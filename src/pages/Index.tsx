import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Heart, Zap } from "lucide-react";
import { HeroSlideshow } from "@/components/HeroSlideshow";

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
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[600px] flex items-center">
        <HeroSlideshow />
        <div className="relative z-20 container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-6 shadow-glow">
            <Camera className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
            Book photographers you'll actually love
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Swipe, match, and book—weddings, surf, portraits and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gradient-primary shadow-glow" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in" style={{ animationDelay: "0ms" }}>
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Find your style</h3>
              <p className="text-muted-foreground">
                Browse local photographers by style, budget, and date.
              </p>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: "100ms" }}>
              <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Match & chat</h3>
              <p className="text-muted-foreground">
                Like a profile to match, then message right away.
              </p>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Book with confidence</h3>
              <p className="text-muted-foreground">
                Lock a time, share details, and keep everything in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Photographers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">For Photographers</h2>
              <p className="text-xl text-muted-foreground">Showcase your work and grow your business</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Build a clean portfolio",
                "Set your pricing and availability",
                "Get matched with real clients",
                "Manage messages and bookings",
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <p className="text-foreground">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Clients */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">For Clients</h2>
              <p className="text-xl text-muted-foreground">Find the perfect photographer for any project</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "See real work, not ads",
                "Shortlist your favorites with a swipe",
                "Message and compare in one place",
                "Book and get calendar reminders",
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <p className="text-foreground">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
          <p className="text-xl text-muted-foreground mb-8">Join Show Case today and find your perfect match</p>
          <Button size="lg" className="gradient-primary shadow-glow" onClick={() => navigate("/auth")}>
            Create an account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-muted/50 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Show Case helps people find and book photographers for weddings, events, surf, portraits, product shoots, and more.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
