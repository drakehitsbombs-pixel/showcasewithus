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
  const [city, setCity] = useState("");
  const [travelRadius, setTravelRadius] = useState(50);
  const [styles, setStyles] = useState<string[]>([]);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showPriceRange, setShowPriceRange] = useState(true);
  const [emailPublic, setEmailPublic] = useState(true);
  const [phonePublic, setPhonePublic] = useState(true);

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

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    setUserId(session.user.id);
    setUserRole(roleData?.role || null);
    setName(userData?.name || "");
    setEmail(userData?.email || session.user.email || "");
    setCity(userData?.city || "");
    await loadSettings(session.user.id, roleData?.role);
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
              min_project_budget_usd: 500,
              travel_radius_km: 50,
              styles: [],
            })
            .select()
            .single();

          if (insertError) throw insertError;
          
          if (newProfile) {
            setPriceLow(newProfile.min_project_budget_usd || 500);
            setTravelRadius(newProfile.travel_radius_km || 50);
            setStyles(newProfile.styles || []);
          }
        } else {
          setPriceLow(profile.min_project_budget_usd || 500);
          setTravelRadius(profile.travel_radius_km || 50);
          setStyles(profile.styles || []);
          setPublicProfile(profile.public_profile ?? true);
          setShowPriceRange(profile.show_price_range ?? true);
          setEmailPublic(profile.email_public ?? true);
          setPhonePublic(profile.phone_public ?? true);
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
        // Update creator profile
        const { error: profileError } = await supabase
          .from("creator_profiles")
          .upsert({
            user_id: userId,
            min_project_budget_usd: priceLow,
            travel_radius_km: travelRadius,
            styles: normalizedStyles,
            public_profile: publicProfile,
            show_price_range: showPriceRange,
            email_public: emailPublic,
            phone_public: phonePublic,
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="styles">Styles</TabsTrigger>
            {isCreator && <TabsTrigger value="pricing">Pricing</TabsTrigger>}
            {isCreator && <TabsTrigger value="privacy">Privacy</TabsTrigger>}
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
                    <Label>Travel Radius: {Math.round(travelRadius * 0.621371)} miles</Label>
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
                    <Label>Minimum Project Budget</Label>
                    <Input
                      id="min-budget"
                      type="number"
                      value={priceLow}
                      onChange={(e) => setPriceLow(Number(e.target.value))}
                      min={0}
                      step={50}
                      placeholder="500"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      We book projects starting at this amount
                    </p>
                    {priceLow > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                        Preview: <span className="font-semibold">Project rates from ${priceLow}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isCreator && (
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Visibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="public-profile">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anyone to view your profile without signing in
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      id="public-profile"
                      checked={publicProfile}
                      onChange={(e) => setPublicProfile(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="show-price">Show Price Range</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your pricing on your public profile
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      id="show-price"
                      checked={showPriceRange}
                      onChange={(e) => setShowPriceRange(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="email-public">Show Email Publicly</Label>
                      <p className="text-sm text-muted-foreground">
                        Display email contact button on your public profile
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      id="email-public"
                      checked={emailPublic}
                      onChange={(e) => setEmailPublic(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="phone-public">Show Phone Publicly</Label>
                      <p className="text-sm text-muted-foreground">
                        Display phone contact button on your public profile
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      id="phone-public"
                      checked={phonePublic}
                      onChange={(e) => setPhonePublic(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  {!publicProfile && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Your profile is private. Turn on 'Public profile' in Settings to share your work.
                      </p>
                    </div>
                  )}
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
