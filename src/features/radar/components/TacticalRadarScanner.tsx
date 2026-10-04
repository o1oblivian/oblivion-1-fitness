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
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-dashed border-slate-300 dark:border-neutral-800 transition-colors" />
        <div className="absolute w-[68%] h-[68%] rounded-full border border-dashed border-slate-300 dark:border-neutral-800 transition-colors" />
        <div className="absolute w-[36%] h-[36%] rounded-full border border-dashed border-slate-300 dark:border-neutral-800 transition-colors" />

        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-px bg-slate-200/80 dark:bg-neutral-800/80 pointer-events-none" />
        <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-px bg-slate-200/80 dark:bg-neutral-800/80 pointer-events-none" />

        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none animate-[spin_4s_linear_infinite]">
          <div
            className="w-1/2 h-1/2 absolute top-0 right-0 origin-bottom-left"
            style={{
              background:
                'conic-gradient(from 0deg at 0% 100%, rgba(229, 9, 20, 0.45) 0deg, rgba(229, 9, 20, 0.12) 35deg, transparent 75deg)',
            }}
          />
          <div className="absolute top-0 left-1/2 w-px h-1/2 bg-gradient-to-b from-[#E50914] via-[#E50914]/80 to-transparent shadow-[0_0_8px_rgba(229,9,20,0.6)]" />
        </div>

        <div className="relative z-10 flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-[#E50914] opacity-70" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.9)]" />
        </div>

        <span className="absolute top-1 left-1 font-mono text-[8px] tracking-widest text-slate-400 dark:text-neutral-600">
          000°
        </span>
        <span className="absolute top-1 right-1 font-mono text-[8px] tracking-widest text-slate-400 dark:text-neutral-600">
          090°
        </span>
        <span className="absolute bottom-1 right-1 font-mono text-[8px] tracking-widest text-slate-400 dark:text-neutral-600">
          180°
        </span>
        <span className="absolute bottom-1 left-1 font-mono text-[8px] tracking-widest text-slate-400 dark:text-neutral-600">
          270°
        </span>
      </div>

      <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 text-center shadow-xs">
        <p className="font-mono text-[9.5px] sm:text-[10px] font-bold tracking-wider text-neutral-600 dark:text-neutral-300 uppercase whitespace-nowrap">
          BEACON SEARCH FREQUENCY: ACTIVE // {radiusKm}KM RADIUS
        </p>
      </div>
    </div>
  );
};

export default TacticalRadarScanner;
