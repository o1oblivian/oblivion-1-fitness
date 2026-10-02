import React from 'react';
import { DialComponentProps } from './dialTypes';

/**
 * Saturday - Modular Quad-Quadrant HUD
 * 4 balanced telemetry sectors with bold crosshairs and zero foggy patches.
 */
export const SaturdayQuadrantDial: React.FC<DialComponentProps> = ({
  steps,
  burnKcal,
  distKm,
  intakeKcal,
  activeDay,
  splitLabel,
}) => {
  return (
    <div className="relative w-[270px] h-[230px] mx-auto select-none pointer-events-none p-2 flex flex-col justify-between bg-transparent">
      {/* Hairline Crosshair Reticle - Pure Crisp Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 270 230" fill="none">
        <line x1="135" y1="12" x2="135" y2="218" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeDasharray="4 4" />
        <line x1="15" y1="115" x2="255" y2="115" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeDasharray="4 4" />
        {/* Corner framing brackets */}
        <path d="M 22 36 L 22 22 L 36 22" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 248 36 L 248 22 L 234 22" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 22 194 L 22 208 L 36 208" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 248 194 L 248 208 L 234 208" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Center Tactical Badge - Transparent, zero dark fog */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="px-3 py-1 rounded-md bg-transparent border border-white/40 text-[10px] font-mono font-black text-white uppercase tracking-wider z-20">
          <span className="text-[#C4121A]">{activeDay}</span> | {splitLabel || 'LEGS B'}
        </div>
      </div>

      {/* Top 2 Quadrants */}
      <div className="flex items-center justify-between px-3 z-10">
        {/* Q1: Steps */}
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-mono font-black text-neutral-300">01 / STEPS</span>
          <span className="font-sans font-black text-2xl text-white tabular-nums leading-tight">
            {steps.toLocaleString()}
          </span>
        </div>
        {/* Q2: Burn */}
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-mono font-black text-[#C4121A]">02 / BURN</span>
          <span className="font-sans font-black text-2xl text-white tabular-nums leading-tight">
            {burnKcal} <span className="text-xs font-normal text-neutral-200">kcal</span>
          </span>
        </div>
      </div>

      {/* Bottom 2 Quadrants */}
      <div className="flex items-center justify-between px-3 z-10">
        {/* Q3: Distance */}
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-mono font-black text-[#0284c7]">03 / DISTANCE</span>
          <span className="font-sans font-black text-2xl text-white tabular-nums leading-tight">
            {distKm.toFixed(1)} <span className="text-xs font-normal text-neutral-200">km</span>
          </span>
        </div>
        {/* Q4: Intake */}
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-mono font-black text-[#f59e0b]">04 / INTAKE</span>
          <span className="font-sans font-black text-2xl text-white tabular-nums leading-tight">
            {intakeKcal} <span className="text-xs font-normal text-neutral-200">kcal</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SaturdayQuadrantDial;
