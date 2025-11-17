import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, DollarSign, MessageSquare, Calendar, Mail, Phone, ArrowLeft } from "lucide-react";
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
      const { data: creatorProfile, error: profileError } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .eq("public_profile", true)
        .maybeSingle();

      if (profileError || !creatorProfile) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from("users_extended")
        .select("id, name, email, city, bio, avatar_url, phone")
        .eq("id", creatorProfile.user_id)
        .maybeSingle();

      setProfile({ ...creatorProfile, ...userData });

      const { data: portfolioData } = await supabase
        .from("portfolio_images")
        .select("*")
        .eq("creator_user_id", creatorProfile.user_id)
        .order("created_at", { ascending: false });

      setPortfolio(portfolioData || []);

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`*, users_extended!reviews_client_user_id_fkey(name, avatar_url)`)
        .eq("creator_user_id", creatorProfile.user_id)
        .order("created_at", { ascending: false })
        .limit(10);

      setReviews(reviewsData || []);

      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("profile_views").insert({
        creator_user_id: creatorProfile.user_id,
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
    navigate(`/messages`);
  };

  const handleBooking = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
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
        <p className="text-muted-foreground">This photographer profile doesn't exist or is not published.</p>
        <Button onClick={() => navigate("/discover")}>Browse Photographers</Button>
      </div>
    );
  }

  const displayName = profile.display_name || "Photographer";
  const coverImage = portfolio[0]?.url || profile.avatar_url;
  const showMinBudget = profile.min_project_budget_usd > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute top-20 left-4 z-20">
        <Button variant="outline" size="sm" onClick={() => navigate("/discover")} className="bg-background/90 backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Browse
        </Button>
      </div>

      <header className="sticky top-0 z-50 nav-blur">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/"><h2 className="text-xl font-bold">ShowCase</h2></Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild><Link to="/discover">Browse</Link></Button>
            <Button asChild className="bg-primary hover:brightness-90"><Link to="/auth">Sign In</Link></Button>
          </div>
        </div>
      </header>

      <div className="relative h-72 md:h-96 bg-muted">
        {coverImage && <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="flex-1 section -mt-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="cp-card mb-8 p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-4xl">{displayName?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-4xl font-bold mb-3">{displayName}</h1>
                    {profile.city && <p className="text-lg text-muted-foreground flex items-center gap-2"><MapPin className="w-5 h-5" />{profile.city}</p>}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {profile.email_public && profile.email && (
                      <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5" asChild>
                        <a href={`mailto:${profile.email}?subject=Inquiry from ShowCase`}><Mail className="w-4 h-4 mr-2" />Email</a>
                      </Button>
                    )}
                    {profile.phone_public && profile.phone && (
                      <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5" asChild>
                        <a href={`tel:${profile.phone}`}><Phone className="w-4 h-4 mr-2" />Call</a>
                      </Button>
                    )}
                    <Button onClick={handleMessage} size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5">
                      <MessageSquare className="w-4 h-4 mr-2" />Message
                    </Button>
                    <Button onClick={handleBooking} size="lg" className="bg-primary hover:brightness-90">
                      <Calendar className="w-4 h-4 mr-2" />Book
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {profile.styles?.map((style: string) => <span key={style} className="cp-chip">{style}</span>)}
                </div>

                <div className="flex items-center gap-6">
                  {profile.rating_avg > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-accent fill-accent" />
                      <span className="font-semibold text-lg">{profile.rating_avg.toFixed(1)}</span>
                      <span className="text-muted-foreground">({profile.review_count} reviews)</span>
                    </div>
                  )}
                  {showMinBudget && (
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <DollarSign className="w-5 h-5" />
                      <span>Project rates from ${profile.min_project_budget_usd}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {profile.bio && <p className="mt-6 text-muted-foreground text-lg leading-relaxed">{profile.bio}</p>}
          </div>

          {portfolio.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6">Portfolio</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {portfolio.map((item) => (
                  <div key={item.id} className="cp-card overflow-hidden aspect-square">
                    <img src={item.url} alt="Portfolio" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6">Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="cp-card p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={review.users_extended?.avatar_url} />
                        <AvatarFallback>{review.users_extended?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{review.users_extended?.name}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating_int ? "text-accent fill-accent" : "text-muted"}`} />
                            ))}
                          </div>
                        </div>
                        {review.text && <p className="text-muted-foreground leading-relaxed">{review.text}</p>}
                      </div>
                    </div>
                  </div>
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
