import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { profileSchema, creatorProfileSchema } from "@/lib/validation";
import { z } from "zod";
import { STYLE_OPTIONS } from "@/lib/constants";

const ProfileSetup = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Profile data
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [priceLow, setPriceLow] = useState("");
  const [priceHigh, setPriceHigh] = useState("");
  const [travelRadius, setTravelRadius] = useState("50");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [bioCharCount, setBioCharCount] = useState(0);
  const [usernameError, setUsernameError] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setName(session.user.user_metadata?.name || "");
      }
    });
  }, []);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPortfolioFiles(Array.from(e.target.files));
    }
  };

  const validateUsername = async (value: string) => {
    const lower = value.toLowerCase();
    if (lower.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }
    
    const { data, error } = await supabase
      .from("users_extended")
      .select("id")
      .eq("username", lower)
      .neq("id", user?.id);
    
    if (error || (data && data.length > 0)) {
      setUsernameError("Username already taken");
      return false;
    }
    
    setUsernameError("");
    return true;
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(sanitized);
    if (sanitized.length >= 3) {
      validateUsername(sanitized);
    }
  };

  const handleBioChange = (value: string) => {
    if (value.length <= 500) {
      setBio(value);
      setBioCharCount(value.length);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Validate profile data
      const profileData = profileSchema.parse({ 
        name, 
        city: city || undefined, 
        bio: bio || undefined 
      });

      // Validate creator profile data
      const creatorData = creatorProfileSchema.parse({
        priceBandLow: priceLow ? parseFloat(priceLow) : undefined,
        travelRadius: parseInt(travelRadius),
        styles: selectedStyles,
      });

      // Update user profile
      await supabase.from("users_extended").update({
        name: profileData.name,
        username: username.toLowerCase(),
        bio: profileData.bio,
        city: profileData.city,
      }).eq("id", user.id);

      // Update creator profile
      await supabase.from("creator_profiles").update({
        min_project_budget_usd: creatorData.priceBandLow,
        travel_radius_km: creatorData.travelRadius,
        styles: creatorData.styles,
      }).eq("user_id", user.id);

      // Upload portfolio images
      for (const file of portfolioFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("portfolios")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("portfolios")
          .getPublicUrl(fileName);

        // Insert portfolio image record
        await supabase.from("portfolio_images").insert({
          creator_user_id: user.id,
          url: publicUrl,
          tags: [], // Will be tagged by AI later
        });
      }

      toast({
        title: "Profile created!",
        description: "Your photographer profile is now live.",
      });

      navigate("/creator/dashboard");
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
            <Camera className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Set Up Your Profile</h1>
          <p className="text-muted-foreground">Let's create your photographer portfolio</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-smooth ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <Badge variant="secondary" className="text-xs">
            Profile {Math.round((step / 3) * 100)}% Complete
          </Badge>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Step {step} of 3</CardTitle>
            <CardDescription>
              {step === 1 && "Basic Information"}
              {step === 2 && "Pricing & Availability"}
              {step === 3 && "Portfolio Upload"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Professional Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                    <p className="text-xs text-muted-foreground">How clients will see you</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="yourname"
                      required
                    />
                    {usernameError && (
                      <p className="text-xs text-destructive">{usernameError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Your unique profile URL</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio">Bio</Label>
                    <span className="text-xs text-muted-foreground">{bioCharCount}/500</span>
                  </div>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => handleBioChange(e.target.value)}
                    placeholder="Tell clients about your photography style, experience, and what makes your work unique..."
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Los Angeles, CA"
                      required
                    />
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="radius">Travel Radius (miles) *</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={travelRadius}
                      onChange={(e) => setTravelRadius(e.target.value)}
                      min="5"
                      max="200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Photography Styles * (select at least one)</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((style) => (
                      <Badge
                        key={style.id}
                        variant={selectedStyles.includes(style.id) ? "default" : "outline"}
                        className="cursor-pointer transition-smooth hover:scale-105"
                        onClick={() => toggleStyle(style.id)}
                      >
                        {style.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-budget">Minimum Project Budget *</Label>
                  <Input
                    id="min-budget"
                    type="number"
                    value={priceLow}
                    onChange={(e) => setPriceLow(e.target.value)}
                    placeholder="500"
                    min="0"
                    step="50"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    We book projects starting at this amount
                  </p>
                  {priceLow && (
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Preview: <span className="font-semibold text-foreground">Project rates from ${priceLow}</span>
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full"
                  disabled={!name || !username || !city || selectedStyles.length === 0 || usernameError !== ""}
                >
                  Next: Availability
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Availability & Contact</h3>
                    <p className="text-sm text-muted-foreground">
                      Set your general availability. You can update this anytime from your profile.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Typical Response Time</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Same day", "24 hours", "48 hours"].map((option) => (
                        <Badge
                          key={option}
                          variant="outline"
                          className="cursor-pointer justify-center py-2 hover:bg-primary/10 transition-smooth"
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Pro tip:</strong> Fast response times increase your match rate by up to 40%
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Next: Portfolio
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Portfolio</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload 10-20 of your best images that showcase your style.
                      {selectedStyles.includes("surfing") && " Video uploads available after profile creation."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Upload Images *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-smooth">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <Input
                        id="portfolio"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="max-w-xs mx-auto"
                      />
                      {portfolioFiles.length > 0 ? (
                        <div className="mt-4">
                          <p className="text-sm font-medium">
                            {portfolioFiles.length} file(s) selected
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {portfolioFiles.map(f => f.name).join(", ")}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">
                          Click to browse or drag & drop images here
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 gradient-primary"
                    disabled={loading || portfolioFiles.length === 0}
                  >
                    {loading ? "Creating Profile..." : "Finish & Preview Profile"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
