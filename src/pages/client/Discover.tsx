import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, X, MapPin, Search as SearchIcon, Sliders } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { STYLE_OPTIONS, getStyleLabel, BUDGET_STEPS, formatBudget, kmToMiles, formatMiles } from "@/lib/constants";
import SurfingLoader from "@/components/SurfingLoader";

const Discover = () => {
  const [user, setUser] = useState<any>(null);
  const [creators, setCreators] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    styles: [] as string[],
  });
  const activeTab = searchParams.get("tab") || "swipe";
  
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", tab);
      return newParams;
    });
  };
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    styles: [] as string[],
    distance: 100,
    budgetMinimum: 0,
  });
  const [searchLoading, setSearchLoading] = useState(false);
  
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

    // Check for style filter from URL
    const stylesParam = searchParams.get("styles");
    if (stylesParam) {
      setSearchFilters(prev => ({
        ...prev,
        styles: stylesParam.split(","),
      }));
      setActiveTab("search");
    }
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
        
        // Track profile views (unique per viewer per creator)
        if (user?.id) {
          data.creators.forEach(async (creator: any) => {
            const { data: existingView } = await supabase
              .from('profile_views')
              .select('id')
              .eq('creator_user_id', creator.user_id)
              .eq('viewer_user_id', user.id)
              .maybeSingle();
            
            if (!existingView) {
              await supabase.from('profile_views').insert({
                creator_user_id: creator.user_id,
                viewer_user_id: user.id,
              });
            }
          });
        }
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

  const loadSearchResults = async () => {
    setSearchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-creators', {
        body: { 
          filters: {
            styles: searchFilters.styles,
            distance: searchFilters.distance,
            budget_min: searchFilters.budgetMinimum,
            budget_max: searchFilters.budgetMinimum > 0 ? searchFilters.budgetMinimum : 10000,
            client_lat: brief?.geo_lat,
            client_lng: brief?.geo_lng,
          }
        }
      });

      if (error) throw error;
      setSearchResults(data?.creators || []);
    } catch (error: any) {
      console.error("Error loading search results:", error);
      toast.error("Failed to load search results");
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleSearchStyle = (style: string) => {
    setSearchFilters(prev => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter(s => s !== style)
        : [...prev.styles, style]
    }));
  };

  const clearSearchFilters = () => {
    setSearchFilters({
      styles: [],
      distance: 100,
      budgetMinimum: 0,
    });
  };

  useEffect(() => {
    if (activeTab === "search" && user && brief) {
      const timeoutId = setTimeout(() => {
        loadSearchResults();
      }, 350);
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, searchFilters, user, brief]);

  const currentCreator = creators[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="mb-6">
            <TabsTrigger value="swipe">Swipe</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="swipe">
            {loading ? (
              <SurfingLoader />
            ) : currentCreator ? (
            <div className="max-w-lg mx-auto">
              <Card 
                className="swipe-card shadow-elevated cursor-pointer"
                onClick={() => {
                  const username = currentCreator.users_extended?.username || currentCreator.user_id;
                  navigate(`/creator/${username}`, { state: { userId: currentCreator.user_id } });
                }}
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
                        {getStyleLabel(style)}
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
                            const username = currentCreator.users_extended?.username || currentCreator.user_id;
                            navigate(`/creator/${username}`, { state: { userId: currentCreator.user_id } });
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
                      const username = currentCreator.users_extended?.username || currentCreator.user_id;
                      navigate(`/creator/${username}`, { state: { userId: currentCreator.user_id } });
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
          </TabsContent>

          <TabsContent value="search">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Sliders className="w-4 h-4" />
                    <h3 className="font-semibold">Filters</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="filter-label">Styles</Label>
                      <div className="flex flex-wrap gap-2">
                        {STYLE_OPTIONS.map((style) => (
                          <button
                            key={style.id}
                            className={`filter-pill ${
                              searchFilters.styles.includes(style.id) ? 'active' : ''
                            }`}
                            onClick={() => toggleSearchStyle(style.id)}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="filter-label">
                        Distance: {formatMiles(kmToMiles(searchFilters.distance))} mi
                      </Label>
                      <Slider
                        value={[searchFilters.distance]}
                        onValueChange={([value]) => setSearchFilters(prev => ({ ...prev, distance: value }))}
                        min={5}
                        max={200}
                        step={5}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="filter-label">
                        Budget ≥ {searchFilters.budgetMinimum === 0 ? 'Any' : formatBudget(searchFilters.budgetMinimum)}
                      </Label>
                      <Slider
                        value={[BUDGET_STEPS.indexOf(searchFilters.budgetMinimum as typeof BUDGET_STEPS[number])]}
                        onValueChange={([index]) => setSearchFilters(prev => ({ 
                          ...prev, 
                          budgetMinimum: BUDGET_STEPS[index] 
                        }))}
                        min={0}
                        max={BUDGET_STEPS.length - 1}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>Any</span>
                        <span>$5k</span>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={clearSearchFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-3">
                {searchLoading ? (
                  <SurfingLoader />
                ) : searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((creator) => (
                      <Card 
                        key={creator.user_id}
                        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => {
                          const username = creator.users_extended?.username || creator.user_id;
                          navigate(`/creator/${username}`, { state: { userId: creator.user_id } });
                        }}
                      >
                        <div className="flex gap-4">
                          <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                            {creator.portfolio_images?.[0] && (
                              <img
                                src={creator.portfolio_images[0].url}
                                alt="Portfolio"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold">{creator.users_extended?.name}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {creator.users_extended?.city}
                                  {creator.distance && ` • ${Math.round(creator.distance)}km away`}
                                </p>
                              </div>
                              <div className="match-score-badge text-sm">
                                {creator.match_score}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {creator.styles?.slice(0, 4).map((style: string) => (
                                <Badge key={style} variant="secondary" className="text-xs">
                                  {getStyleLabel(style)}
                                </Badge>
                              ))}
                            </div>
                            {creator.price_band_low && (
                              <p className="text-sm font-semibold mb-2">
                                ${creator.price_band_low} - ${creator.price_band_high}/hr
                              </p>
                            )}
                            {creator.portfolio_images && creator.portfolio_images.length > 1 && (
                              <div className="flex gap-2 mt-2">
                                {creator.portfolio_images.slice(1, 4).map((img: any, idx: number) => (
                                  <div key={idx} className="w-16 h-16 rounded overflow-hidden bg-muted">
                                    <img
                                      src={img.url}
                                      alt={`Portfolio ${idx + 2}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <SearchIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground mb-4">No results found</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Try widening distance or budget, or clear style filters.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={clearSearchFilters}>
                        Clear Filters
                      </Button>
                      <Button onClick={() => setSearchFilters(prev => ({ ...prev, distance: prev.distance + 50 }))}>
                        Widen Distance
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Discover;
