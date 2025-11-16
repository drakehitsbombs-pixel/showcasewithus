const SurfingLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="relative w-64 h-64">
        {/* Wave Animation */}
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
          <svg className="wave-svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
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

        {/* Surfer */}
        <div className="surfer absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Surfboard */}
          <div className="surfboard absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-white rounded-full shadow-lg transform rotate-12"></div>
          
          {/* Surfer Body */}
          <div className="surfer-body absolute bottom-3 left-1/2 -translate-x-1/2">
            {/* Head */}
            <div className="w-6 h-6 bg-[var(--cp-gold)] rounded-full mx-auto mb-1"></div>
            {/* Body */}
            <div className="w-4 h-8 bg-[var(--cp-green)] rounded-lg mx-auto"></div>
            {/* Arms */}
            <div className="absolute top-3 -left-2 w-8 h-1 bg-[var(--cp-green)] rounded-full transform -rotate-45"></div>
            <div className="absolute top-3 -right-2 w-8 h-1 bg-[var(--cp-green)] rounded-full transform rotate-45"></div>
            {/* Legs */}
            <div className="absolute -bottom-4 left-0 w-2 h-6 bg-[var(--cp-green)] rounded"></div>
            <div className="absolute -bottom-4 right-0 w-2 h-6 bg-[var(--cp-green)] rounded"></div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-[var(--cp-green)]">Finding photographers...</p>
        <p className="text-sm text-[var(--muted)]">Hang loose while we catch the perfect match</p>
      </div>

      <style>{`
        .wave-svg {
          width: 100%;
          height: 100%;
        }

        .wave-path {
          animation: wave-animation 3s ease-in-out infinite;
        }

        .wave-1 {
          animation-delay: 0s;
        }

        .wave-2 {
          animation-delay: 0.5s;
        }

        .wave-3 {
          animation-delay: 1s;
        }

        @keyframes wave-animation {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(-5%) translateY(-8px);
          }
          50% {
            transform: translateX(-10%) translateY(0);
          }
          75% {
            transform: translateX(-5%) translateY(8px);
          }
        }

        .surfer {
          animation: surfer-ride 2s ease-in-out infinite;
        }

        @keyframes surfer-ride {
          0%, 100% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          25% {
            transform: translate(-50%, -55%) rotate(-5deg);
          }
          50% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          75% {
            transform: translate(-50%, -45%) rotate(5deg);
          }
        }

        .surfboard {
          animation: board-tilt 2s ease-in-out infinite;
        }

        @keyframes board-tilt {
          0%, 100% {
            transform: translateX(-50%) rotate(8deg);
          }
          50% {
            transform: translateX(-50%) rotate(16deg);
          }
        }
      `}</style>
    </div>
  );
};

export default SurfingLoader;
