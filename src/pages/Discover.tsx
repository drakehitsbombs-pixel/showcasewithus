import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sliders, Grid3X3, Map as MapIcon, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { STYLE_OPTIONS, getStyleLabel, BUDGET_STEPS, formatBudget } from "@/lib/constants";
import Footer from "@/components/Footer";
import DiscoverMap from "@/components/DiscoverMap";

const Discover = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    styles: [] as string[],
    distance: 50,
    budgetMinimum: 0,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const navigate = useNavigate();

  // Hydrate from URL on mount
  useEffect(() => {
    const stylesParam = searchParams.get("styles");
    const distanceParam = searchParams.get("maxMi");
    const budgetParam = searchParams.get("minBudget");
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    
    setSearchFilters(prev => ({
      ...prev,
      styles: stylesParam ? stylesParam.split(",") : [],
      distance: distanceParam ? Number(distanceParam) : 50,
      budgetMinimum: budgetParam ? Number(budgetParam) : 0,
    }));

    if (lat && lon) {
      setUserLocation({ lat: Number(lat), lon: Number(lon) });
    }
  }, []);

  // Request user location
  useEffect(() => {
    if (!userLocation && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // User denied location - that's fine
        }
      );
    }
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const loadCreators = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("creator_profiles")
        .select(`
          *,
          users_extended!inner(geo_lat, geo_lng, city)
        `)
        .eq("is_discoverable", true)
        .eq("public_profile", true)
        .eq("status", "published")
        .order("showcase_score", { ascending: false })
        .limit(100);

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
      
      let results = data || [];

      // Apply distance filter client-side if user has location
      if (userLocation && searchFilters.distance > 0) {
        results = results.filter((creator: any) => {
          const creatorLat = creator.users_extended?.geo_lat;
          const creatorLon = creator.users_extended?.geo_lng;
          
          // If creator has no location, include them
          if (!creatorLat || !creatorLon) return true;
          
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lon,
            creatorLat,
            creatorLon
          );
          
          return distance <= searchFilters.distance;
        });
      }

      setCreators(results.slice(0, 50));
    } catch (error) {
      console.error("Error loading creators:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Write to URL
    const params = new URLSearchParams();
    if (searchFilters.styles.length > 0) {
      params.set('styles', searchFilters.styles.join(','));
    }
    if (searchFilters.distance !== 50) {
      params.set('maxMi', String(searchFilters.distance));
    }
    if (searchFilters.budgetMinimum > 0) {
      params.set('minBudget', String(searchFilters.budgetMinimum));
    }
    if (userLocation) {
      params.set('lat', String(userLocation.lat));
      params.set('lon', String(userLocation.lon));
    }
    setSearchParams(params, { replace: true });

    const timeoutId = setTimeout(() => {
      loadCreators();
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [searchFilters, userLocation]);

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
      distance: 50,
      budgetMinimum: 0,
    });
    setSearchParams({}, { replace: true });
  };

  const renderCreatorCard = (creator: any, index: number) => {
    const displayName = creator.display_name || "Photographer";
    const displaySlug = creator.slug;
    const coverImage = creator.avatar_url;
    const styles = creator.styles || [];
    const extraTagsCount = styles.length > 3 ? styles.length - 3 : 0;
    
    return (
      <div
        key={creator.id} 
        className="cp-card overflow-hidden cursor-pointer"
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
        <div className="p-6">
          <h3 className="font-bold text-lg mb-2">{displayName}</h3>
          {creator.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
              <MapPin className="w-3 h-3" />
              {creator.city}
            </p>
          )}
          {styles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {styles.slice(0, 3).map((style: string) => (
                <span key={style} className="cp-chip text-xs">
                  {getStyleLabel(style)}
                </span>
              ))}
              {extraTagsCount > 0 && (
                <span className="cp-chip text-xs">
                  +{extraTagsCount} more
                </span>
              )}
            </div>
          )}
          {creator.min_project_budget_usd > 0 && (
            <p className="text-sm font-semibold text-primary">
              Minimum project ${creator.min_project_budget_usd.toLocaleString()}
            </p>
          )}
        </div>
      </div>
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
      <header className="sticky top-0 z-50 nav-blur">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
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
            <Button asChild className="bg-primary hover:brightness-90">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 section">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Discover Photographers</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse talented photographers in your area
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="cp-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4" />
                <h3 className="font-semibold">Filters</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="filter-label">Styles</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.id}
                        className={`filter-pill ${
                          searchFilters.styles.includes(style.id) ? 'active' : ''
                        }`}
                        onClick={() => toggleStyle(style.id)}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="filter-label">
                    Distance: {searchFilters.distance} mi
                  </Label>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={searchFilters.distance}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, distance: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {userLocation 
                      ? 'Showing photographers within selected distance' 
                      : 'Enable location to filter by distance'}
                  </p>
                </div>

                <div>
                  <Label className="filter-label">Maximum Budget</Label>
                  <select
                    className="w-full p-2 border border-input rounded-lg bg-background text-sm"
                    value={searchFilters.budgetMinimum}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, budgetMinimum: Number(e.target.value) }))}
                  >
                    {BUDGET_STEPS.map((value) => (
                      <option key={value} value={value}>
                        {value === 0 ? 'Any Budget' : `Up to ${formatBudget(value)}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Show photographers you can afford with this budget
                  </p>
                </div>

                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-lg p-1 bg-muted/20">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="gap-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="gap-2"
                  >
                    <MapIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Map</span>
                  </Button>
                </div>
              </div>
              {(searchFilters.styles.length > 0 || searchFilters.distance < 50 || searchFilters.budgetMinimum > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>

            {viewMode === 'grid' ? (
              loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="cp-card overflow-hidden">
                      <Skeleton className="aspect-square w-full" />
                      <div className="p-6 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : creators.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {creators.slice(0, 6).map((creator, index) => renderCreatorCard(creator, index))}
                  </div>

                  {/* Remaining photographers */}
                  {creators.length > 6 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-8">
                      {creators.slice(6).map((creator, index) => renderCreatorCard(creator, index + 6))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-24">
                  <p className="text-lg text-foreground mb-2">No photographers match those filters</p>
                  <p className="text-sm text-muted-foreground mb-8">
                    Try clearing filters or widening your budget
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="border-primary text-primary hover:bg-primary/5">
                    Clear Filters
                  </Button>
                </div>
              )
            ) : (
              <div className="h-[600px] rounded-lg overflow-hidden border bg-card">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse text-muted-foreground">Loading map...</div>
                  </div>
                ) : (
                  <DiscoverMap
                    creators={creators.map(c => ({
                      ...c,
                      geo_lat: c.users_extended?.geo_lat || null,
                      geo_lng: c.users_extended?.geo_lng || null,
                      city: c.users_extended?.city || null,
                    }))}
                    userLocation={userLocation ? { lat: userLocation.lat, lng: userLocation.lon } : null}
                    onMarkerClick={(creator) => {
                      navigate(`/creator/${creator.slug || `id/${creator.user_id}`}`);
                    }}
                  />
                )}
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
