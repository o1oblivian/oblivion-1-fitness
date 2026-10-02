import React from 'react';
import { DialComponentProps } from './dialTypes';

/**
 * Wednesday - Horizontal F1 Telemetry Rack (Screenshot 3 Style)
 * Non-circular, pure horizontal linear bar matrix with thick elements.
 */
export const WednesdayF1Dial: React.FC<DialComponentProps> = ({
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
  const intakePct = Math.min(100, Math.round((intakeKcal / 2200) * 100));
  const distPct = Math.min(100, Math.round((distKm / Math.max(1, goalDist)) * 100));

  const telemetryRows = [
    { label: 'STEPS', val: `${stepsPct}%`, pct: stepsPct, color: 'bg-white' },
    { label: 'BURN', val: `${burnKcal} kcal`, pct: burnPct, color: 'bg-[#C4121A]' },
    { label: 'INTAKE', val: `${intakeKcal} kcal`, pct: intakePct, color: 'bg-[#f59e0b]' },
    { label: 'DIST', val: `${distKm.toFixed(2)} km`, pct: distPct, color: 'bg-[#0284c7]' },
  ];

  return (
    <div className="relative w-full max-w-[315px] mx-auto flex flex-col items-center justify-center select-none pointer-events-none py-2">
      {/* Primary Big Step Readout */}
      <span className="font-sans font-black text-6xl text-white tracking-tight leading-none tabular-nums drop-shadow-md">
        {steps.toLocaleString()}
      </span>
      <span className="text-[11px] font-mono font-black tracking-[0.25em] text-neutral-300 uppercase mt-1 mb-3.5 drop-shadow-xs">
        STEPS TODAY
      </span>

      {/* 4 Linear Telemetry Rows with Thicker Gauges */}
      <div className="w-full space-y-3 px-3">
        {telemetryRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-xs font-mono">
            <span className="w-14 text-[11px] text-neutral-300 font-black text-left tracking-wider">{row.label}</span>
            <div className="flex-1 h-[5.5px] bg-white/20 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full ${row.color} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.max(4, row.pct)}%` }}
              />
            </div>
            <span className="w-18 text-[11px] text-white font-extrabold text-right tabular-nums">{row.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WednesdayF1Dial;
