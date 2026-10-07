import React from 'react';
import { DialComponentProps } from './dialTypes';
import {
  CRIMSON,
  AMBER,
  SKY,
  HAIR,
  HAIR_SOFT,
  fmtInt,
  fmtKm,
  heroShadow,
  pct,
} from './luxuryDialShared';

export const WednesdayF1Dial: React.FC<DialComponentProps> = ({
  steps,
  stepTarget = 10000,
  burnKcal,
  goalMove = 600,
  distKm,
  goalDist = 8,
  intakeKcal,
}) => {
  const rows = [
    { label: 'Pace', value: steps > 0 ? `${Math.round(pct(steps, stepTarget))}%` : '—', fill: pct(steps, stepTarget), color: HAIR },
    { label: 'Burn', value: fmtInt(burnKcal), fill: pct(burnKcal, goalMove), color: CRIMSON },
    { label: 'Intake', value: fmtInt(intakeKcal), fill: pct(intakeKcal, 2200), color: AMBER },
    { label: 'Distance', value: fmtKm(distKm), fill: pct(distKm, goalDist), color: SKY },
  ];

  return (
    <div className="relative w-[300px] mx-auto flex flex-col items-center justify-center select-none pointer-events-none py-1">
      <span className="text-[52px] leading-none font-semibold tracking-tight text-white tabular-nums" style={heroShadow}>
        {fmtInt(steps)}
      </span>
      <span className="mt-1.5 mb-5 text-[9px] font-medium tracking-[0.28em] uppercase text-white/55">Steps today</span>
      <div className="w-full space-y-2.5 px-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-14 text-[8px] tracking-[0.16em] uppercase text-white/45">{row.label}</span>
            <div className="flex-1 h-[1.5px] rounded-full overflow-hidden" style={{ background: HAIR_SOFT }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${row.fill}%`, background: row.color }}
              />
            </div>
            <span className="w-12 text-right text-[11px] font-medium tabular-nums text-white">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WednesdayF1Dial;
