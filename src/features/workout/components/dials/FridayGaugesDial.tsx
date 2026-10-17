import React from 'react';
import { DialComponentProps, polarToCartesian } from './dialTypes';
import { fmtInt } from './luxuryDialShared';
import {
  AMBER, CRIMSON, DialFrame, DialPalette, EMERALD, HeroSteps, Line, MUTED, RadialTick, Ring, StepsLabel, Txt, clamp01, dialRatios,
} from './hairline';

const PALETTE: DialPalette = { steps: CRIMSON, burn: AMBER, intake: EMERALD };
const START = -135;
const SWEEP = 270;
const GAUGE_Y = 150;
const BAR_X0 = 30;
const BAR_X1 = 210;

function Gauge({ x, ratio, color, label }: { x: number; ratio: number; color: string; label: string }) {
  const f = clamp01(ratio);
  const tip = polarToCartesian(x, GAUGE_Y, 34, START + SWEEP * f);
  return (
    <>
      <Ring cx={x} cy={GAUGE_Y} r={44} ratio={f} color={color} start={START} sweep={SWEEP} />
      {Array.from({ length: 11 }).map((_, i) => (
        <RadialTick key={i} cx={x} cy={GAUGE_Y} r={44} len={i % 5 === 0 ? 8 : 4} angle={START + (SWEEP * i) / 10} opacity={0.7} />
      ))}
      {f > 0 && <Line x1={x} y1={GAUGE_Y} x2={tip.x} y2={tip.y} color={color} width={1.4} />}
      <circle cx={x} cy={GAUGE_Y} r={2.6} fill={color} />
      <Txt x={x} y={GAUGE_Y + 56} size={9} weight={600} color={color} spacing="0.18em">{label}</Txt>
    </>
  );
}

/** Friday: steps as a progress line, burn and intake as twin hand gauges. */
export const FridayGaugesDial: React.FC<DialComponentProps> = (props) => {
  const r = dialRatios(props);
  const f = clamp01(r.steps);
  return (
    <DialFrame palette={PALETTE} burnKcal={props.burnKcal} distKm={props.distKm} intakeKcal={props.intakeKcal}>
      <StepsLabel y={20} color={PALETTE.steps} />
      <HeroSteps y={46} size={42} steps={props.steps} />
      <Line x1={BAR_X0} y1={76} x2={BAR_X1} y2={76} opacity={0.3} />
      {f > 0 && (
        <>
          <Line x1={BAR_X0} y1={76} x2={BAR_X0 + (BAR_X1 - BAR_X0) * f} y2={76} color={PALETTE.steps} width={2.4} />
          <circle cx={BAR_X0 + (BAR_X1 - BAR_X0) * f} cy={76} r={3.4} fill={PALETTE.steps} />
        </>
      )}
      {props.stepTarget > 0 && <Txt x={BAR_X1} y={90} size={9} color={MUTED} anchor="end">{fmtInt(props.stepTarget)}</Txt>}
      <Gauge x={64} ratio={r.burn} color={PALETTE.burn} label="BURN" />
      <Gauge x={176} ratio={r.intake} color={PALETTE.intake} label="INTAKE" />
    </DialFrame>
  );
};

export default FridayGaugesDial;
