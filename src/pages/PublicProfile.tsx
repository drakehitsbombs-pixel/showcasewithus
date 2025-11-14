import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, DollarSign, MessageSquare, Calendar, Mail, Phone } from "lucide-react";
import { getPublicDisplayName } from "@/lib/name-utils";
import Footer from "@/components/Footer";

const PublicProfile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    loadPublicProfile();
  }, [slug]);

  const loadPublicProfile = async () => {
    try {
      // Get user by slug
      const { data: userData, error: userError } = await supabase
        .from("users_extended")
        .select("id, name, email, city, slug, bio, avatar_url")
        .eq("slug", slug)
        .maybeSingle();

      if (userError || !userData) {
        console.error("User not found");
        setLoading(false);
        return;
      }

      // Get creator profile
      const { data: creatorProfile, error: profileError } = await supabase
        .from("creator_profiles")
        .select("*, email_public:email_public, phone_public:phone_public, show_name_public:show_name_public")
        .eq("user_id", userData.id)
        .maybeSingle();

      if (profileError || !creatorProfile) {
        console.error("Creator profile not found");
        setLoading(false);
        return;
      }

      // Check if profile is public
      if (!creatorProfile.public_profile) {
        console.error("Profile is private");
        setLoading(false);
        return;
      }

      setProfile({ ...userData, ...creatorProfile });

      // Load portfolio
      const { data: portfolioData } = await supabase
        .from("portfolio_images")
        .select("*")
        .eq("creator_user_id", userData.id)
        .order("created_at", { ascending: false });

      setPortfolio(portfolioData || []);

      // Load reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`
          *,
          users_extended!reviews_client_user_id_fkey(name, avatar_url)
        `)
        .eq("creator_user_id", userData.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setReviews(reviewsData || []);

      // Track public profile view
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("profile_views").insert({
        creator_user_id: userData.id,
        viewer_user_id: session?.user?.id || null,
      });

    } catch (error) {
      console.error("Error loading public profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    // Navigate to messages with creator
    navigate(`/messages`);
  };

  const handleBooking = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    // Navigate to booking flow
    navigate(`/creator/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Profile Not Found</h1>
        <p className="text-muted-foreground">This profile is private or doesn't exist.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const displayName = getPublicDisplayName(
    profile.name,
    profile.email,
    profile.show_name_public !== false
  );
  const coverImage = portfolio[0]?.url || profile.avatar_url;
  const showMinBudget = profile.min_project_budget_usd > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cover Image */}
      <div className="relative h-64 md:h-96 bg-muted ad-exclude-hero">
          {coverImage && (
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="flex-1 container mx-auto px-4 -mt-20 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <Avatar className="w-32 h-32 border-4 border-background">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-4xl">
                      {displayName?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
                        {profile.city && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {profile.city}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Email Contact */}
                        {profile.email_public && profile.email && (
                          <Button 
                            size="lg" 
                            variant="outline"
                            asChild
                          >
                            <a href={`mailto:${profile.email}?subject=Inquiry from ShowCase`}>
                              <Mail className="w-4 h-4 mr-2" />
                              Email
                            </a>
                          </Button>
                        )}
                        
                        {/* Phone Contact */}
                        {profile.phone_public && profile.phone && (
                          <Button 
                            size="lg" 
                            variant="outline"
                            asChild
                          >
                            <a href={`tel:${profile.phone}`}>
                              <Phone className="w-4 h-4 mr-2" />
                              Call
                            </a>
                          </Button>
                        )}
                        
                        <Button onClick={handleMessage} size="lg" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button onClick={handleBooking} size="lg">
                          <Calendar className="w-4 h-4 mr-2" />
                          Book
                        </Button>
                      </div>
                    </div>

                    {/* Styles */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.styles?.map((style: string) => (
                        <Badge key={style} variant="secondary">
                          {style}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      {profile.rating_avg > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{profile.rating_avg.toFixed(1)}</span>
                          <span className="text-muted-foreground">({profile.review_count} reviews)</span>
                        </div>
                      )}
                      {showMinBudget && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>Min project ${profile.min_project_budget_usd}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="mt-4 text-muted-foreground">{profile.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Grid */}
            {portfolio.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Portfolio</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ad-exclude-gallery">
                  {portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={item.url}
                        alt="Portfolio"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Ad placement below gallery */}
                <div className="ad-manual-banner mt-6">
                  <ins 
                    className="adsbygoogle"
                    style={{ display: 'block' }}
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                  />
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage src={review.users_extended?.avatar_url} />
                            <AvatarFallback>
                              {review.users_extended?.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{review.users_extended?.name}</span>
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < review.rating_int
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-muted"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    );
  };

export default PublicProfile;
