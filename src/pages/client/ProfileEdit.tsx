import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { kmToMiles, formatMiles } from "@/lib/constants";

const availableStyles = ["wedding", "portrait", "product", "event", "lifestyle", "editorial"];

const ProfileEdit = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    city: "",
    budget_low: 100,
    budget_high: 5000,
    distance_km: 50,
    mood_tags: [] as string[],
    date_window_start: "",
    date_window_end: "",
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadBrief(session.user.id);
      }
    });
  }, []);

  const loadBrief = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("client_briefs")
        .select("*")
        .eq("client_user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setBrief(data);
        setFormData({
          city: data.city || "",
          budget_low: data.budget_low || 100,
          budget_high: data.budget_high || 5000,
          distance_km: 50, // Default
          mood_tags: data.mood_tags || [],
          date_window_start: data.date_window_start || "",
          date_window_end: data.date_window_end || "",
        });
      }
    } catch (error: any) {
      console.error("Error loading brief:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (brief?.id) {
        // Update existing
        const { error } = await supabase
          .from("client_briefs")
          .update({
            city: formData.city,
            budget_low: formData.budget_low,
            budget_high: formData.budget_high,
            mood_tags: formData.mood_tags,
            date_window_start: formData.date_window_start || null,
            date_window_end: formData.date_window_end || null,
          })
          .eq("id", brief.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("client_briefs")
          .insert({
            client_user_id: user.id,
            project_type: "wedding", // Default
            city: formData.city,
            budget_low: formData.budget_low,
            budget_high: formData.budget_high,
            mood_tags: formData.mood_tags,
            date_window_start: formData.date_window_start || null,
            date_window_end: formData.date_window_end || null,
          });

        if (error) throw error;
      }

      toast.success("Profile updated successfully!");
      navigate("/discover");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleStyle = (style: string) => {
    setFormData({
      ...formData,
      mood_tags: formData.mood_tags.includes(style)
        ? formData.mood_tags.filter(s => s !== style)
        : [...formData.mood_tags, style]
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="San Francisco, CA"
              />
            </div>

            <div>
              <Label>Photography Styles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableStyles.map((style) => (
                  <Button
                    key={style}
                    variant={formData.mood_tags.includes(style) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStyle(style)}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget Min ($)</Label>
                <Input
                  type="number"
                  value={formData.budget_low}
                  onChange={(e) => setFormData({ ...formData, budget_low: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Budget Max ($)</Label>
                <Input
                  type="number"
                  value={formData.budget_high}
                  onChange={(e) => setFormData({ ...formData, budget_high: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Maximum Distance: {formatMiles(kmToMiles(formData.distance_km))} mi</Label>
              <Slider
                value={[formData.distance_km]}
                onValueChange={(value) => setFormData({ ...formData, distance_km: value[0] })}
                max={200}
                step={10}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Note: Distance filtering requires location setup
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date From (Optional)</Label>
                <Input
                  type="date"
                  value={formData.date_window_start}
                  onChange={(e) => setFormData({ ...formData, date_window_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Date To (Optional)</Label>
                <Input
                  type="date"
                  value={formData.date_window_end}
                  onChange={(e) => setFormData({ ...formData, date_window_end: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save Profile"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/discover")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileEdit;
