import React, { useEffect, useState } from 'react';
import { DialComponentProps, polarToCartesian } from './dialTypes';
import { AMBER, CRIMSON, EMERALD, HAIR, SKY, fmtInt, fmtKm, pct } from './luxuryDialShared';
import { Bezel, Hub, INK, MUTED, Needle, ProgressRing, T, Ticks, clamp01 } from './cockpitParts';

const C = 120;
const R = 100;
const SLEEP_GOAL_H = 8;

function SubDial({ cx, cy, label, value, ratio, color, labelAbove = false }: { cx: number; cy: number; label: string; value: string; ratio: number | null; color: string; labelAbove?: boolean }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={21} fill="none" stroke={HAIR} strokeWidth="0.8" />
      {ratio !== null && <ProgressRing cx={cx} cy={cy} r={23} ratio={ratio} color={color} width={2.5} />}
      <Ticks cx={cx} cy={cy} r={21} count={12} majorEvery={3} majorLen={4} minorLen={2} />
      {ratio !== null && <Needle cx={cx} cy={cy} angle={ratio * 360} length={17} width={2} tail={3} color={color} />}
      <Hub cx={cx} cy={cy} r={2} color={color} />
      <T x={cx} y={cy + 10} size={11} mono>{value}</T>
      <T x={cx} y={labelAbove ? cy - 31 : cy + 33} color={MUTED}>{label}</T>
    </>
  );
}

/** Sunday: pilot's chronograph. Live time, with steps, water and sleep sub-dials for rest day. */
export const SundayRestorationDial: React.FC<DialComponentProps> = ({ steps, stepTarget, burnKcal, distKm, intakeKcal, hydrationPct, sleepHours }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const minuteAngle = now.getMinutes() * 6 + now.getSeconds() * 0.1;
  const hourAngle = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;

  return (
    <svg width={240} height={240} viewBox="0 0 240 240" className="block max-w-full mx-auto select-none pointer-events-none" aria-hidden="true">
      <Bezel cx={C} cy={C} r={R} />
      <Ticks cx={C} cy={C} r={R - 2} count={60} majorEvery={5} majorLen={9} minorLen={4} />
      {[0, 90, 180, 270].map((a) => {
        const p = polarToCartesian(C, C, R - 18, a);
        return <circle key={a} cx={p.x} cy={p.y} r={2.2} fill={INK} />;
      })}
      <SubDial cx={C} cy={C - 40} labelAbove label="Steps" value={fmtInt(steps)} ratio={steps > 0 ? pct(steps, stepTarget) / 100 : null} color={EMERALD} />
      <SubDial cx={C - 46} cy={C + 12} label="Water" value={hydrationPct === null ? '--' : `${Math.round(hydrationPct)}%`} ratio={hydrationPct === null ? null : clamp01(hydrationPct / 100)} color={SKY} />
      <SubDial cx={C + 46} cy={C + 12} label="Sleep" value={sleepHours === null ? '--' : `${sleepHours}h`} ratio={sleepHours === null ? null : clamp01(sleepHours / SLEEP_GOAL_H)} color={AMBER} />
      <T x={C} y={C + 64} color={MUTED}>{`${fmtInt(burnKcal)} kcal · ${fmtInt(intakeKcal)} in · ${fmtKm(distKm)} km`}</T>
      <T x={C} y={C + 80} color={EMERALD} spacing="0.12em">RESTORATION</T>
      <Needle cx={C} cy={C} angle={hourAngle} length={50} width={5} tail={10} color={INK} />
      <Needle cx={C} cy={C} angle={minuteAngle} length={80} width={3} tail={14} color={INK} />
      <Hub cx={C} cy={C} color={CRIMSON} />
    </svg>
  );
};

export default SundayRestorationDial;
