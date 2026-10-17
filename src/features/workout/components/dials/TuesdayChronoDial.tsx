import React from 'react';
import { DialComponentProps, polarToCartesian } from './dialTypes';
import { fmtInt } from './luxuryDialShared';
import {
  AMBER, CX, CY, DialFrame, DialPalette, EMERALD, Hand, INK, RadialTick, Ring, SKY, Txt, clamp01, dialRatios,
} from './hairline';

const PALETTE: DialPalette = { steps: SKY, burn: AMBER, intake: EMERALD };
const START = -135;
const SWEEP = 270;
const R = 106;

/** Numeral stops in thousands, spaced so the dial never carries more than eight of them. */
function scaleStops(goal: number): { label: string; f: number }[] {
  const goalK = goal / 1000;
  if (!(goalK > 0)) return [];
  const step = [0.5, 1, 2, 2.5, 5].find((s) => goalK / s <= 8) ?? 10;
  const out: { label: string; f: number }[] = [];
  for (let v = 0; v <= goalK + 1e-9; v += step) {
    out.push({ label: Number.isInteger(v) ? String(v) : v.toFixed(1), f: v / goalK });
  }
  return out;
}

/** Tuesday: chronograph face. A single hand sweeps 0 to the step goal. */
export const TuesdayChronoDial: React.FC<DialComponentProps> = (props) => {
  const { steps, stepTarget } = props;
  const f = dialRatios(props).steps;
  const handAngle = START + SWEEP * clamp01(f);
  return (
    <DialFrame palette={PALETTE} burnKcal={props.burnKcal} distKm={props.distKm} intakeKcal={props.intakeKcal}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={INK} strokeOpacity="0.8" strokeWidth="1" />
      {Array.from({ length: 57 }).map((_, i) => (
        <RadialTick key={i} r={R - 3} len={i % 8 === 0 ? 11 : 6} angle={START + (SWEEP * i) / 56} opacity={i % 8 === 0 ? 1 : 0.65} />
      ))}
      {scaleStops(stepTarget).map((s) => {
        const p = polarToCartesian(CX, CY, 78, START + SWEEP * s.f);
        return <Txt key={s.label} x={p.x} y={p.y} size={13} font="serif">{s.label}</Txt>;
      })}
      <Ring r={R} ratio={f} color={PALETTE.steps} start={START} sweep={SWEEP} />
      <Txt x={CX} y={CY - 34} size={10} weight={600} color={PALETTE.steps} spacing="0.2em">STEPS</Txt>
      <Txt x={CX} y={CY + 40} size={20} weight={300} font="mono">{fmtInt(steps)}</Txt>
      {steps > 0 && stepTarget > 0 && <Hand angle={handAngle} length={86} color={PALETTE.steps} />}
    </DialFrame>
  );
};

export default TuesdayChronoDial;
