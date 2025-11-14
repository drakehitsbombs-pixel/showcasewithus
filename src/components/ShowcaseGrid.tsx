import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import showcase1 from "@/assets/showcase-1.jpg";
import showcase2 from "@/assets/showcase-2.jpg";
import showcase3 from "@/assets/showcase-3.jpg";
import showcase4 from "@/assets/showcase-4.jpg";
import showcase5 from "@/assets/showcase-5.jpg";
import showcase6 from "@/assets/showcase-6.jpg";

const showcaseImages = [
  { id: 1, url: showcase1, alt: "Lake portrait" },
  { id: 2, url: showcase2, alt: "Automotive photography" },
  { id: 3, url: showcase3, alt: "Winter portrait" },
  { id: 4, url: showcase4, alt: "Urban portrait" },
  { id: 5, url: showcase5, alt: "Artistic portrait" },
  { id: 6, url: showcase6, alt: "Automotive lifestyle" },
];

export function ShowcaseGrid() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
