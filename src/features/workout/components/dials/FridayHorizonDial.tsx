import React from 'react';
import { DialComponentProps, describeArc } from './dialTypes';
import {
  CRIMSON,
  SKY,
  HAIR_SOFT,
  fmtInt,
  fmtKm,
  heroShadow,
  pct,
} from './luxuryDialShared';

export const FridayHorizonDial: React.FC<DialComponentProps> = ({
  steps,
  burnKcal,
  goalMove = 600,
  distKm,
  goalDist = 8,
  intakeKcal,
  splitLabel,
}) => {
  const burnPct = pct(burnKcal, goalMove);
  const distPct = pct(distKm, goalDist);
  const leftTrack = describeArc(40, 110, 78, 210, 330);
  const rightTrack = describeArc(240, 110, 78, 30, 150);
  const leftFill =
    burnPct > 0.4 ? describeArc(40, 110, 78, 210, 210 + (120 * burnPct) / 100) : null;
  const rightFill =
    distPct > 0.4 ? describeArc(240, 110, 78, 30, 30 + (120 * distPct) / 100) : null;

  return (
    <div className="relative w-[280px] h-[220px] mx-auto flex items-center justify-center select-none pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 220" fill="none">
        <path d={leftTrack} stroke={HAIR_SOFT} strokeWidth="1.15" strokeLinecap="round" />
        <path d={rightTrack} stroke={HAIR_SOFT} strokeWidth="1.15" strokeLinecap="round" />
        {leftFill && <path d={leftFill} stroke={CRIMSON} strokeWidth="1.4" strokeLinecap="round" />}
        {rightFill && <path d={rightFill} stroke={SKY} strokeWidth="1.4" strokeLinecap="round" />}
        <line x1="108" y1="110" x2="128" y2="110" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
        <line x1="152" y1="110" x2="172" y2="110" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      </svg>
      <div className="relative z-10 flex flex-col items-center text-center">
        <span className="text-[46px] leading-none font-semibold tracking-tight text-white tabular-nums" style={heroShadow}>
          {fmtInt(steps)}
        </span>
        <span className="mt-1.5 text-[9px] font-medium tracking-[0.28em] uppercase text-white/55">
          {splitLabel || 'Horizon'}
        </span>
        <div className="mt-4 flex items-center gap-5 text-[9px] tracking-[0.14em] uppercase text-white/75">
          <span>
            <span className="text-o1-crimson">{fmtInt(burnKcal)}</span> kcal
          </span>
          <span>
            <span className="text-[#d97706]">{fmtInt(intakeKcal)}</span> in
          </span>
          <span>
            <span className="text-[#0284c7]">{fmtKm(distKm)}</span> km
          </span>
        </div>
      </div>
    </div>
  );
};

export default FridayHorizonDial;
