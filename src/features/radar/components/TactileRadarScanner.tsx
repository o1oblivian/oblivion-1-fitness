import React from 'react';

interface TacticalRadarScannerProps {
  radiusKm?: number;
  className?: string;
}

export const TacticalRadarScanner: React.FC<TacticalRadarScannerProps> = ({
  radiusKm = 5,
  className = '',
}) => {
  return (
    <div
      id="tactical-radar-scanner"
      className={`w-full max-w-[320px] mx-auto flex flex-col items-center justify-center select-none ${className}`}
      aria-label="Tactical Proximity Radar Scanner"
    >
      {/* Concentric Range Rings Container */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
        {/* Outer Ring: 100% boundary */}
        <div className="absolute inset-0 rounded-full border border-dashed border-white/[0.07] transition-colors" />

        {/* Middle Ring: ~66% range */}
        <div className="absolute w-[68%] h-[68%] rounded-full border border-dashed border-white/[0.07] transition-colors" />

        {/* Inner Ring: ~36% range */}
        <div className="absolute w-[36%] h-[36%] rounded-full border border-dashed border-white/[0.07] transition-colors" />

        {/* Subtle Crosshairs */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-px bg-white/[0.08] pointer-events-none" />
        <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-px bg-white/[0.08] pointer-events-none" />

        {/* Rotating Radar Sweep Line with Crimson Gradient Tail */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none animate-[spin_4s_linear_infinite]">
          <div
            className="w-1/2 h-1/2 absolute top-0 right-0 origin-bottom-left"
            style={{
              background:
                'conic-gradient(from 0deg at 0% 100%, rgba(196,18,26, 0.45) 0deg, rgba(196,18,26, 0.12) 35deg, transparent 75deg)',
            }}
          />
          {/* Leading Crimson Edge Line */}
          <div className="absolute top-0 left-1/2 w-px h-1/2 bg-gradient-to-b from-o1-crimson via-o1-crimson/80 to-transparent " />
        </div>

        {/* Center Pulsing Blip Beacon */}
        <div className="relative z-10 flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-o1-crimson opacity-70" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-o1-crimson " />
        </div>

        {/* Tactical Corner Reticle Markers */}
        <span className="absolute top-1 left-1 font-mono text-[8px] tracking-widest text-neutral-600">
          000°
        </span>
        <span className="absolute top-1 right-1 font-mono text-[8px] tracking-widest text-neutral-600">
          090°
        </span>
        <span className="absolute bottom-1 right-1 font-mono text-[8px] tracking-widest text-neutral-600">
          180°
        </span>
        <span className="absolute bottom-1 left-1 font-mono text-[8px] tracking-widest text-neutral-600">
          270°
        </span>
      </div>

      {/* Tactical Status Text Beneath Scanner */}
      <div className="mt-4 px-3 py-1.5 rounded-full bg-o1-well border border-white/[0.07] text-center shadow-xs">
        <p className="font-mono text-[9.5px] sm:text-[10px] font-bold tracking-wider text-neutral-300 whitespace-nowrap">
          BEACON SEARCH FREQUENCY: ACTIVE // {radiusKm}KM RADIUS
        </p>
      </div>
    </div>
  );
};

export default TacticalRadarScanner;
