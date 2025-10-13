import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, DollarSign, Star, Waves } from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";

const Surfing = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurfCreators();
  }, []);

  const loadSurfCreators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select(`
          *,
          user:users_extended!creator_profiles_user_id_fkey(name, city)
        `)
        .eq("is_discoverable", true)
        .contains("styles", ["Surfing"])
        .order("rating_avg", { ascending: false, nullsFirst: false })
        .limit(24);

      if (error) throw error;

      setCreators(data || []);
    } catch (error) {
      console.error("Error loading surf creators:", error);
      toast.error("Failed to load photographers");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (creator: any) => {
    navigate(`/creator/id/${creator.user_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p>Loading surf photographers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Waves className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Surf Photography</h1>
          </div>
          <p className="text-lg opacity-90 max-w-2xl">
            Discover talented surf photographers capturing the energy and beauty of the ocean
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {creators.length === 0 ? (
          <Card className="p-12 text-center">
            <Waves className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-2">No surf photographers found</p>
            <p className="text-sm text-muted-foreground">Check back soon for more talent</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <Card
                key={creator.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleViewProfile(creator)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={creator.avatar_url || undefined} />
                      <AvatarFallback>
                        {creator.user?.name?.charAt(0)?.toUpperCase() || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {creator.user?.name || "Photographer"}
                      </h3>
                      {creator.user?.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {creator.user.city}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {creator.styles?.slice(0, 3).map((style: string) => (
                      <Badge key={style} variant="secondary" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-4">
                    {creator.price_band_low && creator.price_band_high && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${creator.price_band_low} - ${creator.price_band_high}</span>
                      </div>
                    )}
                    {creator.rating_avg !== null && creator.review_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{creator.rating_avg.toFixed(1)}</span>
                        <span className="text-muted-foreground">({creator.review_count})</span>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" className="w-full">
                    View Profile
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Surfing;
