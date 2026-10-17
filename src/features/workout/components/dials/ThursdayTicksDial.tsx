import React from 'react';
import { DialComponentProps } from './dialTypes';
import { fmtInt } from './luxuryDialShared';
import {
  AMBER, CX, CY, DialFrame, DialPalette, EMERALD, HeroSteps, INK, MUTED, RadialTick, SKY, StepsLabel, TRACK, Txt, dialRatios,
} from './hairline';

const PALETTE: DialPalette = { steps: EMERALD, burn: SKY, intake: AMBER };

/** A ring of ticks that light up in the metric's colour as it fills. */
function TickRing({ count, r, len, ratio, color }: { count: number; r: number; len: number; ratio: number; color: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const lit = ratio > 0 && i / count < ratio;
        return <RadialTick key={i} r={r} len={len} angle={(360 * i) / count} color={lit ? color : INK} opacity={lit ? 1 : 0.3} width={1.2} />;
      })}
    </>
  );
}

/** Thursday: three rings of ticks for steps, burn and intake. */
export const ThursdayTicksDial: React.FC<DialComponentProps> = (props) => {
  const r = dialRatios(props);
  return (
    <DialFrame palette={PALETTE} burnKcal={props.burnKcal} distKm={props.distKm} intakeKcal={props.intakeKcal}>
      <TickRing count={72} r={106} len={12} ratio={r.steps} color={PALETTE.steps} />
      <TickRing count={54} r={86} len={9} ratio={r.burn} color={PALETTE.burn} />
      <TickRing count={40} r={69} len={7} ratio={r.intake} color={PALETTE.intake} />
      <circle cx={CX} cy={CY} r={54} fill="none" stroke={TRACK} strokeWidth="0.6" />
      <StepsLabel y={CY - 18} color={PALETTE.steps} />
      <HeroSteps y={CY + 6} size={26} steps={props.steps} />
      {props.stepTarget > 0 && <Txt x={CX} y={CY + 28} size={9.5} color={MUTED}>{`/ ${fmtInt(props.stepTarget)}`}</Txt>}
    </DialFrame>
  );
};


