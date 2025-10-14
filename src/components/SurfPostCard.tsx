import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SurfPostCardProps {
  post: {
    id: string;
    title: string;
    spot_text?: string;
    tags: string[];
    media_url: string;
    thumbnail_url?: string;
    like_count: number;
    comment_count: number;
    creator_user_id: string;
    created_at: string;
  };
  creator?: {
    name: string;
    city?: string;
    avatar_url?: string;
  };
  currentUserId?: string;
  onLike: (postId: string, isLiked: boolean) => void;
  onComment: (postId: string) => void;
}

export const SurfPostCard = ({ post, creator, currentUserId, onLike, onComment }: SurfPostCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast.error("Sign in to like posts");
      return;
    }

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLocalLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      if (newIsLiked) {
        await supabase.from("surf_likes").insert({
          post_id: post.id,
          user_id: currentUserId,
        });
      } else {
        await supabase.from("surf_likes").delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
      }
      onLike(post.id, newIsLiked);
    } catch (error) {
      console.error("Error toggling like:", error);
      setIsLiked(!newIsLiked);
      setLocalLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
      toast.error("Failed to update like");
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/surfing?post=${post.id}`);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-smooth cursor-pointer group">
      <div 
        className="relative aspect-[9/16] bg-muted"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {post.thumbnail_url && !isPlaying && (
          <img 
            src={post.thumbnail_url} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
        )}
        {isPlaying ? (
          <video
            src={post.media_url}
            className="w-full h-full object-cover"
            controls
            autoPlay
            muted
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-smooth">
            <Play className="w-16 h-16 text-white opacity-90" />
          </div>
        )}

        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src={creator?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {creator?.name?.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-white drop-shadow-md">
                {creator?.name || "Photographer"}
              </p>
              {creator?.city && (
                <p className="text-xs text-white/90 drop-shadow-md">{creator.city}</p>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-semibold mb-1 drop-shadow-md">{post.title}</h3>
          {post.spot_text && (
            <p className="text-sm text-white/90 mb-2 drop-shadow-md">{post.spot_text}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-white/90">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="gap-2 hover:text-accent"
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-accent text-accent" : ""}`} />
              <span className="text-sm">{localLikeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(post.id)}
              className="gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{post.comment_count}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};