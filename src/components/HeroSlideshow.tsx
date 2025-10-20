import heroSunset from "@/assets/hero-sunset.jpg";

export const HeroSlideshow = () => {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Hero background image */}
      <div className="absolute inset-0">
        <img
          src={heroSunset}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
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
