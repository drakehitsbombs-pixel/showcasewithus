import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { STYLE_OPTIONS, getStyleLabel } from "@/lib/constants";

const MeEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    name: "",
    city: "",
    bio: "",
    avatar_url: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      const { data: userData } = await supabase
        .from("users_extended")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUserRole(userData?.role);

      if (userData?.role === "creator") {
        const { data: creatorProfile } = await supabase
          .from("creator_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        setFormData({
          name: userData.name || "",
          city: userData.city || "",
          bio: userData.bio || "",
          avatar_url: userData.avatar_url || "",
          price_band_low: creatorProfile?.price_band_low || 500,
          price_band_high: creatorProfile?.price_band_high || 5000,
          travel_radius_km: creatorProfile?.travel_radius_km || 50,
          styles: creatorProfile?.styles || [],
        });
      } else {
        const { data: clientBrief } = await supabase
          .from("client_briefs")
          .select("*")
          .eq("client_user_id", session.user.id)
          .maybeSingle();

        setFormData({
          name: userData.name || "",
          city: userData.city || "",
          bio: userData.bio || "",
          avatar_url: userData.avatar_url || "",
          budget_low: clientBrief?.budget_low || 500,
          budget_high: clientBrief?.budget_high || 3000,
          preferred_styles: clientBrief?.mood_tags || [],
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userId) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setFormData((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar uploaded!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      // Update users_extended
      const { error: userError } = await supabase
        .from("users_extended")
        .update({
          name: formData.name,
          city: formData.city,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
        })
        .eq("id", userId);

      if (userError) throw userError;

      if (userRole === "creator") {
        // Update or create creator profile
        const { error: profileError } = await supabase
          .from("creator_profiles")
          .upsert({
            user_id: userId,
            price_band_low: formData.price_band_low,
            price_band_high: formData.price_band_high,
            travel_radius_km: formData.travel_radius_km,
            styles: formData.styles,
          });

        if (profileError) throw profileError;
      } else {
        // Update or create client brief
        const { error: briefError } = await supabase
          .from("client_briefs")
          .upsert({
            client_user_id: userId,
            budget_low: formData.budget_low,
            budget_high: formData.budget_high,
            mood_tags: formData.preferred_styles,
            project_type: "wedding", // default
          });

        if (briefError) throw briefError;
      }

      toast.success("Profile updated!");
      navigate("/me");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleStyle = (styleId: string) => {
    const key = userRole === "creator" ? "styles" : "preferred_styles";
    setFormData((prev: any) => ({
      ...prev,
      [key]: prev[key].includes(styleId)
        ? prev[key].filter((s: string) => s !== styleId)
        : [...prev[key], styleId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const isCreator = userRole === "creator";
  const selectedStyles = isCreator ? formData.styles : formData.preferred_styles;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={formData.avatar_url} alt={formData.name} />
                  <AvatarFallback className="text-3xl">
                    {formData.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-5 w-5" />
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </div>
              {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, city: e.target.value }))}
                placeholder="Your city"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            {isCreator ? (
              <>
                <div>
                  <Label>Price Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      value={formData.price_band_low}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, price_band_low: parseInt(e.target.value) || 0 }))}
                      min={0}
                    />
                    <Input
                      type="number"
                      value={formData.price_band_high}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, price_band_high: parseInt(e.target.value) || 0 }))}
                      min={formData.price_band_low}
                    />
                  </div>
                </div>

                <div>
                  <Label>Travel Radius: {formData.travel_radius_km} km</Label>
                  <Slider
                    value={[formData.travel_radius_km]}
                    onValueChange={(value) => setFormData((prev: any) => ({ ...prev, travel_radius_km: value[0] }))}
                    max={200}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label>Budget Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    value={formData.budget_low}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, budget_low: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                  <Input
                    type="number"
                    value={formData.budget_high}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, budget_high: parseInt(e.target.value) || 0 }))}
                    min={formData.budget_low}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>{isCreator ? "Photography Styles" : "Preferred Styles"}</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select all that apply
              </p>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((style) => (
                  <Badge
                    key={style.id}
                    variant={selectedStyles?.includes(style.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleStyle(style.id)}
                  >
                    {style.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => navigate("/me")}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MeEdit;
