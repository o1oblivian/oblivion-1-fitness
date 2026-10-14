import React from 'react';
import { DialComponentProps, polarToCartesian } from './dialTypes';
import { AMBER, CRIMSON, EMERALD, fmtInt, fmtKm } from './luxuryDialShared';
import { Bezel, Hub, INK, MUTED, Needle, ProgressRing, Readout, T, Ticks } from './cockpitParts';

const C = 120;
const R = 100;

/** Tuesday: three-needle altimeter. One turn of the long needle is 1,000 steps. */
export const TuesdayChronoDial: React.FC<DialComponentProps> = ({ steps, stepTarget, burnKcal, distKm, intakeKcal }) => {
  const goalRatio = stepTarget > 0 ? steps / stepTarget : 0;
  const s = Math.max(0, Math.round(steps));
  const hundreds = ((s % 1000) / 1000) * 360;
  const thousands = ((s % 10000) / 10000) * 360;
  const tenThousands = (Math.min(s, 100000) / 100000) * 360;

  return (
    <svg width={240} height={240} viewBox="0 0 240 240" className="block max-w-full mx-auto select-none pointer-events-none" aria-hidden="true">
      <Bezel cx={C} cy={C} r={R} />
      <ProgressRing cx={C} cy={C} r={R + 3} ratio={goalRatio} color={EMERALD} />
      <Ticks cx={C} cy={C} r={R - 3} count={50} majorEvery={5} majorLen={10} minorLen={5} />
      {Array.from({ length: 10 }).map((_, i) => {
        const p = polarToCartesian(C, C, R - 24, i * 36);
        return (
          <T key={i} x={p.x} y={p.y} size={16} mono>
            {i}
          </T>
        );
      })}
      <T x={C} y={C - 40} color={MUTED} spacing="0.12em">STEPS</T>
      <Readout x={56} y={C - 9} w={46} h={20}>{fmtInt(burnKcal)}</Readout>
      <T x={79} y={C + 22} color={MUTED}>kcal</T>
      <Readout x={138} y={C - 9} w={46} h={20}>{fmtKm(distKm)}</Readout>
      <T x={161} y={C + 22} color={MUTED}>km</T>
      <Readout x={C - 38} y={C + 32} w={76} h={22} size={14}>{fmtInt(steps)}</Readout>
      <T x={C} y={C + 64} color={MUTED}>{`${fmtInt(intakeKcal)} in`}</T>
      <Needle cx={C} cy={C} angle={tenThousands} length={92} width={1.6} tail={0} color={AMBER} />
      <Needle cx={C} cy={C} angle={thousands} length={54} width={8} tail={10} color={CRIMSON} />
      <Needle cx={C} cy={C} angle={hundreds} length={84} width={3.2} tail={16} color={INK} />
      <Hub cx={C} cy={C} />
    </svg>
  );
};

export default TuesdayChronoDial;
