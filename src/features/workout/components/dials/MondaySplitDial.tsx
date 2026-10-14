import React from 'react';
import { DialComponentProps, describeArc, polarToCartesian } from './dialTypes';
import { AMBER, CRIMSON, EMERALD, HAIR, fmtInt, fmtKm, pct } from './luxuryDialShared';
import { AircraftSymbol, Bezel, INK, MUTED, ProgressRing, Readout, T, useSvgId } from './cockpitParts';

const CX = 150;
const CY = 124;
const R = 92;

function Tape({ x, label, value, percent, color }: { x: number; label: string; value: string; percent: number; color: string }) {
  const top = 46;
  const height = 156;
  return (
    <>
      <T x={x + 9} y={top - 14} color={MUTED}>{label}</T>
      <rect x={x} y={top} width={18} height={height} rx={2} fill="none" stroke={HAIR} strokeWidth="0.8" />
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={x} x2={x + 5} y1={top + height * f} y2={top + height * f} stroke={HAIR} strokeWidth="0.8" />
      ))}
      {percent > 0 && (
        <rect x={x + 3} y={top + height * (1 - percent / 100) + 1} width={12} height={(height * percent) / 100 - 2} rx={1} fill={color} />
      )}
      <T x={x + 9} y={top + height + 15} size={13} mono>{value}</T>
    </>
  );
}

/** Monday: attitude indicator. The horizon climbs as steps approach the goal. */
export const MondaySplitDial: React.FC<DialComponentProps> = ({
  steps,
  stepTarget,
  burnKcal,
  goalMove,
  distKm,
  intakeKcal,
  intakeGoal,
}) => {
  const clipId = useSvgId('adi');
  const stepPct = pct(steps, stepTarget);
  const horizonY = CY + 38 - stepPct * 0.76;
  return (
    <svg width={300} height={250} viewBox="0 0 300 250" className="block max-w-full mx-auto select-none pointer-events-none" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>
      <Bezel cx={CX} cy={CY} r={R} />
      <g clipPath={`url(#${clipId})`}>
        <line x1={CX - R} x2={CX + R} y1={horizonY} y2={horizonY} stroke={INK} strokeWidth="1.3" />
        {[-10, 10, 20].map((p) => (
          <line
            key={p}
            x1={CX - (Math.abs(p) === 20 ? 24 : 14)}
            x2={CX + (Math.abs(p) === 20 ? 24 : 14)}
            y1={horizonY - p * 1.8}
            y2={horizonY - p * 1.8}
            stroke={INK}
            strokeOpacity="0.7"
            strokeWidth="1"
          />
        ))}
      </g>
      <ProgressRing cx={CX} cy={CY} r={R + 3} ratio={stepPct / 100} color={EMERALD} />
      <path d={describeArc(CX, CY, R - 8, -60, 60)} stroke={HAIR} strokeWidth="0.8" fill="none" />
      {[-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60].map((a) => {
        const long = a % 30 === 0;
        const p1 = polarToCartesian(CX, CY, R - 8, a);
        const p2 = polarToCartesian(CX, CY, R - (long ? 18 : 13), a);
        return <line key={a} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={INK} strokeOpacity="0.8" strokeWidth={long ? 1.4 : 0.9} />;
      })}
      <path d={`M ${CX} ${CY - R + 20} L ${CX - 6} ${CY - R + 30} L ${CX + 6} ${CY - R + 30} Z`} fill={CRIMSON} />
      <AircraftSymbol cx={CX} cy={CY} />
      <T x={CX} y={CY - 46} size={13} mono>{distKm > 0 ? `${fmtKm(distKm)} km` : '— km'}</T>
      <Readout x={CX - 44} y={CY + 30} w={88} h={28} size={20}>{fmtInt(steps)}</Readout>
      <T x={CX} y={CY + 70} color={MUTED} spacing="0.12em">STEPS</T>
      <Tape x={12} label="Burn" value={fmtInt(burnKcal)} percent={pct(burnKcal, goalMove)} color={CRIMSON} />
      <Tape x={270} label="Intake" value={fmtInt(intakeKcal)} percent={pct(intakeKcal, intakeGoal)} color={AMBER} />
    </svg>
  );
};

export default MondaySplitDial;
