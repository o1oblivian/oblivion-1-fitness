import React from 'react';
import { DialComponentProps, describeArc, polarToCartesian } from './dialTypes';
import { AMBER, CRIMSON, EMERALD, HAIR, fmtInt, fmtKm, pct } from './luxuryDialShared';
import { Hub, INK, MUTED, ProgressRing, Readout, T, Ticks, clamp01 } from './cockpitParts';

const START = -150;
const SWEEP = 210;
const R = 46;

function EngineGauge({ cx, cy, label, value, goal, color }: { cx: number; cy: number; label: string; value: number; goal: number; color: string }) {
  const ratio = goal > 0 ? clamp01(value / goal) : 0;
  const end = START + SWEEP * ratio;
  const tip = polarToCartesian(cx, cy, R - 4, end);
  const red = polarToCartesian(cx, cy, R + 4, START + SWEEP);
  const redIn = polarToCartesian(cx, cy, R - 8, START + SWEEP);
  return (
    <>
      <circle cx={cx} cy={cy} r={R + 8} fill="none" stroke={HAIR} strokeWidth="0.8" />
      <ProgressRing cx={cx} cy={cy} r={R + 4} ratio={ratio} color={color} start={START} sweep={SWEEP} width={3} />
      <path d={describeArc(cx, cy, R, START, START + SWEEP)} stroke={INK} strokeOpacity="0.8" strokeWidth="1.6" fill="none" />
      <Ticks cx={cx} cy={cy} r={R} count={10} start={START} sweep={SWEEP} majorEvery={5} majorLen={7} minorLen={4} />
      <line x1={red.x} y1={red.y} x2={redIn.x} y2={redIn.y} stroke={CRIMSON} strokeWidth="2.6" />
      <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <Hub cx={cx} cy={cy} r={3} color={color} />
      <Readout x={cx + 2} y={cy + 6} w={46} h={20}>{fmtInt(value)}</Readout>
      <T x={cx + 25} y={cy + 38} color={MUTED} spacing="0.1em">{label}</T>
      <T x={cx} y={cy + R + 20} color={MUTED}>{goal > 0 ? `goal ${goal.toLocaleString()}` : 'no goal set'}</T>
    </>
  );
}

/** Friday: twin engine gauges (EICAS) for burn and intake, with a steps tape below. */
export const FridayHorizonDial: React.FC<DialComponentProps> = ({ steps, stepTarget, burnKcal, goalMove, distKm, goalDist, intakeKcal, intakeGoal }) => {
  const stepPct = pct(steps, stepTarget);
  return (
    <svg width={300} height={250} viewBox="0 0 300 250" className="block max-w-full mx-auto select-none pointer-events-none" aria-hidden="true">
      <EngineGauge cx={82} cy={70} label="BURN" value={burnKcal} goal={goalMove} color={CRIMSON} />
      <EngineGauge cx={218} cy={70} label="INTAKE" value={intakeKcal} goal={intakeGoal} color={AMBER} />
      <rect x={12} y={160} width={276} height={84} rx={10} fill="none" stroke={HAIR} strokeWidth="0.8" />
      <T x={26} y={180} anchor="start" color={MUTED} spacing="0.12em">STEPS</T>
      <T x={274} y={180} anchor="end" size={22} mono>{fmtInt(steps)}</T>
      <rect x={26} y={198} width={248} height={8} rx={2} fill="none" stroke={HAIR} strokeWidth="0.8" />
      {stepPct > 0 && <rect x={27} y={199} width={(246 * stepPct) / 100} height={6} rx={1.5} fill={EMERALD} />}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={26 + 248 * f} x2={26 + 248 * f} y1={194} y2={210} stroke={HAIR} strokeWidth="0.8" />
      ))}
      <T x={26} y={226} anchor="start" color={MUTED}>{`DIST ${fmtKm(distKm)} km`}</T>
      <T x={274} y={226} anchor="end" color={MUTED}>{goalDist > 0 ? `goal ${goalDist.toFixed(1)} km` : ''}</T>
    </svg>
  );
};

export default FridayHorizonDial;
