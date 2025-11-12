import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search as SearchIcon, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { STYLE_OPTIONS, getStyleLabel } from "@/lib/constants";
import Footer from "@/components/Footer";

const Discover = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [searchFilters, setSearchFilters] = useState({
    styles: [] as string[],
    distance: 100,
    budgetMin: 0,
    budgetMax: 10000,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const stylesParam = searchParams.get("styles");
    if (stylesParam) {
      setSearchFilters(prev => ({
        ...prev,
        styles: stylesParam.split(","),
      }));
    }
  }, [searchParams]);

  const loadCreators = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("creator_profiles")
        .select(`
          *,
          users_extended!creator_profiles_user_id_fkey(id, name, city, slug, bio),
          portfolio_images(url)
        `)
        .eq("is_discoverable", true)
        .eq("public_profile", true)
        .order("showcase_score", { ascending: false })
        .limit(50);

      // Apply style filter
      if (searchFilters.styles.length > 0) {
        query = query.overlaps("styles", searchFilters.styles);
      }

      // Apply budget filter only if user has adjusted from defaults
      if (searchFilters.budgetMin > 0 || searchFilters.budgetMax < 10000) {
        // Show profiles within budget OR with no price set
        query = query.or(
          `and(price_band_low.gte.${searchFilters.budgetMin},price_band_high.lte.${searchFilters.budgetMax}),price_band_low.is.null,price_band_high.is.null`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error("Error loading creators:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCreators();
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [searchFilters]);

  const toggleStyle = (style: string) => {
    setSearchFilters(prev => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter(s => s !== style)
        : [...prev.styles, style]
    }));
  };

  const clearFilters = () => {
    setSearchFilters({
      styles: [],
      distance: 100,
      budgetMin: 0,
      budgetMax: 10000,
    });
  };

  return (
    <>
      <Helmet>
        <script>
          {`(adsbygoogle = window.adsbygoogle || []).push({});`}
        </script>
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border py-4 ad-exclude-header">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/">
            <h1 className="text-2xl font-bold">ShowCase</h1>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/showcase">Showcase</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/help">Help</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Photographers</h1>
          <p className="text-muted-foreground">
            Browse talented photographers in your area
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-4 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4" />
                <h3 className="font-semibold">Filters</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Styles</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((style) => (
                      <Badge
                        key={style.id}
                        variant={searchFilters.styles.includes(style.id) ? "default" : "outline"}
                        className="cursor-pointer transition-smooth"
                        onClick={() => toggleStyle(style.id)}
                      >
                        {style.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Budget Range</Label>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Min: ${searchFilters.budgetMin}</Label>
                      <Slider
                        value={[searchFilters.budgetMin]}
                        onValueChange={([value]) => setSearchFilters(prev => ({ ...prev, budgetMin: value }))}
                        min={0}
                        max={10000}
                        step={100}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max: ${searchFilters.budgetMax}</Label>
                      <Slider
                        value={[searchFilters.budgetMax]}
                        onValueChange={([value]) => setSearchFilters(prev => ({ ...prev, budgetMax: value }))}
                        min={0}
                        max={10000}
                        step={100}
                      />
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Loading photographers...</p>
              </div>
            ) : creators.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {creators.slice(0, 6).map((creator) => {
                    const user = creator.users_extended;
                    const coverImage = creator.portfolio_images?.[0]?.url || user?.avatar_url;
                    
                    return (
                      <Card 
                        key={creator.id} 
                        className="overflow-hidden hover:shadow-elevated transition-smooth cursor-pointer"
                        onClick={() => navigate(`/p/${user?.slug}`)}
                      >
                        <div className="aspect-square bg-muted relative">
                          {coverImage && (
                            <img
                              src={coverImage}
                              alt={user?.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-1">{user?.name}</h3>
                          {user?.city && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                              <MapPin className="w-3 h-3" />
                              {user.city}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {creator.styles?.slice(0, 3).map((style: string) => (
                              <Badge key={style} variant="secondary" className="text-xs">
                                {getStyleLabel(style)}
                              </Badge>
                            ))}
                          </div>
                          {creator.price_band_low && (
                            <p className="text-sm font-semibold text-primary">
                              Starting at ${creator.price_band_low}/hr
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Manual Ad Banner after first row */}
                {creators.length > 6 && (
                  <div className="ad-manual-banner">
                    <ins 
                      className="adsbygoogle"
                      style={{ display: 'block', margin: '24px 0' }}
                      data-ad-client="ca-pub-8904686344566128"
                      data-ad-slot="0000000000"
                      data-ad-format="auto"
                      data-full-width-responsive="true"
                    />
                  </div>
                )}

                {/* Remaining photographers */}
                {creators.length > 6 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {creators.slice(6).map((creator) => {
                      const user = creator.users_extended;
                      const coverImage = creator.portfolio_images?.[0]?.url || user?.avatar_url;
                      
                      return (
                        <Card 
                          key={creator.id} 
                          className="overflow-hidden hover:shadow-elevated transition-smooth cursor-pointer"
                          onClick={() => navigate(`/p/${user?.slug}`)}
                        >
                          <div className="aspect-square bg-muted relative">
                            {coverImage && (
                              <img
                                src={coverImage}
                                alt={user?.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-1">{user?.name}</h3>
                            {user?.city && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                <MapPin className="w-3 h-3" />
                                {user.city}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {creator.styles?.slice(0, 3).map((style: string) => (
                                <Badge key={style} variant="secondary" className="text-xs">
                                  {getStyleLabel(style)}
                                </Badge>
                              ))}
                            </div>
                            {creator.price_band_low && (
                              <p className="text-sm font-semibold text-primary">
                                Starting at ${creator.price_band_low}/hr
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">No photographers found</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Try adjusting your filters
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default Discover;
