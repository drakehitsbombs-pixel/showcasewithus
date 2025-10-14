import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Waves, Plus } from "lucide-react";
import Navigation from "@/components/Navigation";
import { SurfPostCard } from "@/components/SurfPostCard";
import { SurfVideoUpload } from "@/components/SurfVideoUpload";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { hasSurfing } from "@/lib/constants";

const Surfing = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [showSettingsPrompt, setShowSettingsPrompt] = useState(false);
  const [addingSurfing, setAddingSurfing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCurrentUser();
    loadSurfPosts();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
      // Check user role first
      const { data: userRole } = await supabase
        .from("users_extended")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userRole?.role !== "creator") {
        console.log("User is not a creator, cannot upload surf clips");
        setCanUpload(false);
        return;
      }

      // Check if user has 'surfing' style
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("styles")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading creator profile:", error);
        setCanUpload(false);
        return;
      }

      if (!data) {
        console.log("No creator profile found for user");
        setCanUpload(false);
        return;
      }

      const hasStyle = hasSurfing(data?.styles);
      setCanUpload(hasStyle);
      console.log("Surfing gate check:", { user_id: user.id, styles: data?.styles, canUpload: hasStyle });
    }
  };

  const handleAddSurfingNow = async () => {
    if (!currentUser) return;

    setAddingSurfing(true);
    try {
      // Check if user is a creator first
      const { data: userRole } = await supabase
        .from("users_extended")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      if (userRole?.role !== "creator") {
        toast.error("Only creators can post surf clips. Please create a creator account.");
        setAddingSurfing(false);
        return;
      }

      // Get or create creator profile
      const { data: profile, error: fetchError } = await supabase
        .from("creator_profiles")
        .select("styles")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        toast.error("Failed to load creator profile");
        setAddingSurfing(false);
        return;
      }

      let currentStyles: string[] = [];
      let profileExists = !!profile;

      if (!profile) {
        // Create new creator profile with surfing style
        const { data: newProfile, error: createError } = await supabase
          .from("creator_profiles")
          .insert({ user_id: currentUser.id, styles: ["surfing"] })
          .select("styles")
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          toast.error("Failed to create creator profile");
          setAddingSurfing(false);
          return;
        }

        currentStyles = newProfile.styles || ["surfing"];
      } else {
        currentStyles = profile.styles || [];
        const newStyles = [...new Set([...currentStyles, "surfing"])];

        // Update existing profile
        const { data: updated, error: updateError } = await supabase
          .from("creator_profiles")
          .update({ styles: newStyles })
          .eq("user_id", currentUser.id)
          .select("styles")
          .single();

        if (updateError) {
          console.error("Error updating profile:", updateError);
          toast.error("Failed to update creator profile");
          setAddingSurfing(false);
          return;
        }

        currentStyles = updated.styles || [];
      }

      console.log("Added surfing style:", { user_id: currentUser.id, styles: currentStyles });

      // Update local state
      setCanUpload(true);
      setShowSettingsPrompt(false);
      
      // Reload user to refresh gate check
      await loadCurrentUser();
      
      // Open upload modal
      setTimeout(() => setShowUpload(true), 100);
      
      toast.success("Surfing style added! You can now post clips.");
    } catch (error) {
      console.error("Error adding surfing style:", error);
      toast.error("Failed to add surfing style");
    } finally {
      setAddingSurfing(false);
    }
  };

  const loadSurfPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("surf_posts")
        .select(`
          *,
          creator:users_extended!surf_posts_creator_user_id_fkey(name, city, avatar_url)
        `)
        .eq("status", "ready")
        .order("created_at", { ascending: false })
        .limit(24);

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error("Error loading surf posts:", error);
      toast.error("Failed to load surf feed");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (postId: string, isLiked: boolean) => {
    // Optimistic update handled in SurfPostCard
  };

  const handleComment = (postId: string) => {
    // TODO: Open comment modal
    toast.info("Comments coming soon!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Waves className="h-10 w-10" />
              <div>
                <h1 className="text-4xl font-bold">Surf Photography</h1>
                <p className="text-lg opacity-90 mt-2">
                  Local wave chasers capturing the ocean's energy
                </p>
              </div>
            </div>
            <Button
              onClick={() => canUpload ? setShowUpload(true) : setShowSettingsPrompt(true)}
              size="lg"
              className="bg-white text-blue-600 hover:bg-white/90 font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post a Clip
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading surf feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <Waves className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-2">No surf clips yet</p>
            <p className="text-sm text-muted-foreground">Be the first to post!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <SurfPostCard
                key={post.id}
                post={post}
                creator={post.creator}
                currentUserId={currentUser?.id}
                onLike={handleLike}
                onComment={handleComment}
              />
            ))}
          </div>
        )}
      </div>

      <SurfVideoUpload
        open={showUpload}
        onOpenChange={setShowUpload}
        onSuccess={loadSurfPosts}
      />

      <AlertDialog open={showSettingsPrompt} onOpenChange={setShowSettingsPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Surfing to Your Styles</AlertDialogTitle>
            <AlertDialogDescription>
              To post surf clips, you need to be a creator and add 'surfing' to your photography styles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsPrompt(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSettingsPrompt(false);
                navigate("/settings");
              }}
            >
              Go to Settings
            </Button>
            <Button onClick={handleAddSurfingNow} disabled={addingSurfing}>
              {addingSurfing ? "Adding..." : "Add Surfing Now"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Surfing;
