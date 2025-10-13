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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

const availableStyles = [
  "Wedding", "Portrait", "Product", "Event", "Lifestyle", 
  "Editorial", "Real Estate", "Food", "Sports", "Surfing"
];

const ClientProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    city: "",
    bio: "",
    budget_low: 500,
    budget_high: 3000,
    distance_km: 50,
    preferred_styles: [] as string[],
  });

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
        .select("name, email, city, bio")
        .eq("id", session.user.id)
        .single();

      const { data: briefData } = await supabase
        .from("client_briefs")
        .select("budget_low, budget_high, mood_tags")
        .eq("client_user_id", session.user.id)
        .maybeSingle();

      if (userData) {
        setFormData({
          name: userData.name || "",
          email: userData.email || session.user.email || "",
          city: userData.city || "",
          bio: userData.bio || "",
          budget_low: briefData?.budget_low || 500,
          budget_high: briefData?.budget_high || 3000,
          distance_km: 50,
          preferred_styles: briefData?.mood_tags || [],
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
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
        })
        .eq("id", userId);

      if (userError) throw userError;

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

      toast.success("Profile updated!");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_styles: prev.preferred_styles.includes(style)
        ? prev.preferred_styles.filter(s => s !== style)
        : [...prev.preferred_styles, style]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">My Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email (read-only)</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Your city"
              />
            </div>

            <div>
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell photographers a bit about yourself..."
                rows={3}
              />
            </div>

            <div>
              <Label>Budget Range</Label>
              <div className="space-y-2">
                <div className="flex gap-4">
                  <Input
                    type="number"
                    value={formData.budget_low}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_low: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                  <span className="self-center">to</span>
                  <Input
                    type="number"
                    value={formData.budget_high}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_high: parseInt(e.target.value) || 0 }))}
                    min={formData.budget_low}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  ${formData.budget_low} - ${formData.budget_high}
                </p>
              </div>
            </div>

            <div>
              <Label>Preferred Styles</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select the photography styles you're interested in
              </p>
              <div className="flex flex-wrap gap-2">
                {availableStyles.map((style) => (
                  <Badge
                    key={style}
                    variant={formData.preferred_styles.includes(style) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleStyle(style)}
                  >
                    {style}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
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

export default ClientProfile;
