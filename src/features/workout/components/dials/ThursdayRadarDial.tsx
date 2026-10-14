import React from 'react';
import { DialComponentProps, polarToCartesian } from './dialTypes';
import { AMBER, CRIMSON, EMERALD, HAIR, fmtInt, fmtKm, pct } from './luxuryDialShared';
import { Bezel, INK, MUTED, ProgressRing, Readout, T, Ticks } from './cockpitParts';

const C = 120;
const R = 100;
const CARD = ['N', '3', '6', 'E', '12', '15', 'S', '21', '24', 'W', '30', '33'];

/** Thursday: heading indicator. North under the lubber line means the step goal is reached. */
export const ThursdayRadarDial: React.FC<DialComponentProps> = ({ steps, stepTarget, distKm, intakeKcal, intakeGoal, burnKcal }) => {
  const heading = pct(steps, stepTarget) * 3.6;
  const deviation =
    intakeGoal > 0 && intakeKcal > 0 ? Math.max(-1, Math.min(1, (intakeKcal - intakeGoal) / intakeGoal)) * 40 : null;

  return (
    <svg width={240} height={240} viewBox="0 0 240 240" className="block max-w-full mx-auto select-none pointer-events-none" aria-hidden="true">
      <Bezel cx={C} cy={C} r={R} />
      <ProgressRing cx={C} cy={C} r={R + 3} ratio={heading / 360} color={EMERALD} />
      <g transform={`rotate(${-heading} ${C} ${C})`}>
        <Ticks cx={C} cy={C} r={R - 3} count={72} majorEvery={6} majorLen={11} minorLen={5} />
        {CARD.map((label, i) => {
          const p = polarToCartesian(C, C, R - 25, i * 30);
          const cardinal = i % 3 === 0;
          return (
            <g key={label} transform={`rotate(${i * 30} ${p.x} ${p.y})`}>
              <T x={p.x} y={p.y} size={cardinal ? 16 : 11} weight={400} mono color={label === 'N' ? AMBER : INK}>
                {label}
              </T>
            </g>
          );
        })}
        <rect x={C - 5} y={C - R - 2} width={10} height={6} fill={AMBER} />
      </g>
      <path d={`M ${C} ${C - R + 12} L ${C - 6} ${C - R - 2} L ${C + 6} ${C - R - 2} Z`} fill={CRIMSON} />
      <g stroke={INK} strokeWidth="2.2" strokeLinecap="round">
        <line x1={C} y1={C - 18} x2={C} y2={C + 16} />
        <line x1={C - 20} y1={C - 2} x2={C + 20} y2={C - 2} />
        <line x1={C - 8} y1={C + 14} x2={C + 8} y2={C + 14} />
      </g>
      <T x={C} y={C - 54} color={MUTED}>{`${fmtInt(intakeKcal)} in`}</T>
      {[-40, -20, 20, 40].map((dx) => (
        <circle key={dx} cx={C + dx} cy={C - 38} r={2} fill="none" stroke={HAIR} strokeWidth="1" />
      ))}
      {deviation !== null && <line x1={C + deviation} x2={C + deviation} y1={C - 46} y2={C - 30} stroke={AMBER} strokeWidth="2.6" />}
      <Readout x={62} y={C - 12} w={34} h={20} size={11}>{fmtInt(burnKcal)}</Readout>
      <T x={79} y={C + 18} color={MUTED}>kcal</T>
      <Readout x={144} y={C - 12} w={34} h={20} size={11}>{fmtKm(distKm)}</Readout>
      <T x={161} y={C + 18} color={MUTED}>km</T>
      <Readout x={C - 36} y={C + 28} w={72} h={22} size={14}>{fmtInt(steps)}</Readout>
      <T x={C} y={C + 60} color={MUTED} spacing="0.12em">STEPS</T>
    </svg>
  );
};

export default ThursdayRadarDial;
