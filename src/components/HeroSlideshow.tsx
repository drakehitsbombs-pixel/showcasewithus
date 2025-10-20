import { useState, useEffect } from "react";
import heroWedding1 from "@/assets/hero-wedding-1.jpg";
import heroWedding2 from "@/assets/hero-wedding-2.jpg";
import heroSurf1 from "@/assets/hero-surf-1.jpg";
import heroSurf2 from "@/assets/hero-surf-2.jpg";
import heroPortrait1 from "@/assets/hero-portrait-1.jpg";
import heroLifestyle1 from "@/assets/hero-lifestyle-1.jpg";

const heroImages = [
  heroWedding1,
  heroSurf1,
  heroPortrait1,
  heroWedding2,
  heroSurf2,
  heroLifestyle1,
];

export const HeroSlideshow = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Check for reduced motion preference
  const prefersReducedMotion = 
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    // Don't animate if user prefers reduced motion
    if (prefersReducedMotion) return;

    // Pause when tab is not visible
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = setInterval(() => {
      if (!isPaused && !document.hidden) {
        setCurrentIndex((prev) => (prev + 1) % heroImages.length);
      }
    }, 5000); // Cross-fade every 5 seconds

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPaused, prefersReducedMotion]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Image slides */}
      <div className="relative w-full h-full">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity: prefersReducedMotion
                ? index === 0
                  ? 1
                  : 0
                : currentIndex === index
                ? 1
                : 0,
              zIndex: currentIndex === index ? 1 : 0,
            }}
          >
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
            />
          </div>
        ))}
      </div>

      {/* Diagonal gradient overlay for text legibility */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(11, 11, 15, 0.7) 0%, rgba(11, 11, 15, 0.2) 50%, rgba(11, 11, 15, 0.6) 100%)",
        }}
      />
    </div>
  );
};
