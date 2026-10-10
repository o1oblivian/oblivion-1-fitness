import React from 'react';
import { DialComponentProps } from './dialTypes';
import {
  CRIMSON,
  AMBER,
  SKY,
  HAIR_SOFT,
  fmtInt,
  fmtKm,
  heroShadow,
  pct,
} from './luxuryDialShared';

export const MondaySplitDial: React.FC<DialComponentProps> = ({
  steps,
  stepTarget = 10000,
  burnKcal,
  goalMove = 600,
  distKm,
  goalDist = 8,
  intakeKcal,
}) => {
  const rails = [
    { label: 'Burn', value: fmtInt(burnKcal), fill: pct(burnKcal, goalMove), color: CRIMSON },
    { label: 'Intake', value: fmtInt(intakeKcal), fill: pct(intakeKcal, 2200), color: AMBER },
    { label: 'Dist', value: fmtKm(distKm), fill: pct(distKm, goalDist), color: SKY },
  ];

  return (
    <div className="relative w-[280px] h-[220px] mx-auto flex items-center justify-between px-1 select-none pointer-events-none">
      <div className="flex items-end gap-3">
        <div className="relative w-[2px] h-[118px] rounded-full overflow-hidden" style={{ background: HAIR_SOFT }}>
          <div
            className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-700"
            style={{ height: `${pct(steps, stepTarget)}%`, background: CRIMSON }}
          />
        </div>
        <div>
          <span className="block text-[48px] leading-none font-semibold tracking-tight text-white tabular-nums" style={heroShadow}>
            {fmtInt(steps)}
          </span>
          <span className="mt-2 block text-[9px] font-medium tracking-[0.28em] text-white/55">Steps</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-[108px]">
        {rails.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[8px] tracking-[0.18em] text-white/45">{row.label}</span>
              <span className="text-[12px] font-medium tabular-nums text-white">{row.value}</span>
            </div>
            <div className="h-[1.5px] w-full rounded-full overflow-hidden" style={{ background: HAIR_SOFT }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${row.fill}%`, background: row.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MondaySplitDial;
