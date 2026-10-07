import React from 'react';
import { DialComponentProps } from './dialTypes';
import { fmtInt, fmtKm, heroShadow, HAIR_SOFT } from './luxuryDialShared';

export const SaturdayQuadrantDial: React.FC<DialComponentProps> = ({
  steps,
  burnKcal,
  distKm,
  intakeKcal,
  activeDay,
  splitLabel,
}) => {
  const cells = [
    { id: '01', label: 'Steps', value: fmtInt(steps), align: 'text-left' },
    { id: '02', label: 'Burn', value: fmtInt(burnKcal), align: 'text-right' },
    { id: '03', label: 'Distance', value: fmtKm(distKm), align: 'text-left' },
    { id: '04', label: 'Intake', value: fmtInt(intakeKcal), align: 'text-right' },
  ];

  return (
    <div className="relative w-[260px] h-[220px] mx-auto select-none pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 260 220" fill="none">
        <line x1="130" y1="18" x2="130" y2="202" stroke={HAIR_SOFT} strokeWidth="1" />
        <line x1="18" y1="110" x2="242" y2="110" stroke={HAIR_SOFT} strokeWidth="1" />
      </svg>
      <div className="absolute top-3 left-0 right-0 text-center pointer-events-none z-10">
        <span className="text-[9px] tracking-[0.22em] uppercase text-white/55">
          {activeDay} · {splitLabel || 'Session'}
        </span>
      </div>
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 p-6 pt-9">
        {cells.map((cell) => (
          <div key={cell.id} className={`flex flex-col justify-center ${cell.align} px-3`}>
            <span className="text-[8px] tracking-[0.2em] uppercase text-white/40">
              {cell.id} {cell.label}
            </span>
            <span className="mt-1 text-[22px] font-semibold tracking-tight text-white tabular-nums" style={heroShadow}>
              {cell.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SaturdayQuadrantDial;
