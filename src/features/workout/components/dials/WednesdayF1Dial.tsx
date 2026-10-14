import React from 'react';
import { DialComponentProps, describeArc, polarToCartesian } from './dialTypes';
import { AMBER, CRIMSON, EMERALD, fmtInt, fmtKm } from './luxuryDialShared';
import { Bezel, Hub, INK, MUTED, Needle, ProgressRing, T, Ticks, clamp01 } from './cockpitParts';

const C = 120;
const R = 100;
const START = -135;
const SWEEP = 270;
const at = (f: number) => START + SWEEP * f;

/** Wednesday: airspeed indicator for burn, redlined at the athlete's burn goal. */
export const WednesdayF1Dial: React.FC<DialComponentProps> = ({ steps, burnKcal, goalMove, distKm, intakeKcal }) => {
  const ratio = goalMove > 0 ? clamp01(burnKcal / goalMove) : 0;
  const red = polarToCartesian(C, C, R + 2, at(1));
  const redIn = polarToCartesian(C, C, R - 16, at(1));

  return (
    <svg width={240} height={240} viewBox="0 0 240 240" className="block max-w-full mx-auto select-none pointer-events-none" aria-hidden="true">
      <Bezel cx={C} cy={C} r={R} />
      <ProgressRing cx={C} cy={C} r={R + 3} ratio={ratio} color={CRIMSON} start={START} sweep={SWEEP} />
      <path d={describeArc(C, C, R - 7, at(0), at(0.4))} stroke={INK} strokeOpacity="0.75" strokeWidth="4" fill="none" />
      <path d={describeArc(C, C, R - 7, at(0.4), at(0.85))} stroke={EMERALD} strokeWidth="4" fill="none" />
      <path d={describeArc(C, C, R - 7, at(0.85), at(1))} stroke={AMBER} strokeWidth="4" fill="none" />
      <line x1={red.x} y1={red.y} x2={redIn.x} y2={redIn.y} stroke={CRIMSON} strokeWidth="3" />
      <Ticks cx={C} cy={C} r={R - 11} count={20} start={START} sweep={SWEEP} majorEvery={5} majorLen={10} minorLen={5} />
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const p = polarToCartesian(C, C, R - 34, at(f));
        return (
          <T key={f} x={p.x} y={p.y} size={11} mono>
            {goalMove > 0 ? Math.round(goalMove * f) : '--'}
          </T>
        );
      })}
      <T x={C} y={C - 34} color={MUTED} spacing="0.12em">BURN</T>
      <T x={C} y={C + 34} size={26} mono>{fmtInt(burnKcal)}</T>
      <T x={C} y={C + 54} color={MUTED}>kcal</T>
      <T x={C} y={C + 82} size={12} mono>{`${fmtInt(steps)} steps`}</T>
      <T x={C} y={C + 98} color={MUTED}>{`${fmtInt(intakeKcal)} in · ${fmtKm(distKm)} km`}</T>
      <Needle cx={C} cy={C} angle={at(ratio)} length={88} width={3.4} tail={16} color={INK} />
      <Hub cx={C} cy={C} />
    </svg>
  );
};

export default WednesdayF1Dial;
