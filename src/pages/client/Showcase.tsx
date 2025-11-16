import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Eye, Trophy } from "lucide-react";
import Navigation from "@/components/Navigation";
import { getStyleLabel, STYLE_OPTIONS } from "@/lib/constants";

const Showcase = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTopCreators();
  }, [period, selectedStyle]);

  const loadTopCreators = async () => {
    setLoading(true);
    try {
      const daysAgo = period === "7d" ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get top creators by unique profile views in period
      const { data: viewsData, error: viewsError } = await supabase
        .from("profile_views")
        .select("creator_user_id, viewer_user_id")
        .gte("created_at", startDate.toISOString());

      if (viewsError) throw viewsError;

      // Count unique views per creator
      const viewCounts = new Map<string, Set<string>>();
      viewsData?.forEach((view) => {
        if (!viewCounts.has(view.creator_user_id)) {
          viewCounts.set(view.creator_user_id, new Set());
        }
        if (view.viewer_user_id) {
          viewCounts.get(view.creator_user_id)?.add(view.viewer_user_id);
        }
      });

      // Sort by view count
      const sortedCreatorIds = Array.from(viewCounts.entries())
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 15)
        .map(([id]) => id);

      // Get creator profiles
      let query = supabase
        .from("creator_profiles")
        .select(`
          *,
          users_extended!inner(name, city, slug)
        `)
        .eq("public_profile", true)
        .eq("is_discoverable", true);

      // If we have view data, filter by those creators
      if (sortedCreatorIds.length > 0) {
        query = query.in("user_id", sortedCreatorIds);
      }

      if (selectedStyle) {
        query = query.contains("styles", [selectedStyle]);
      }

      // Limit results
      query = query.limit(15);

      const { data: profiles, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setCreators([]);
        setLoading(false);
        return;
      }

      // Load portfolio for each creator
      const creatorsWithData = await Promise.all(
        profiles.map(async (creator) => {
          const { data: portfolio } = await supabase
            .from("portfolio_images")
            .select("url")
            .eq("creator_user_id", creator.user_id)
            .limit(3);

          const uniqueViews = viewCounts.get(creator.user_id)?.size || 0;
          return { 
            ...creator, 
            portfolio_images: portfolio || [],
            unique_views: uniqueViews,
          };
        })
      );

      // Sort by views (if available) or by rating/score
      const sorted = creatorsWithData
        .sort((a, b) => {
          if (sortedCreatorIds.length > 0) {
            return b.unique_views - a.unique_views;
          }
          // Fallback sorting by rating and review count
          return (b.rating_avg || 0) * (b.review_count || 0) - (a.rating_avg || 0) * (a.review_count || 0);
        })
        .map((c, idx) => ({ ...c, rank: idx + 1 }));

      setCreators(sorted);
    } catch (error) {
      console.error("Error loading showcase:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">Loading top creators...</div>
        </div>
      </div>
    );
  }

  const formatViews = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Top Photographers</h1>
          <p className="text-muted-foreground mb-6">
            Most viewed creators in the last {period === "7d" ? "7 days" : "30 days"}
          </p>

          {/* Period Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={period === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("7d")}
            >
              Last 7 days
            </Button>
            <Button
              variant={period === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("30d")}
            >
              Last 30 days
            </Button>
          </div>

          {/* Style Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStyle === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStyle(null)}
            >
              All Styles
            </Button>
            {STYLE_OPTIONS.map((style) => (
              <Button
                key={style.id}
                variant={selectedStyle === style.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStyle(style.id)}
              >
                {style.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading top creators...</div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No creators found for this selection.</p>
          </div>
        ) : (
          <>
            {/* Top 3 Featured */}
            {creators.slice(0, 3).length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Top 3</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {creators.slice(0, 3).map((creator) => {
                    const userData = creator.users_extended;
                    const portfolioImages = creator.portfolio_images || [];
                    
                    return (
                      <Card 
                        key={creator.id} 
                        className="overflow-hidden hover:shadow-xl transition-all cursor-pointer border-2 border-primary/20"
                      >
                        <div className="relative aspect-square bg-muted">
                          {portfolioImages[0] ? (
                            <img
                              src={portfolioImages[0].url}
                              alt="Portfolio"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Avatar className="w-24 h-24">
                                <AvatarImage src={creator.avatar_url || undefined} />
                                <AvatarFallback className="text-2xl">
                                  {userData?.name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                          
                          {/* Rank Badge */}
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-lg px-3 py-1">
                              <Trophy className="w-4 h-4 mr-1" />
                              #{creator.rank}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-xl mb-1">{userData?.name}</h3>
                              {userData?.city && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {userData.city}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Styles */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {creator.styles?.slice(0, 3).map((style: string) => (
                              <Badge key={style} variant="secondary" className="text-xs">
                                {getStyleLabel(style)}
                              </Badge>
                            ))}
                          </div>

                          {/* Views */}
                          <div className="flex items-center gap-1 text-primary mb-3">
                            <Eye className="w-4 h-4" />
                            <span className="font-semibold">{formatViews(creator.unique_views)} views</span>
                          </div>

                          {/* Portfolio Preview */}
                          {portfolioImages.length > 1 && (
                            <div className="grid grid-cols-3 gap-1 mb-3">
                              {portfolioImages.slice(0, 3).map((img: any, idx: number) => (
                                <div key={idx} className="aspect-square bg-muted rounded overflow-hidden">
                                  <img
                                    src={img.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <Button 
                            variant="default" 
                            className="w-full"
                            onClick={() => navigate(`/p/${userData?.slug}`)}
                          >
                            View Profile
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div>
              <h2 className="text-2xl font-bold mb-4">All Rankings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creators.map((creator) => {
                  const userData = creator.users_extended;
                  const portfolioImages = creator.portfolio_images || [];
                  
                  return (
                    <Card 
                      key={creator.id} 
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/p/${userData?.slug}`)}
                    >
                      <div className="relative aspect-video bg-muted">
                        {portfolioImages[0] ? (
                          <img
                            src={portfolioImages[0].url}
                            alt="Portfolio"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={creator.avatar_url || undefined} />
                              <AvatarFallback className="text-xl">
                                {userData?.name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        
                        {/* Rank Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="font-bold">
                            #{creator.rank}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-bold mb-1">{userData?.name}</h3>
                        {userData?.city && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="w-3 h-3" />
                            {userData.city}
                          </p>
                        )}

                        {/* Styles */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {creator.styles?.slice(0, 2).map((style: string) => (
                            <Badge key={style} variant="outline" className="text-xs">
                              {getStyleLabel(style)}
                            </Badge>
                          ))}
                        </div>

                        {/* Views */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            <span>{formatViews(creator.unique_views)} views</span>
                          </div>
                          
                          {/* Portfolio thumbs */}
                          {portfolioImages.length > 1 && (
                            <div className="flex gap-1">
                              {portfolioImages.slice(0, 3).map((img: any, idx: number) => (
                                <div key={idx} className="w-8 h-8 bg-muted rounded overflow-hidden">
                                  <img
                                    src={img.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Showcase;
