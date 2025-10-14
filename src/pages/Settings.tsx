import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { STYLE_OPTIONS, isValidStyleId } from "@/lib/constants";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Settings state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [priceLow, setPriceLow] = useState(500);
  const [priceHigh, setPriceHigh] = useState(5000);
  const [city, setCity] = useState("");
  const [travelRadius, setTravelRadius] = useState(50);
  const [styles, setStyles] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: userData } = await supabase
      .from("users_extended")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setUserId(session.user.id);
    setUserRole(userData?.role || null);
    setName(userData?.name || "");
    setEmail(userData?.email || session.user.email || "");
    setCity(userData?.city || "");
    await loadSettings(session.user.id, userData?.role);
  };

  const loadSettings = async (uid: string, role: string | null) => {
    try {
      if (role === "creator") {
        const { data: profile, error } = await supabase
          .from("creator_profiles")
          .select("*")
          .eq("user_id", uid)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (!profile) {
          // Create default profile if none exists
          const { data: newProfile, error: insertError } = await supabase
            .from("creator_profiles")
            .insert({
              user_id: uid,
              price_band_low: 500,
              price_band_high: 5000,
              travel_radius_km: 50,
              styles: [],
            })
            .select()
            .single();

          if (insertError) throw insertError;
          
          if (newProfile) {
            setPriceLow(newProfile.price_band_low || 500);
            setPriceHigh(newProfile.price_band_high || 5000);
            setTravelRadius(newProfile.travel_radius_km || 50);
            setStyles(newProfile.styles || []);
          }
        } else {
          setPriceLow(profile.price_band_low || 500);
          setPriceHigh(profile.price_band_high || 5000);
          setTravelRadius(profile.travel_radius_km || 50);
          setStyles(profile.styles || []);
        }
      } else {
        // Load client preferences
        const { data: brief } = await supabase
          .from("client_briefs")
          .select("*")
          .eq("client_user_id", uid)
          .maybeSingle();

        if (brief) {
          setStyles(brief.mood_tags || []);
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const toggleStyle = (styleId: string) => {
    setStyles(prev =>
      prev.includes(styleId)
        ? prev.filter(s => s !== styleId)
        : [...prev, styleId]
    );
  };

  const handleSave = async () => {
    if (!userId) return;

    // Normalize and validate styles
    const normalizedStyles = styles.map(s => s.toLowerCase().trim());
    const invalidStyles = normalizedStyles.filter(s => !isValidStyleId(s));
    
    if (invalidStyles.length > 0) {
      toast.error(`Invalid style(s): ${invalidStyles.join(", ")}`);
      return;
    }

    if (normalizedStyles.length === 0) {
      toast.error("Please select at least one style");
      return;
    }

    setSaving(true);
    console.log("Saving settings:", {
      user_id: userId,
      role: userRole,
      styles_before: styles,
      styles_after: normalizedStyles,
    });

    try {
      // Update user basic info
      const { error: userError } = await supabase
        .from("users_extended")
        .update({ 
          name,
          city 
        })
        .eq("id", userId);

      if (userError) throw userError;

      if (userRole === "creator") {
        // Validation for creators
        if (priceLow >= priceHigh) {
          toast.error("Minimum price must be less than maximum price");
          setSaving(false);
          return;
        }

        // Update creator profile
        const { error: profileError } = await supabase
          .from("creator_profiles")
          .upsert({
            user_id: userId,
            price_band_low: priceLow,
            price_band_high: priceHigh,
            travel_radius_km: travelRadius,
            styles: normalizedStyles,
          });

        if (profileError) throw profileError;
      } else {
        // Update client preferences
        const { error: briefError } = await supabase
          .from("client_briefs")
          .upsert({
            client_user_id: userId,
            mood_tags: normalizedStyles,
            project_type: "wedding", // default
          });

        if (briefError) throw briefError;
      }

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  const isCreator = userRole === "creator";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold ml-4">Settings</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="styles">Styles</TabsTrigger>
            {isCreator && <TabsTrigger value="pricing">Pricing</TabsTrigger>}
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (read-only)</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Location & Distance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco, CA"
                  />
                </div>
                {isCreator && (
                  <div>
                    <Label>Travel Radius: {travelRadius} km</Label>
                    <Slider
                      value={[travelRadius]}
                      onValueChange={(value) => setTravelRadius(value[0])}
                      max={200}
                      step={10}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      How far are you willing to travel for shoots?
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="styles">
            <Card>
              <CardHeader>
                <CardTitle>{isCreator ? "Photography Styles" : "Preferred Styles"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Select all that apply</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {STYLE_OPTIONS.map((style) => (
                      <Badge
                        key={style.id}
                        variant={styles.includes(style.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleStyle(style.id)}
                      >
                        {style.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isCreator && (
            <TabsContent value="pricing">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Price Range</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      ${priceLow} - ${priceHigh}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price-low">Minimum ($)</Label>
                        <Input
                          id="price-low"
                          type="number"
                          value={priceLow}
                          onChange={(e) => setPriceLow(Number(e.target.value))}
                          min={0}
                        />
                      </div>
                      <div>
                        <Label htmlFor="price-high">Maximum ($)</Label>
                        <Input
                          id="price-high"
                          type="number"
                          value={priceHigh}
                          onChange={(e) => setPriceHigh(Number(e.target.value))}
                          min={priceLow}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
