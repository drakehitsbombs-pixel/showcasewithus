import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, DollarSign, Briefcase } from "lucide-react";
import Navigation from "@/components/Navigation";
import { getStyleLabel } from "@/lib/constants";

const Me = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

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

      // Load user data
      const { data: user } = await supabase
        .from("users_extended")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUserData(user);

      // Load role-specific profile
      if (user?.role === "creator") {
        const { data: creatorProfile } = await supabase
          .from("creator_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        const { data: projects } = await supabase
          .from("projects")
          .select("*")
          .eq("creator_user_id", session.user.id)
          .limit(6);

        setProfileData({ ...creatorProfile, projects: projects || [] });
      } else {
        const { data: clientBrief } = await supabase
          .from("client_briefs")
          .select("*")
          .eq("client_user_id", session.user.id)
          .maybeSingle();

        setProfileData(clientBrief);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
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

  const isCreator = userData?.role === "creator";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">My Profile</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/me/edit")}>
            Edit
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userData?.avatar_url} alt={userData?.name} />
                <AvatarFallback className="text-3xl">
                  {userData?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{userData?.name}</h2>
                <Badge variant="secondary" className="mb-3 capitalize">{userData?.role}</Badge>
                {userData?.bio && (
                  <p className="text-muted-foreground">{userData.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {userData?.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {userData.city}
                    </div>
                  )}
                  {userData?.email && (
                    <div>{userData.email}</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creator-specific sections */}
        {isCreator && profileData && (
          <>
            {/* Pricing & Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.price_band_low && profileData.price_band_high && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <span>
                      ${profileData.price_band_low} - ${profileData.price_band_high}
                    </span>
                  </div>
                )}
                {profileData.travel_radius_km && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>Travel radius: {profileData.travel_radius_km} km</span>
                  </div>
                )}
                {profileData.rating_avg > 0 && (
                  <div>
                    Rating: {profileData.rating_avg.toFixed(1)} ({profileData.review_count} reviews)
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Styles */}
            {profileData.styles?.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Photography Styles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profileData.styles.map((style: string) => (
                      <Badge key={style} variant="outline">
                        {getStyleLabel(style)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Recent Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileData.projects?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profileData.projects.map((project: any) => (
                      <div key={project.id} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">{project.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">You don't have projects yet. Add some to showcase your work!</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Client-specific sections */}
        {!isCreator && (
          <Card>
            <CardHeader>
              <CardTitle>My Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileData?.budget_low && profileData?.budget_high && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span>
                    Budget: ${profileData.budget_low} - ${profileData.budget_high}
                  </span>
                </div>
              )}
              {profileData?.mood_tags?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Preferred Styles:</p>
                  <div className="flex flex-wrap gap-2">
                    {profileData.mood_tags.map((style: string) => (
                      <Badge key={style} variant="outline">
                        {getStyleLabel(style)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {!profileData && (
                <p className="text-muted-foreground">
                  You haven't set your preferences yet. Edit your profile to get started!
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Me;
