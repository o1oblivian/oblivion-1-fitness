import React from 'react';
import { DialComponentProps } from './dialTypes';

/**
 * Sunday - Minimalist Restoration Monolith (Zen Rest Day Horizon)
 * Clean, low-strain architecture with zero dark fog.
 */
export const SundayRestorationDial: React.FC<DialComponentProps> = ({
  steps,
  distKm,
  burnKcal,
}) => {
  return (
    <div className="relative w-full max-w-[300px] h-[210px] mx-auto flex flex-col items-center justify-between select-none pointer-events-none py-2 px-3 bg-transparent">
      {/* Top Header */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-mono font-black tracking-[0.3em] text-[#10b981] uppercase">
          REST &amp; RESTORATION
        </span>
        <span className="text-xs font-sans text-neutral-200 font-semibold mt-0.5">
          Active Recovery Protocol
        </span>
      </div>

      {/* Center Giant Rest Baseline Readout */}
      <div className="flex flex-col items-center my-1">
        <span className="font-sans font-black text-5xl text-white tracking-tight leading-none tabular-nums">
          {steps.toLocaleString()}
        </span>
        <span className="text-[10px] font-mono font-black tracking-[0.2em] text-neutral-300 uppercase mt-1">
          BASE STEPS
        </span>
      </div>

      {/* Solid Recovery Horizon Track - Zero Fog */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full h-[3.5px] bg-white/25 rounded-full relative my-1">
          <div className="absolute left-[38%] top-[-3.5px] w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-xs" />
        </div>
        <div className="flex items-center justify-between w-full text-[11px] font-mono font-bold text-neutral-200 mt-1">
          <span>{burnKcal} KCAL BURN</span>
          <span className="text-[#10b981] font-black">READY 92%</span>
          <span>{distKm.toFixed(1)} KM</span>
        </div>
      </div>
    </div>
  );
};

export default SundayRestorationDial;
