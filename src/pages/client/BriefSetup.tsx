import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowLeft, CalendarIcon } from "lucide-react";
import { briefSchema } from "@/lib/validation";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = ["Wedding", "Portrait", "Product", "Event", "Commercial", "Real Estate", "Other"];
const MOOD_TAGS = ["bright", "moody", "candid", "studio", "outdoor", "indoor", "vintage", "modern"];

const BriefSetup = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [projectType, setProjectType] = useState<string>("");
  const [dateStart, setDateStart] = useState<Date>();
  const [dateEnd, setDateEnd] = useState<Date>();
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
    setSelectedMoodTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Validate brief data
      const validated = briefSchema.parse({
        projectType: projectType as "wedding" | "portrait" | "product" | "event",
        dateStart: dateStart ? format(dateStart, "yyyy-MM-dd") : undefined,
        dateEnd: dateEnd ? format(dateEnd, "yyyy-MM-dd") : undefined,
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
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-2xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Your Brief</h1>
          <p className="text-muted-foreground">Tell us about your photography needs</p>
        </div>

        <Card className="card-premium">
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
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateStart ? format(dateStart, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateStart}
                      onSelect={setDateStart}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateEnd ? format(dateEnd, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateEnd}
                      onSelect={setDateEnd}
                      disabled={(date) => dateStart ? date < dateStart : false}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Location</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Los Angeles, CA" />
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
                  <button
                    key={tag}
                    className={`filter-pill ${selectedMoodTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleMoodTag(tag)}
                  >
                    {tag}
                  </button>
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
              className="w-full btn-primary" 
              size="lg"
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
