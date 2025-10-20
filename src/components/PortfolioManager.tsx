import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Upload, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PortfolioImage {
  id: string;
  url: string;
  tags: string[];
  created_at: string;
}

interface PortfolioManagerProps {
  userId: string;
  images: PortfolioImage[];
  onUpdate: () => void;
}

export const PortfolioManager = ({ userId, images, onUpdate }: PortfolioManagerProps) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("portfolio_images")
        .delete()
        .in("id", selectedImages);

      if (error) throw error;

      toast.success(`Deleted ${selectedImages.length} image(s)`);
      setSelectedImages([]);
      setDeleteDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete images");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setUploading(true);
    const files = Array.from(e.target.files);

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("portfolios")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("portfolios")
          .getPublicUrl(fileName);

        await supabase.from("portfolio_images").insert({
          creator_user_id: userId,
          url: publicUrl,
          tags: [],
        });
      }

      toast.success(`Uploaded ${files.length} image(s)`);
      onUpdate();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portfolio Images</CardTitle>
              <CardDescription>Manage your portfolio gallery</CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedImages.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedImages.length})
                </Button>
              )}
              <Button size="sm" disabled={uploading} asChild>
                <label htmlFor="portfolio-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload"}
                </label>
              </Button>
              <input
                id="portfolio-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No portfolio images yet</p>
              <p className="text-sm mt-1">Upload your first image to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedImages.includes(image.id)
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleImageSelect(image.id)}
                >
                  <img
                    src={image.url}
                    alt="Portfolio"
                    className="w-full h-full object-cover"
                  />
                  {selectedImages.includes(image.id) && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Images?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedImages.length} image(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
