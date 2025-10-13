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

const STYLE_OPTIONS = ["wedding", "portrait", "product", "event", "commercial", "real_estate"];

const ProfileSetup = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Profile data
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [priceLow, setPriceLow] = useState("");
  const [priceHigh, setPriceHigh] = useState("");
  const [travelRadius, setTravelRadius] = useState("50");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  
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
        priceBandHigh: priceHigh ? parseFloat(priceHigh) : undefined,
        travelRadius: parseInt(travelRadius),
        styles: selectedStyles,
      });

      // Update user profile
      await supabase.from("users_extended").update({
        name: profileData.name,
        bio: profileData.bio,
        city: profileData.city,
      }).eq("id", user.id);

      // Update creator profile
      await supabase.from("creator_profiles").update({
        price_band_low: creatorData.priceBandLow,
        price_band_high: creatorData.priceBandHigh,
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
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your professional name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell clients about your photography style and experience..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Los Angeles, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Photography Styles</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((style) => (
                      <Badge
                        key={style}
                        variant={selectedStyles.includes(style) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleStyle(style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={() => setStep(2)} className="w-full">
                  Next
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price-low">Min Price ($/hr)</Label>
                    <Input
                      id="price-low"
                      type="number"
                      value={priceLow}
                      onChange={(e) => setPriceLow(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price-high">Max Price ($/hr)</Label>
                    <Input
                      id="price-high"
                      type="number"
                      value={priceHigh}
                      onChange={(e) => setPriceHigh(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radius">Travel Radius (km)</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={travelRadius}
                    onChange={(e) => setTravelRadius(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio Images (10-20 images)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <Input
                      id="portfolio"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="max-w-xs mx-auto"
                    />
                    {portfolioFiles.length > 0 && (
                      <p className="mt-4 text-sm text-muted-foreground">
                        {portfolioFiles.length} file(s) selected
                      </p>
                    )}
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
                    {loading ? "Creating Profile..." : "Complete Setup"}
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
