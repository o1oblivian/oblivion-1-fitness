import React from 'react';
import { DialComponentProps, describeArc, polarToCartesian } from './dialTypes';
import {
  AMBER,
  CRIMSON,
  CX,
  CY,
  DialFrame,
  DialPalette,
  EMERALD,
  HeroSteps,
  INK,
  MUTED,
  RadialTick,
  StepsLabel,
  TRACK,
  Txt,
  clamp01,
  dialRatios,
  SKY,
} from './hairline';

const PALETTE: DialPalette = { steps: AMBER, burn: EMERALD, intake: CRIMSON };
const SLEEP_GOAL_H = 8;

/** A hairline orbit with a coloured dot and a short comet tail at the metric's progress. */
function Orbit({ r, ratio, color }: { r: number; ratio: number; color: string }) {
  const f = clamp01(ratio);
  const angle = Math.min(359.9, 360 * f);
  const dot = polarToCartesian(CX, CY, r, angle);
  return (
    <>
      <circle cx={CX} cy={CY} r={r} fill="none" stroke={TRACK} strokeWidth="1" />
      {f > 0 && (
        <>
          <path
            d={describeArc(CX, CY, r, Math.max(0, angle - 28), angle)}
            fill="none"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx={dot.x} cy={dot.y} r={4.2} fill={color} />
        </>
      )}
    </>
  );
}

/** Sunday: three orbits for steps, burn and intake, with water and sleep underneath. */
export const SundayOrbitDial: React.FC<DialComponentProps> = (props) => {
  const r = dialRatios(props);
  const water = props.hydrationPct === null ? '--' : `${Math.round(props.hydrationPct)}%`;
  const sleep = props.sleepHours === null ? '--' : `${props.sleepHours}h`;
  const sleepOk = props.sleepHours !== null && clamp01(props.sleepHours / SLEEP_GOAL_H) >= 1;
  return (
    <DialFrame
      palette={PALETTE}
      burnKcal={props.burnKcal}
      distKm={props.distKm}
      intakeKcal={props.intakeKcal}
    >
      <Orbit r={104} ratio={r.steps} color={PALETTE.steps} />
      <Orbit r={88} ratio={r.burn} color={PALETTE.burn} />
      <Orbit r={72} ratio={r.intake} color={PALETTE.intake} />
      {[0, 90, 180, 270].map((a) => (
        <RadialTick key={a} r={112} len={4} angle={a} color={INK} opacity={0.7} />
      ))}
      <StepsLabel y={CY - 22} color={PALETTE.steps} />
      <HeroSteps y={CY + 4} size={32} steps={props.steps} />
      <Txt x={CX - 6} y={CY + 30} size={11} color={MUTED} anchor="end">
        WATER{' '}
        <tspan fill={SKY} fontWeight={600}>
          {water}
        </tspan>
      </Txt>
      <Txt x={CX + 6} y={CY + 30} size={11} color={MUTED} anchor="start">
        SLEEP{' '}
        <tspan fill={sleepOk ? EMERALD : AMBER} fontWeight={600}>
          {sleep}
        </tspan>
      </Txt>
    </DialFrame>
  );
};
