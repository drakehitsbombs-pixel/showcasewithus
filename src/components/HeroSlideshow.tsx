import heroBg from "@/assets/hero-bg.jpg";

export const HeroSlideshow = () => {
  return (
    <div 
      className="absolute inset-0 overflow-hidden" 
      aria-hidden="true"
    >
      {/* Hero background image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
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
