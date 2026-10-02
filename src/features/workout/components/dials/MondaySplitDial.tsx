import React from 'react';
import { DialComponentProps } from './dialTypes';

/**
 * Monday - Aerospace Split Cockpit (Screenshot 1 Style)
 * Asymmetrical HUD with thick lines and bold visual substance.
 */
export const MondaySplitDial: React.FC<DialComponentProps> = ({
  steps,
  stepTarget = 10000,
  burnKcal,
  goalMove = 600,
  distKm,
  goalDist = 8,
  intakeKcal,
}) => {
  const stepsPct = Math.min(100, Math.round((steps / Math.max(1, stepTarget)) * 100));
  const burnPct = Math.min(100, Math.round((burnKcal / Math.max(1, goalMove)) * 100));
  const distPct = Math.min(100, Math.round((distKm / Math.max(1, goalDist)) * 100));
  const intakePct = Math.min(100, Math.round((intakeKcal / 2200) * 100));

  return (
    <div className="relative w-full h-[230px] max-w-[320px] mx-auto flex items-center justify-between px-3 select-none pointer-events-none">
      {/* Left Flank: Giant Steps Count + Thicker Vertical Hairline Rail */}
      <div className="flex items-center gap-3">
        <div className="w-[3.5px] h-28 bg-white/20 rounded-full relative overflow-hidden">
          <div
            className="w-full bg-[#C4121A] transition-all duration-500 absolute bottom-0 rounded-full"
            style={{ height: `${stepsPct}%` }}
          />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-sans font-black text-5xl text-white tracking-tight leading-none tabular-nums drop-shadow-md">
            {steps.toLocaleString()}
          </span>
          <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-neutral-300 uppercase mt-1.5">
            STEPS
          </span>
        </div>
      </div>

      {/* Right Flank: 3 Stacked Micro-Meters with Thicker Gauges */}
      <div className="flex flex-col gap-3.5 min-w-[115px] text-right">
        {/* Burn */}
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1 text-white font-mono">
            <span className="text-base font-black tabular-nums">{burnKcal}</span>
            <span className="text-[10px] font-black text-[#C4121A] tracking-wider">BURN</span>
          </div>
          <div className="w-24 h-[4px] bg-white/20 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-[#C4121A] transition-all rounded-full" style={{ width: `${burnPct}%` }} />
          </div>
        </div>

        {/* Intake */}
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1 text-white font-mono">
            <span className="text-base font-black tabular-nums">{intakeKcal}</span>
            <span className="text-[10px] font-black text-[#f59e0b] tracking-wider">INTAKE</span>
          </div>
          <div className="w-24 h-[4px] bg-white/20 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-[#f59e0b] transition-all rounded-full" style={{ width: `${intakePct}%` }} />
          </div>
        </div>

        {/* Distance */}
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1 text-white font-mono">
            <span className="text-base font-black tabular-nums">{distKm.toFixed(1)} km</span>
            <span className="text-[10px] font-black text-[#0284c7] tracking-wider">DIST</span>
          </div>
          <div className="w-24 h-[4px] bg-white/20 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-[#0284c7] transition-all rounded-full" style={{ width: `${distPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MondaySplitDial;
