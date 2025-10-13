import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Heart, X, Filter, MapPin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import Navigation from "@/components/Navigation";

const Discover = () => {
  const [user, setUser] = useState<any>(null);
  const [creators, setCreators] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  
  // Search filters
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    styles: [] as string[],
    budget_min: 0,
    budget_max: 5000,
    distance_km: 50,
    date_start: "",
    date_end: "",
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
        // Pre-populate filters from brief
        setFilters({
          styles: data.mood_tags || [],
          budget_min: data.budget_low || 100,
          budget_max: data.budget_high || 5000,
          distance_km: 50,
          date_start: data.date_window_start || "",
          date_end: data.date_window_end || "",
        });
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
    if (user && brief) {
      loadCreators();
    }
  }, [user, brief]);

  const handleLike = async () => {
    if (!user || currentIndex >= creators.length) return;

    const creator = creators[currentIndex];

    try {
      // Create match
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .insert({
          creator_user_id: creator.user_id,
          client_user_id: user.id,
          client_liked: true,
          match_score: creator.match_score || 85,
          brief_id: brief?.id,
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Send automatic notification message
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          match_id: matchData.id,
          sender_user_id: user.id,
          text: `Hi! I viewed your profile and I'm interested in your work. I'd love to discuss my project with you!`,
        });

      if (messageError) throw messageError;

      toast.success("Liked! Message sent to photographer.");
      setCurrentIndex((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error.message || "Error creating match");
    }
  };

  const handlePass = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const currentCreator = creators[currentIndex];
  const availableStyles = ["wedding", "portrait", "product", "event", "lifestyle", "editorial"];

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

        <Tabs defaultValue="swipe" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="swipe">Swipe</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="swipe" className="mt-8">
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

                <div className="flex gap-4 justify-center mt-6">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-16 h-16 rounded-full"
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
          </TabsContent>

          <TabsContent value="search" className="mt-8">
            <div className="max-w-4xl mx-auto">
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filters
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      {showFilters ? "Hide" : "Show"}
                    </Button>
                  </div>

                  {showFilters && (
                    <div className="space-y-6">
                      <div>
                        <Label>Photography Styles</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {availableStyles.map((style) => (
                            <Button
                              key={style}
                              variant={filters.styles.includes(style) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setFilters({
                                  ...filters,
                                  styles: filters.styles.includes(style)
                                    ? filters.styles.filter(s => s !== style)
                                    : [...filters.styles, style]
                                });
                              }}
                            >
                              {style}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Budget Min ($)</Label>
                          <Input
                            type="number"
                            value={filters.budget_min}
                            onChange={(e) => setFilters({ ...filters, budget_min: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Budget Max ($)</Label>
                          <Input
                            type="number"
                            value={filters.budget_max}
                            onChange={(e) => setFilters({ ...filters, budget_max: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Distance (km): {filters.distance_km}</Label>
                        <Slider
                          value={[filters.distance_km]}
                          onValueChange={(value) => setFilters({ ...filters, distance_km: value[0] })}
                          max={200}
                          step={10}
                          className="mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Date From</Label>
                          <Input
                            type="date"
                            value={filters.date_start}
                            onChange={(e) => setFilters({ ...filters, date_start: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Date To</Label>
                          <Input
                            type="date"
                            value={filters.date_end}
                            onChange={(e) => setFilters({ ...filters, date_end: e.target.value })}
                          />
                        </div>
                      </div>

                      <Button onClick={loadCreators} className="w-full">
                        Apply Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {loading ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">Searching...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creators.map((creator) => (
                    <Card 
                      key={creator.user_id} 
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/creator/${creator.user_id}`)}
                    >
                      <div className="relative aspect-square bg-muted">
                        {creator.portfolio_images?.[0] && (
                          <img
                            src={creator.portfolio_images[0].url}
                            alt="Portfolio"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 right-2">
                          <div className="match-score-badge text-sm">
                            {creator.match_score}
                          </div>
                        </div>
                        {creator.distance && (
                          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {Math.round(creator.distance)} km
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-1">
                          {creator.users_extended?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {creator.users_extended?.city}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {creator.styles?.slice(0, 2).map((style: string) => (
                            <span
                              key={style}
                              className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                            >
                              {style}
                            </span>
                          ))}
                        </div>
                        {creator.price_band_low && (
                          <p className="text-sm font-semibold mb-3">
                            ${creator.price_band_low} - ${creator.price_band_high}/hr
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/creator/${creator.user_id}`);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const { data: matchData, error: matchError } = await supabase
                                  .from("matches")
                                  .insert({
                                    creator_user_id: creator.user_id,
                                    client_user_id: user.id,
                                    client_liked: true,
                                    match_score: creator.match_score || 85,
                                    brief_id: brief?.id,
                                  })
                                  .select()
                                  .single();

                                if (matchError) throw matchError;

                                await supabase.from("messages").insert({
                                  match_id: matchData.id,
                                  sender_user_id: user.id,
                                  text: `Hi! I'm interested in your work. I'd love to discuss my project with you!`,
                                });

                                toast.success("Match created!");
                              } catch (error: any) {
                                toast.error(error.message || "Error creating match");
                              }
                            }}
                          >
                            <Heart className="w-4 h-4 mr-1" />
                            Like
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && creators.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-4">
                    No photographers match your filters.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try widening your distance, expanding your budget range, or selecting different styles.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Discover;
