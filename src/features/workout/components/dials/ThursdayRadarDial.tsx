import React from 'react';
import { DialComponentProps } from './dialTypes';

/**
 * Thursday - Tactical Compass Radar Dial
 * Precision circular compass with outer satellite telemetry nodes.
 * 100% transparent backgrounds with zero dark fog.
 */
export const ThursdayRadarDial: React.FC<DialComponentProps> = ({
  steps,
  stepTarget = 10000,
  burnKcal,
  distKm,
  activeDay,
}) => {
  const stepsPct = Math.min(100, Math.round((steps / Math.max(1, stepTarget)) * 100));
  const cx = 130;
  const cy = 130;
  const r = 112;

  return (
    <div className="relative w-[270px] h-[270px] mx-auto flex items-center justify-center select-none pointer-events-none bg-transparent">
      {/* Outer Tactical Compass Radar Reticle */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 260 260" fill="none">
        {/* Outer Ring - Solid 2px stroke */}
        <circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={r - 14} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="6 4" />

        {/* 4 Cardinal Crosshair Extensions (Border only, NOT crossing the center) */}
        <line x1={cx} y1={6} x2={cx} y2={22} stroke="#C4121A" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={cx} y1={238} x2={cx} y2={254} stroke="#C4121A" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={6} y1={cy} x2={22} y2={cy} stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={238} y1={cy} x2={254} y2={cy} stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />

        {/* North Indicator Chevron */}
        <polygon points={`${cx},14 ${cx - 5},24 ${cx + 5},24`} fill="#C4121A" />

        {/* 12-Hour Compass Tick Marks */}
        {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => (
          <line
            key={deg}
            x1={cx}
            y1={cy - r + 3}
            x2={cx}
            y2={cy - r + 11}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.8"
            transform={`rotate(${deg} ${cx} ${cy})`}
          />
        ))}

        {/* Outer Satellite Indicator Rings */}
        <circle cx={cx} cy={cy - r} r="3.5" fill="#C4121A" />
        <circle cx={cx + r} cy={cy} r="3.5" fill="#0284c7" />
        <circle cx={cx} cy={cy + r} r="3.5" fill="#C4121A" />
        <circle cx={cx - r} cy={cy} r="3.5" fill="#f59e0b" />
      </svg>

      {/* Center Tactical Telemetry Stack - Completely Unobstructed & Zero Fog */}
      <div className="relative flex flex-col items-center justify-center text-center z-10 pointer-events-none">
        {/* Big Crisp Step Count */}
        <span className="font-sans font-black text-6xl text-white tracking-tight leading-none tabular-nums">
          {steps.toLocaleString()}
        </span>

        {/* Tactical Subtitle */}
        <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#f59e0b] uppercase mt-2">
          {activeDay || 'THU'} • TENSILE STRAIN
        </span>

        {/* Bottom Metrics Row */}
        <div className="flex items-center justify-center gap-4 mt-2.5">
          <div className="flex items-baseline gap-1 text-[#C4121A]">
            <span className="font-mono font-black text-base tabular-nums leading-none">
              {burnKcal}
            </span>
            <span className="font-sans font-bold text-xs tracking-wider uppercase text-white">
              KCAL
            </span>
          </div>

          <span className="text-white/40 text-xs select-none">•</span>

          <div className="flex items-baseline gap-1 text-[#0284c7]">
            <span className="font-mono font-black text-base tabular-nums leading-none">
              {distKm.toFixed(1)}
            </span>
            <span className="font-sans font-bold text-xs tracking-wider uppercase text-white">
              KM
            </span>
          </div>
        </div>

        {/* Target Progress Badge - Pure transparent, zero dark fog */}
        <div className="mt-2 px-2.5 py-0.5 rounded-full border border-white/30 text-[9px] font-mono font-bold text-white bg-transparent">
          RADAR 360° • {stepsPct}% TARGET
        </div>
      </div>
    </div>
  );
};

export default ThursdayRadarDial;
