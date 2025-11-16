const SurfingLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className="relative w-full max-w-md h-32">
        {/* Wave Animation */}
        <svg className="wave-svg w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path 
            className="wave-path wave-1" 
            d="M0,60 C150,100 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z"
            fill="var(--cp-green)"
            opacity="0.3"
          />
          <path 
            className="wave-path wave-2" 
            d="M0,60 C150,100 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z"
            fill="var(--cp-green)"
            opacity="0.5"
          />
          <path 
            className="wave-path wave-3" 
            d="M0,60 C150,100 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z"
            fill="var(--cp-green)"
          />
        </svg>
      </div>

      <style>{`
        .wave-path {
          animation: wave-animation 2.5s ease-in-out infinite;
        }

        .wave-1 {
          animation-delay: 0s;
        }

        .wave-2 {
          animation-delay: 0.4s;
        }

        .wave-3 {
          animation-delay: 0.8s;
        }

        @keyframes wave-animation {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(-3%) translateY(-6px);
          }
          50% {
            transform: translateX(-6%) translateY(0);
          }
          75% {
            transform: translateX(-3%) translateY(6px);
          }
        }
      `}</style>
    </div>
  );
};

export default SurfingLoader;
