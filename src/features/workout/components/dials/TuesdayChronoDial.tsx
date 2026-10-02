import React from 'react';
import { DialComponentProps } from './dialTypes';

/**
 * Tuesday - Horology Precision Chronograph (Luxury Sports Watch)
 * Crystal clear transparent horology dial with zero foggy dark patches.
 */
export const TuesdayChronoDial: React.FC<DialComponentProps> = ({
  steps,
  stepTarget = 10000,
  burnKcal,
  distKm,
  activeDay,
}) => {
  const stepsPct = Math.min(100, Math.round((steps / Math.max(1, stepTarget)) * 100));
  const cx = 130;
  const cy = 130;
  const r = 110;

  return (
    <div className="relative w-[260px] h-[260px] mx-auto flex items-center justify-center select-none pointer-events-none bg-transparent">
      {/* Outer 60-Tick Chronograph Bezel - Pure crisp lines, zero fog */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 260 260" fill="none">
        <circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
        {/* Cardinal North Marker */}
        <polygon points={`${cx},8 ${cx - 5},18 ${cx + 5},18`} fill="#C4121A" />
        {Array.from({ length: 60 }).map((_, i) => {
          const isMajor = i % 5 === 0;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy - r + (isMajor ? 2 : 4)}
              x2={cx}
              y2={cy - r + (isMajor ? 12 : 8)}
              stroke={isMajor ? '#f59e0b' : 'rgba(255,255,255,0.5)'}
              strokeWidth={isMajor ? 2.5 : 1.5}
              transform={`rotate(${i * 6} ${cx} ${cy})`}
            />
          );
        })}
      </svg>

      {/* Subdial 1 (Top / 12 o'clock): Goal Completion - 100% Transparent */}
      <div className="absolute top-4 flex flex-col items-center">
        <div className="w-13 h-13 rounded-full border-2 border-white/50 flex flex-col items-center justify-center bg-transparent">
          <span className="text-[11px] font-mono font-black text-white">{stepsPct}%</span>
          <span className="text-[7px] font-mono font-bold text-neutral-200">PACE</span>
        </div>
      </div>

      {/* Center Stack: Main Steps & Date Aperture - Zero Fog */}
      <div className="relative flex flex-col items-center justify-center text-center z-10 mt-3">
        <span className="font-sans font-black text-5xl text-white tracking-tight leading-none tabular-nums">
          {steps.toLocaleString()}
        </span>
        <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-sm bg-transparent border border-white/30">
          <span className="text-[10px] font-mono font-black text-[#C4121A]">{activeDay.toUpperCase()}</span>
          <span className="text-white/50 text-[9px] font-light">|</span>
          <span className="text-[10px] font-mono font-bold text-white">CHRONO</span>
        </div>
      </div>

      {/* Subdial 2 (Bottom-Left / 4 o'clock): Burn - 100% Transparent */}
      <div className="absolute bottom-4 left-7 flex flex-col items-center">
        <div className="w-13 h-13 rounded-full border-2 border-[#C4121A] flex flex-col items-center justify-center bg-transparent">
          <span className="text-[12px] font-mono font-black text-white tabular-nums">{burnKcal}</span>
          <span className="text-[7px] font-mono font-black text-[#C4121A]">KCAL</span>
        </div>
      </div>

      {/* Subdial 3 (Bottom-Right / 8 o'clock): Dist - 100% Transparent */}
      <div className="absolute bottom-4 right-7 flex flex-col items-center">
        <div className="w-13 h-13 rounded-full border-2 border-[#0284c7] flex flex-col items-center justify-center bg-transparent">
          <span className="text-[12px] font-mono font-black text-white tabular-nums">{distKm.toFixed(1)}</span>
          <span className="text-[7px] font-mono font-black text-[#0284c7]">KM</span>
        </div>
      </div>
    </div>
  );
};

export default TuesdayChronoDial;
