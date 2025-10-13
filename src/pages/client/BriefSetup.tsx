import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { briefSchema } from "@/lib/validation";
import { z } from "zod";

const PROJECT_TYPES = ["wedding", "portrait", "product", "event", "commercial", "real_estate", "other"];
const MOOD_TAGS = ["bright", "moody", "candid", "studio", "outdoor", "indoor", "vintage", "modern"];

const BriefSetup = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [projectType, setProjectType] = useState<string>("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [city, setCity] = useState("");
  const [budgetLow, setBudgetLow] = useState("");
  const [budgetHigh, setBudgetHigh] = useState("");
  const [selectedMoodTags, setSelectedMoodTags] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState("");
  const [notes, setNotes] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, []);

  const toggleMoodTag = (tag: string) => {
    setSelectedMoodTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Validate brief data
      const validated = briefSchema.parse({
        projectType: projectType as "wedding" | "portrait" | "product" | "event",
        dateStart: dateStart || undefined,
        dateEnd: dateEnd || undefined,
        city: city || undefined,
        budgetMin: budgetLow || undefined,
        budgetMax: budgetHigh || undefined,
        moodTags: selectedMoodTags,
        lifestyle: lifestyle || undefined,
        notes: notes || undefined,
      });

      await supabase.from("client_briefs").insert({
        client_user_id: user.id,
        project_type: validated.projectType as any,
        date_window_start: validated.dateStart,
        date_window_end: validated.dateEnd,
        city: validated.city,
        budget_low: validated.budgetMin ? parseFloat(validated.budgetMin) : null,
        budget_high: validated.budgetMax ? parseFloat(validated.budgetMax) : null,
        mood_tags: validated.moodTags,
        lifestyle: validated.lifestyle,
        notes: validated.notes,
      });

      toast({
        title: "Brief created!",
        description: "Let's find your perfect photographer.",
      });

      navigate("/client/discover");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 gradient-card">
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-accent mb-4">
            <Users className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Your Brief</h1>
          <p className="text-muted-foreground">Tell us about your photography needs</p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Provide information about your photography project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project-type">Project Type</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-start">Start Date</Label>
                <Input
                  id="date-start"
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-end">End Date</Label>
                <Input
                  id="date-end"
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Location</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Los Angeles, CA"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget-low">Min Budget ($)</Label>
                <Input
                  id="budget-low"
                  type="number"
                  value={budgetLow}
                  onChange={(e) => setBudgetLow(e.target.value)}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-high">Max Budget ($)</Label>
                <Input
                  id="budget-high"
                  type="number"
                  value={budgetHigh}
                  onChange={(e) => setBudgetHigh(e.target.value)}
                  placeholder="2000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mood & Style Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {MOOD_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedMoodTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMoodTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifestyle">Lifestyle Preferences (Optional)</Label>
              <Textarea
                id="lifestyle"
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
                placeholder="Describe your lifestyle or the vibe you're looking for (e.g., modern minimalist, bohemian, luxury, outdoor adventure)..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific requirements or preferences..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full gradient-accent"
              disabled={loading || !projectType}
            >
              {loading ? "Creating Brief..." : "Find Photographers"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BriefSetup;
