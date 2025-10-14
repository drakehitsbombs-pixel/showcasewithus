import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, DollarSign, Zap } from "lucide-react";
import Navigation from "@/components/Navigation";
import { getStyleLabel } from "@/lib/constants";

const Showcase = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTopCreators();
  }, []);

  const loadTopCreators = async () => {
    try {
      // Query top creators by engagement metrics
      const { data, error } = await supabase
        .from("creator_profiles")
        .select(`
          *,
          users_extended!inner(name, city, bio)
        `)
        .not("price_band_low", "is", null)
        .order("rating_avg", { ascending: false, nullsFirst: false })
        .order("review_count", { ascending: false, nullsFirst: false })
        .limit(24);

      if (error) throw error;
      
      // Load portfolio images separately for each creator
      const creatorsWithPortfolio = await Promise.all(
        (data || []).map(async (creator) => {
          const { data: portfolio } = await supabase
            .from("portfolio_images")
            .select("url")
            .eq("creator_user_id", creator.user_id)
            .limit(4);
          
          return { ...creator, portfolio_images: portfolio || [] };
        })
      );
      
      setCreators(creatorsWithPortfolio);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Top Creators</h1>
          <p className="text-muted-foreground">
            Discover the highest-rated photographers on Show Case
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator, index) => {
            const userData = creator.users_extended;
            const portfolioImages = creator.portfolio_images || [];
            const isTopTen = index < 10;
            const isFastResponder = false; // TODO: Add response_rate metric
            const isHighlyRated = (creator.rating_avg || 0) >= 4.8 && (creator.review_count || 0) >= 5;

            return (
              <Card 
                key={creator.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/creator/id/${creator.user_id}`)}
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
                  
                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {isTopTen && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                        Top 10%
                      </Badge>
                    )}
                    {isHighlyRated && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                        <Star className="w-3 h-3 mr-1" />
                        5★
                      </Badge>
                    )}
                    {isFastResponder && (
                      <Badge variant="secondary">
                        <Zap className="w-3 h-3 mr-1" />
                        Fast
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{userData?.name}</h3>
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
                    {creator.styles?.slice(0, 2).map((style: string) => (
                      <Badge key={style} variant="outline" className="text-xs">
                        {getStyleLabel(style)}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm mb-3">
                    {creator.price_band_low && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        <span>${creator.price_band_low}-${creator.price_band_high}</span>
                      </div>
                    )}
                    {creator.rating_avg && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{creator.rating_avg.toFixed(1)}</span>
                        <span className="text-muted-foreground">({creator.review_count})</span>
                      </div>
                    )}
                  </div>

                  {/* Portfolio Grid */}
                  {portfolioImages.length > 1 && (
                    <div className="grid grid-cols-3 gap-1 mb-3">
                      {portfolioImages.slice(1, 4).map((img: any, idx: number) => (
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
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/creator/id/${creator.user_id}`);
                    }}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {creators.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No creators to showcase yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Showcase;
