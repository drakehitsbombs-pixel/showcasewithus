import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, DollarSign, Star, CheckCircle, MessageSquare, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { ReviewModal } from "@/components/ReviewModal";
import { BookingModal } from "@/components/BookingModal";
import { getStyleLabel } from "@/lib/constants";

interface CreatorProfile {
  id: string;
  user_id: string;
  min_project_budget_usd: number;
  travel_radius_km: number | null;
  styles: string[];
  rating_avg: number | null;
  review_count: number | null;
  verification_status: string;
  avatar_url: string | null;
}

interface UserData {
  name: string;
  bio: string | null;
  city: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  location_text: string | null;
  project_type: string;
  tags: string[];
  media: Array<{
    id: string;
    url: string;
    is_cover: boolean;
    sort_order: number;
  }>;
}

interface Review {
  id: string;
  rating_int: number;
  text: string | null;
  created_at: string;
  client_user_id: string;
  client: {
    name: string;
  };
}

const CreatorProfile = () => {
  const { userId, username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isLimitedProfile, setIsLimitedProfile] = useState(false);

  useEffect(() => {
    loadProfile();
    checkCurrentUser();
  }, [userId, username]);

  const checkCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUser(session.user);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setCurrentUserRole(data?.role || null);
    }
  };

  const loadProfile = async () => {
    if (!userId && !username) return;

    try {
      // Get userId from location state if available (passed from card click)
      const stateUserId = (location.state as any)?.userId;
      let finalUserId = userId || stateUserId;
      const lookupUsername = username && username !== finalUserId ? username : null;

      // Try using the database function for optimized lookup
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_creator_profile_by_username_or_id', {
          p_username: lookupUsername,
          p_user_id: finalUserId
        });

      if (profileError) {
        console.error("Profile lookup error:", profileError);
      }

      if (profileData && profileData.length > 0) {
        const data = profileData[0];
        finalUserId = data.user_id;
        setResolvedUserId(finalUserId);

        // Set profile data
        setProfile({
          id: data.user_id,
          user_id: data.user_id,
          min_project_budget_usd: data.min_project_budget_usd,
          travel_radius_km: data.travel_radius_km,
          styles: data.styles || [],
          rating_avg: data.rating_avg,
          review_count: data.review_count,
          verification_status: data.verification_status || 'unverified',
          avatar_url: data.profile_avatar_url || data.avatar_url,
        } as CreatorProfile);

        setUserData({
          name: data.name,
          bio: data.bio,
          city: data.city,
        });

        // Check if profile is limited (not fully set up)
        const hasAvatar = data.avatar_url || data.profile_avatar_url;
        const hasPricing = data.min_project_budget_usd > 0;
        setIsLimitedProfile(!hasAvatar || !hasPricing || !data.is_discoverable);

        // Load additional data
        const [projectsRes, portfolioRes, reviewsRes] = await Promise.all([
          supabase
            .from("projects")
            .select(`
              *,
              media:project_media(id, url, is_cover, sort_order)
            `)
            .eq("creator_user_id", finalUserId)
            .order("created_at", { ascending: false }),
          supabase
            .from("portfolio_images")
            .select("*")
            .eq("creator_user_id", finalUserId)
            .limit(12),
          supabase
            .from("reviews")
            .select(`
              *,
              client:users_extended!reviews_client_user_id_fkey(name)
            `)
            .eq("creator_user_id", finalUserId)
            .order("created_at", { ascending: false })
            .limit(10)
        ]);

        if (projectsRes.data) setProjects(projectsRes.data as any);
        if (reviewsRes.data) setReviews(reviewsRes.data as any);
        
        // Fallback to portfolio images if no projects
        if (projectsRes.data?.length === 0 && portfolioRes.data) {
          const portfolioProject = {
            id: 'portfolio',
            title: 'Portfolio',
            description: null,
            location_text: null,
            project_type: 'portfolio',
            tags: [],
            media: portfolioRes.data.map((img, idx) => ({
              id: img.id,
              url: img.url,
              is_cover: idx === 0,
              sort_order: idx,
            }))
          };
          setProjects([portfolioProject] as any);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !resolvedUserId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${resolvedUserId}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("creator_profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", resolvedUserId);

      if (updateError) throw updateError;

      toast.success("Avatar updated!");
      loadProfile();
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleMessageCreator = async () => {
    if (!currentUser || !resolvedUserId) return;

    try {
      // Find or create thread
      const { data: existingThread } = await supabase
        .from("threads")
        .select("id")
        .eq("creator_user_id", resolvedUserId)
        .eq("client_user_id", currentUser.id)
        .single();

      if (existingThread) {
        navigate(`/messages/${existingThread.id}`);
      } else {
        const { data: newThread, error } = await supabase
          .from("threads")
          .insert({
            creator_user_id: resolvedUserId,
            client_user_id: currentUser.id,
          })
          .select()
          .single();

        if (error) throw error;
        navigate(`/messages/${newThread.id}`);
      }
    } catch (error) {
      console.error("Error creating thread:", error);
      toast.error("Failed to start conversation");
    }
  };

  const isOwnProfile = currentUser?.id === resolvedUserId;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Profile</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Card className="p-6 mb-6">
            <div className="flex gap-6 animate-pulse">
              <div className="w-32 h-32 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-32" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-20" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Creator profile not found</p>
          <p className="text-sm text-muted-foreground mb-6">
            This creator may not exist or their profile is not available.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Limited Profile Banner */}
        {isLimitedProfile && !isOwnProfile && (
          <Card className="p-4 mb-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                ℹ️
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Profile Updating
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This creator is still setting up their profile. Some information may be incomplete or unavailable.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-3xl">
                  {userData.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Upload className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </label>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {userData.name}
                    {profile.verification_status === "verified" && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </h2>
                  {userData.city && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {userData.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Styles */}
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.styles.map((style) => (
                  <Badge key={style} variant="secondary">
                    {getStyleLabel(style)}
                  </Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-4">
                {profile.min_project_budget_usd > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>Project rates from ${profile.min_project_budget_usd}</span>
                  </div>
                )}
                {profile.rating_avg !== null && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{profile.rating_avg.toFixed(1)}</span>
                    <span className="text-muted-foreground">({profile.review_count} reviews)</span>
                  </div>
                )}
                {profile.travel_radius_km && (
                  <div className="text-sm text-muted-foreground">
                    Travels {Math.round(profile.travel_radius_km * 0.621371)} miles
                  </div>
                )}
              </div>

              {/* Bio */}
              {userData.bio && (
                <p className="text-sm text-muted-foreground mb-4">{userData.bio}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {!isOwnProfile && currentUserRole === "client" && (
                  <>
                    <Button onClick={handleMessageCreator} className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => setShowBookingModal(true)}>
                      <FileText className="w-4 h-4" />
                      Book
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => setShowReviewModal(true)}>
                      <Star className="w-4 h-4" />
                      Leave Review
                    </Button>
                  </>
                )}
                {isOwnProfile && (
                  <Button onClick={() => navigate("/creator/profile-setup")} variant="outline">
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Portfolio/Projects */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Portfolio</h3>
            {isOwnProfile && (
              <Button variant="outline" size="sm">
                Add Project
              </Button>
            )}
          </div>

          {projects.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              {isOwnProfile && (
                <Button>Add Your First Project</Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const coverImage = project.media.find((m) => m.is_cover) || project.media[0];
                return (
                  <Card
                    key={project.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedProject(project)}
                  >
                    {coverImage && (
                      <div className="aspect-square bg-muted">
                        <img
                          src={coverImage.url}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-semibold mb-1">{project.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Badge variant="outline" className="text-xs">
                          {project.project_type}
                        </Badge>
                        {project.location_text && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {project.location_text}
                          </span>
                        )}
                      </div>
                      {project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Reviews</h3>
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {review.client?.name?.charAt(0)?.toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{review.client?.name || "Client"}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating_int
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.text && <p className="text-sm">{review.text}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        creatorUserId={resolvedUserId || ""}
        onSuccess={() => loadProfile()}
      />

      {/* Project Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {selectedProject.media
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((media) => (
                    <div key={media.id} className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
              </div>
              {selectedProject.description && (
                <p className="text-sm text-muted-foreground mb-4">{selectedProject.description}</p>
              )}
              <div className="flex gap-2">
                <Badge>{selectedProject.project_type}</Badge>
                {selectedProject.location_text && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedProject.location_text}
                  </Badge>
                )}
              </div>
              {selectedProject.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedProject.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        creatorUserId={resolvedUserId || ""}
      />

      <BookingModal
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
        creatorId={resolvedUserId || ""}
        creatorName={userData?.name || ""}
        minProjectBudget={profile?.min_project_budget_usd || undefined}
      />
    </div>
  );
};

export default CreatorProfile;
