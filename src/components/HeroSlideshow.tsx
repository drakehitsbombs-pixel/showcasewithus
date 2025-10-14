import { useEffect, useState } from "react";
import heroSurf1 from "@/assets/hero-surf-1.jpg";
import heroSurf2 from "@/assets/hero-surf-2.jpg";
import heroWedding1 from "@/assets/hero-wedding-1.jpg";

const slides = [
  heroSurf1,
  heroSurf2,
  heroWedding1,
];

export const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsPaused(true);
      return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // 5s on desktop

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div 
      className="absolute inset-0 overflow-hidden" 
      aria-hidden="true"
    >
      {/* Slideshow images */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{
            opacity: currentSlide === index ? 1 : 0,
            zIndex: currentSlide === index ? 1 : 0,
          }}
        >
          <img
            src={slide}
            alt=""
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
      
      {/* Gradient overlay for text legibility */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(180deg, rgba(11, 11, 11, 0.5) 0%, rgba(11, 11, 11, 0) 40%, rgba(11, 11, 11, 0.35) 100%)',
        }}
      />
    </div>
  );
};
