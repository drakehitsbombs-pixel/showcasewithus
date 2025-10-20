import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Placeholder showcase images - in production these would come from the database
const showcaseImages = [
  { id: 1, url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800", alt: "Wedding photography" },
  { id: 2, url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800", alt: "Portrait photography" },
  { id: 3, url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800", alt: "Surf photography" },
  { id: 4, url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800", alt: "Event photography" },
  { id: 5, url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800", alt: "Nature photography" },
  { id: 6, url: "https://images.unsplash.com/photo-1519167758481-83f29da8c6b3?w=800", alt: "Product photography" },
  { id: 7, url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800", alt: "Lifestyle photography" },
  { id: 8, url: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800", alt: "Portrait session" },
];

export function ShowcaseGrid() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {showcaseImages.map((image) => (
          <div
            key={image.id}
            className="group relative overflow-hidden rounded-lg cursor-pointer shadow-card hover:shadow-elevated transition-all duration-300"
            onClick={() => setSelectedImage(image.url)}
          >
            <AspectRatio ratio={3 / 4}>
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
            </AspectRatio>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Showcase image"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
