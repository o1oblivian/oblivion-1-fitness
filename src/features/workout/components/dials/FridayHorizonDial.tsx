import React from 'react';
import { DialComponentProps } from './dialTypes';

/**
 * Friday - Dual-Arc Horizon Level (Aviation Pitch / Gyro Indicator)
 * Opposing lateral arcs with substantial stroke weight.
 */
export const FridayHorizonDial: React.FC<DialComponentProps> = ({
  steps,
  burnKcal,
  distKm,
  splitLabel,
}) => {
  return (
    <div className="relative w-[280px] h-[220px] mx-auto flex items-center justify-center select-none pointer-events-none">
      {/* SVG Lateral Arcs & Horizon Reticle - Thicker Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 280 220" fill="none">
        {/* Left Arc: Burn */}
        <path d="M 40 40 A 100 100 0 0 0 40 180" stroke="#C4121A" strokeWidth="2.5" strokeLinecap="round" />
        {/* Left Arc Ticks */}
        <line x1="26" y1="70" x2="42" y2="70" stroke="#C4121A" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="18" y1="110" x2="40" y2="110" stroke="#C4121A" strokeWidth="3" strokeLinecap="round" />
        <line x1="26" y1="150" x2="42" y2="150" stroke="#C4121A" strokeWidth="2.5" strokeLinecap="round" />

        {/* Right Arc: Distance */}
        <path d="M 240 40 A 100 100 0 0 1 240 180" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
        {/* Right Arc Ticks */}
        <line x1="238" y1="70" x2="254" y2="70" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="240" y1="110" x2="262" y2="110" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
        <line x1="238" y1="150" x2="254" y2="150" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />

        {/* Center Artificial Horizon Line */}
        <line x1="70" y1="110" x2="115" y2="110" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="140" cy="110" r="4" stroke="#f59e0b" strokeWidth="2" fill="rgba(245,158,11,0.2)" />
        <line x1="165" y1="110" x2="210" y2="110" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Center Flight Computer Reading */}
      <div className="relative flex flex-col items-center justify-center text-center z-10">
        <span className="font-sans font-black text-5xl text-white tracking-tight leading-none tabular-nums drop-shadow-md">
          {steps.toLocaleString()}
        </span>
        <span className="text-[11px] font-mono font-black tracking-[0.2em] text-neutral-200 uppercase mt-1">
          STEPS ALTITUDE
        </span>

        {/* Lateral Labels */}
        <div className="flex items-center justify-between w-[210px] mt-6 text-[11px] font-mono font-black">
          <span className="text-[#C4121A] drop-shadow-xs">{burnKcal} KCAL</span>
          <span className="text-white/80 tracking-wider uppercase text-[10px]">{splitLabel || 'PULL'}</span>
          <span className="text-[#0284c7] drop-shadow-xs">{distKm.toFixed(1)} KM</span>
        </div>
      </div>
    </div>
  );
};

export default FridayHorizonDial;
