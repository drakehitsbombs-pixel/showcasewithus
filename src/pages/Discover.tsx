import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { STYLE_OPTIONS, getStyleLabel } from "@/lib/constants";
import Footer from "@/components/Footer";

const Discover = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [searchFilters, setSearchFilters] = useState({
    styles: [] as string[],
    distance: 100,
    budgetMinimum: 0,
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
        .select("*")
        .eq("is_discoverable", true)
        .eq("public_profile", true)
        .eq("status", "published")
        .order("showcase_score", { ascending: false })
        .limit(50);

      // Apply style filter
      if (searchFilters.styles.length > 0) {
        query = query.overlaps("styles", searchFilters.styles);
      }

      // Apply budget filter: show photographers whose minimum is at or below the selected budget
      if (searchFilters.budgetMinimum > 0) {
        query = query.lte("min_project_budget_usd", searchFilters.budgetMinimum);
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
      budgetMinimum: 0,
    });
  };

  const renderCreatorCard = (creator: any, index: number) => {
    const displayName = creator.display_name || "Photographer";
    const displaySlug = creator.slug;
    const coverImage = creator.avatar_url;
    const styles = creator.styles || [];
    const extraTagsCount = styles.length > 3 ? styles.length - 3 : 0;
    
    return (
      <Card 
        key={creator.id} 
        className="overflow-hidden hover:shadow-elevated transition-smooth cursor-pointer"
        onClick={() => displaySlug && navigate(`/p/${displaySlug}`)}
        role="link"
        aria-label={`Open ${displayName}'s profile`}
      >
        <div className="aspect-square bg-muted relative">
          <img
            src={coverImage || '/img/placeholder-photo.jpg'}
            alt={`${displayName} portfolio cover`}
            className="w-full h-full object-cover"
            loading={index < 3 ? "eager" : "lazy"}
            decoding="async"
            width={600}
            height={450}
            fetchPriority={index < 3 ? "high" : undefined}
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1">{displayName}</h3>
          {creator.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3" />
              {creator.city}
            </p>
          )}
          {styles.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {styles.slice(0, 3).map((style: string) => (
                <Badge key={style} variant="secondary" className="text-xs">
                  {getStyleLabel(style)}
                </Badge>
              ))}
              {extraTagsCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{extraTagsCount} more
                </Badge>
              )}
            </div>
          )}
          {creator.min_project_budget_usd > 0 && (
            <p className="text-sm font-semibold text-primary">
              Minimum project ${creator.min_project_budget_usd.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <title>Discover Photographers | ShowCase</title>
        <meta name="description" content="Browse local photographers by style and budget. No account required." />
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
                  <Label className="text-sm font-medium mb-2 block">Budget ≥</Label>
                  <select
                    className="w-full p-2 border border-input rounded-md bg-background"
                    value={searchFilters.budgetMinimum}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, budgetMinimum: Number(e.target.value) }))}
                  >
                    <option value={0}>Any Budget</option>
                    <option value={100}>$100+</option>
                    <option value={250}>$250+</option>
                    <option value={500}>$500+</option>
                    <option value={1000}>$1,000+</option>
                    <option value={2000}>$2,000+</option>
                    <option value={5000}>$5,000+</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Show photographers with minimum project budget at or below this amount
                  </p>
                </div>

                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : creators.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {creators.slice(0, 6).map((creator, index) => renderCreatorCard(creator, index))}
                </div>

                {/* Remaining photographers */}
                {creators.length > 6 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                    {creators.slice(6).map((creator, index) => renderCreatorCard(creator, index + 6))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground mb-2">No photographers match those filters</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Try clearing filters or widening your budget
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
