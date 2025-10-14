import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SurfVideoUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SURF_TAGS = ["barrel", "air", "tube", "carve", "cutback", "floater", "snap", "sunset", "dawn-patrol"];

export const SurfVideoUpload = ({ open, onOpenChange, onSuccess }: SurfVideoUploadProps) => {
  const [title, setTitle] = useState("");
  const [spot, setSpot] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const validateVideo = async (file: File): Promise<string | null> => {
    // Check MIME type
    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      return 'Invalid file type. Please use MP4 or MOV format.';
    }
    
    // Check size
    if (file.size > 250 * 1024 * 1024) {
      return 'File too large. Maximum size is 250MB.';
    }
    
    // Check duration using video element
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 120) {
          resolve('Video too long. Maximum duration is 120 seconds (2 minutes).');
        } else {
          resolve(null);
        }
      };
      
      video.onerror = () => {
        resolve('Invalid video file. Please try a different file.');
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const validationError = await validateVideo(file);
      if (validationError) {
        toast.error(validationError);
        e.target.value = ''; // Reset file input
        return;
      }
      
      setVideoFile(file);
      toast.success('Video validated successfully');
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !title.trim()) {
      toast.error("Please provide a title and select a video");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload video to storage
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("surf-videos")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("surf-videos")
        .getPublicUrl(fileName);

      // Create surf post
      const { error: insertError } = await supabase.from("surf_posts").insert({
        creator_user_id: user.id,
        title: title.trim(),
        spot_text: spot.trim() || null,
        tags: selectedTags,
        media_url: publicUrl,
        status: "ready",
      });

      if (insertError) throw insertError;

      toast.success("Uploading… We'll publish when it's ready.");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setTitle("");
      setSpot("");
      setSelectedTags([]);
      setVideoFile(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed. Try a smaller file or a different format.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Surf Clip</DialogTitle>
          <DialogDescription>
            Share your best clip—max 120 seconds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Epic barrel at Pipeline"
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">{title.length}/80</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spot">Spot/Beach</Label>
            <Input
              id="spot"
              value={spot}
              onChange={(e) => setSpot(e.target.value)}
              placeholder="Pipeline, North Shore"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {SURF_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer capitalize transition-smooth hover:scale-105"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Video File * (max 250MB)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-smooth">
              {videoFile ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate">{videoFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVideoFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                  <Input
                    id="video"
                    type="file"
                    accept="video/mp4,video/quicktime"
                    onChange={handleFileChange}
                    className="max-w-xs mx-auto"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    MP4 or MOV format
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1 gradient-primary"
              disabled={uploading || !videoFile || !title.trim()}
            >
              {uploading ? "Uploading..." : "Post Video"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};