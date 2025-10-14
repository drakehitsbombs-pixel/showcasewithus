import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, X, MapPin } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

const Discover = () => {
  const [user, setUser] = useState<any>(null);
  const [creators, setCreators] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    styles: [] as string[],
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadBrief(session.user.id);
      }
    });
  }, []);

  const loadBrief = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("client_briefs")
        .select("*")
        .eq("client_user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setBrief(data);
      } else {
        // No brief exists, create one with defaults
        const { data: newBrief, error: createError } = await supabase
          .from("client_briefs")
          .insert({
            client_user_id: userId,
            project_type: "wedding",
            budget_low: 100,
            budget_high: 5000,
          })
          .select()
          .single();
        
        if (createError) {
          console.error("Error creating brief:", createError);
          toast.error("Please set up your profile first");
          navigate("/client/profile/edit");
        } else {
          setBrief(newBrief);
        }
      }
    } catch (error: any) {
      console.error("Error loading brief:", error);
      toast.error("Please set up your profile");
      navigate("/client/profile/edit");
    }
  };

  const loadCreators = async () => {
    setLoading(true);
    try {
      // Get user location if available
      let client_lat = brief?.geo_lat;
      let client_lng = brief?.geo_lng;

      const { data, error } = await supabase.functions.invoke('match-creators', {
        body: { 
          filters: {
            ...filters,
            client_lat,
            client_lng,
          }
        }
      });

      if (error) throw error;

      if (data?.creators) {
        setCreators(data.creators);
        setCurrentIndex(0);
        
        // Track profile views
        data.creators.forEach((creator: any) => {
          supabase.from('profile_views').insert({
            creator_user_id: creator.user_id,
            viewer_user_id: user?.id,
          }).then(() => {});
        });
      }
    } catch (error: any) {
      console.error("Error loading creators:", error);
      toast.error("Failed to load photographers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply style filter from URL
    const styleParam = searchParams.get("style");
    if (styleParam) {
      const stylesArray = styleParam.split(',').filter(s => s);
      setFilters(prev => ({
        ...prev,
        styles: stylesArray
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && brief) {
      loadCreators();
    }
  }, [user, brief, filters.styles]);

  const handleLike = async () => {
    if (!user || currentIndex >= creators.length) return;

    const creator = creators[currentIndex];

    try {
      // Call atomic like handler edge function
      const { data, error } = await supabase.functions.invoke('handle-like', {
        body: { target_user_id: creator.user_id }
      });

      if (error) throw error;

      if (data.matched && data.thread_id) {
        // It's a match!
        toast.success("🎉 It's a Match!", {
          description: `You and ${creator.users_extended?.name} like each other!`,
          action: {
            label: "Message Now",
            onClick: () => navigate(`/messages/${data.thread_id}`),
          },
        });
      } else {
        toast.success("Like sent! We'll notify you if it's a match.");
      }

      setCurrentIndex((prev) => prev + 1);
    } catch (error: any) {
      console.error("Error in like flow:", error);
      toast.error("Couldn't send like. Please try again.");
    }
  };

  const handlePass = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const currentCreator = creators[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Discover Photographers</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/client/profile/edit")}>
              Edit Profile
            </Button>
            <Button variant="outline" onClick={() => navigate("/matches")}>
              My Matches
            </Button>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Loading photographers...</p>
            </div>
          ) : currentCreator ? (
            <div className="max-w-lg mx-auto">
              <Card 
                className="swipe-card shadow-elevated cursor-pointer"
                onClick={() => navigate(`/creator/${currentCreator.user_id}`)}
              >
                <div className="relative aspect-[3/4] bg-muted">
                  {currentCreator.portfolio_images?.[0] && (
                    <img
                      src={currentCreator.portfolio_images[0].url}
                      alt="Portfolio"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-4 right-4">
                    <div className="match-score-badge">
                      {currentCreator.match_score}
                    </div>
                  </div>
                  {currentCreator.distance && (
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {Math.round(currentCreator.distance)} km
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {currentCreator.users_extended?.name}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {currentCreator.users_extended?.city}
                  </p>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {currentCreator.styles?.map((style: string) => (
                      <span
                        key={style}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {currentCreator.users_extended?.bio}
                  </p>
                  {currentCreator.price_band_low && (
                    <p className="text-sm font-semibold mb-3">
                      ${currentCreator.price_band_low} - ${currentCreator.price_band_high}/hr
                    </p>
                  )}
                  {currentCreator.portfolio_images && currentCreator.portfolio_images.length > 1 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {currentCreator.portfolio_images.slice(1, 4).map((img: any, idx: number) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt={`Portfolio ${idx + 2}`}
                          className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/creator/${currentCreator.user_id}`);
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/creator/${currentCreator.user_id}`);
                    }}
                  >
                    View Full Profile
                  </Button>
                </CardContent>
              </Card>

              <div className="flex justify-center gap-6 mt-6">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-16 h-16 rounded-full border-2"
                  onClick={handlePass}
                >
                  <X className="w-6 h-6" />
                </Button>
                <Button
                  size="lg"
                  className="w-16 h-16 rounded-full gradient-accent"
                  onClick={handleLike}
                >
                  <Heart className="w-6 h-6" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">
                {creators.length === 0 
                  ? "No photographers match your current filters."
                  : "You've seen all available photographers!"}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Try widening your search by increasing distance, expanding your budget range, or adjusting your dates.
              </p>
              <Button onClick={() => loadCreators()}>
                Refresh Results
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover;
