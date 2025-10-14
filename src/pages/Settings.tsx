import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, MapPin, Camera, Navigation as NavigationIcon, X } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { STYLE_OPTIONS } from "@/lib/constants";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Settings state
  const [priceLow, setPriceLow] = useState<number>(100);
  const [priceHigh, setPriceHigh] = useState<number>(500);
  const [city, setCity] = useState("");
  const [travelRadius, setTravelRadius] = useState([50]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUserId(session.user.id);
    loadSettings(session.user.id);
  };

  const loadSettings = async (uid: string) => {
    try {
      const { data: profile } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", uid)
        .single();

      if (profile) {
        setPriceLow(profile.price_band_low || 100);
        setPriceHigh(profile.price_band_high || 500);
        setTravelRadius([profile.travel_radius_km || 50]);
        setSelectedStyles(profile.styles || []);
      }

      const { data: user } = await supabase
        .from("users_extended")
        .select("city")
        .eq("id", uid)
        .single();

      if (user?.city) setCity(user.city);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleSave = async () => {
    if (!userId) return;

    if (priceLow >= priceHigh) {
      toast.error("Minimum price must be less than maximum price");
      return;
    }

    if (selectedStyles.length === 0) {
      toast.error("Please select at least one photography style");
      return;
    }

    // Validate all style IDs
    const invalidStyles = selectedStyles.filter(style => !STYLE_OPTIONS.some(s => s.id === style));
    if (invalidStyles.length > 0) {
      toast.error(`Invalid style(s): ${invalidStyles.join(", ")}`);
      console.error("Invalid styles:", invalidStyles);
      return;
    }

    // Normalize to lowercase
    const normalizedStyles = selectedStyles.map(s => s.toLowerCase());

    setSaving(true);
    try {
      // Update creator profile and get fresh data
      const { data: updatedProfile, error: profileError } = await supabase
        .from("creator_profiles")
        .update({
          price_band_low: priceLow,
          price_band_high: priceHigh,
          travel_radius_km: travelRadius[0],
          styles: normalizedStyles,
        })
        .eq("user_id", userId)
        .select("styles")
        .single();

      if (profileError) throw profileError;

      // Update city in users_extended
      const { error: userError } = await supabase
        .from("users_extended")
        .update({ city })
        .eq("id", userId);

      if (userError) throw userError;

      // Log the save
      console.log("Settings saved:", {
        user_id: userId,
        styles: normalizedStyles,
      });

      // Confirm the styles were saved
      if (updatedProfile?.styles) {
        setSelectedStyles(updatedProfile.styles);
      }

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
              <CardDescription>Set your price range for photography services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-low">Minimum Price ($)</Label>
                  <Input
                    id="price-low"
                    type="number"
                    value={priceLow}
                    onChange={(e) => setPriceLow(Number(e.target.value))}
                    min={0}
                    step={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-high">Maximum Price ($)</Label>
                  <Input
                    id="price-high"
                    type="number"
                    value={priceHigh}
                    onChange={(e) => setPriceHigh(Number(e.target.value))}
                    min={priceLow + 50}
                    step={50}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your pricing range: ${priceLow} - ${priceHigh}
              </p>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
              <CardDescription>Set your base location and service area</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
            </CardContent>
          </Card>

          {/* Travel Radius */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NavigationIcon className="h-5 w-5" />
                Travel Radius
              </CardTitle>
              <CardDescription>How far are you willing to travel for shoots?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Travel Distance</Label>
                  <span className="text-sm font-medium">{travelRadius[0]} km</span>
                </div>
                <Slider
                  value={travelRadius}
                  onValueChange={setTravelRadius}
                  min={5}
                  max={200}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Clients within {travelRadius[0]}km of your location will see you in their searches
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Photography Styles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photography Styles
              </CardTitle>
              <CardDescription>Select the types of photography you specialize in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((style) => (
                  <Badge
                    key={style.id}
                    variant={selectedStyles.includes(style.id) ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleStyle(style.id)}
                  >
                    {style.label}
                    {selectedStyles.includes(style.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Selected: {selectedStyles.length} {selectedStyles.length === 1 ? "style" : "styles"}
              </p>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
