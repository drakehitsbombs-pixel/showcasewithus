import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Waves, Plus } from "lucide-react";
import Navigation from "@/components/Navigation";
import { SurfPostCard } from "@/components/SurfPostCard";
import { SurfVideoUpload } from "@/components/SurfVideoUpload";
import { toast } from "sonner";

const Surfing = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [canUpload, setCanUpload] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadSurfPosts();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
      // Check if user has 'surfing' style
      const { data } = await supabase
        .from("creator_profiles")
        .select("styles")
        .eq("user_id", user.id)
        .single();

      setCanUpload(data?.styles?.includes("surfing") || false);
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
            {canUpload && (
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-white text-primary hover:bg-white/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Clip
              </Button>
            )}
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
    </div>
  );
};

export default Surfing;
