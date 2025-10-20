export const HeroSlideshow = () => {
  return (
    <div 
      className="absolute inset-0 overflow-hidden" 
      aria-hidden="true"
    >
      {/* Hero background image */}
      <div className="absolute inset-0">
        <img
          srcSet="/hero-bg-mobile.webp 828w, /hero-bg-optimized.webp 1920w"
          sizes="(max-width: 768px) 828px, 1920px"
          src="/hero-bg-optimized.webp"
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      
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
