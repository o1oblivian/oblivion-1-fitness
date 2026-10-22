import React from 'react';
import { DialComponentProps } from './dialTypes';
import {
  CRIMSON,
  CX,
  DialFrame,
  DialPalette,
  EMERALD,
  HeroSteps,
  Line,
  SKY,
  Txt,
  clamp01,
  dialRatios,
} from './hairline';

const PALETTE: DialPalette = { steps: SKY, burn: CRIMSON, intake: EMERALD };
const TOP = 16;
const HEIGHT = 140;

function Tape({
  x,
  ratio,
  color,
  label,
}: {
  x: number;
  ratio: number;
  color: string;
  label: string;
}) {
  const f = clamp01(ratio);
  const bottom = TOP + HEIGHT;
  const level = bottom - HEIGHT * f;
  return (
    <>
      <Line x1={x} y1={TOP} x2={x} y2={bottom} opacity={0.35} />
      {Array.from({ length: 11 }).map((_, i) => {
        const y = bottom - (HEIGHT * i) / 10;
        return <Line key={i} x1={x - (i % 5 === 0 ? 8 : 4)} y1={y} x2={x} y2={y} opacity={0.7} />;
      })}
      {f > 0 && (
        <>
          <Line x1={x} y1={bottom} x2={x} y2={level} color={color} width={2.4} />
          <path d={`M ${x + 4} ${level} l 11 -5 v 10 z`} fill={color} />
        </>
      )}
      <Txt x={x} y={bottom + 14} size={11} weight={600} color={color} spacing="0.16em">
        {label}
      </Txt>
    </>
  );
}

/** Saturday: three ruled tapes with a flag marking each metric's progress. */
export const SaturdayTapesDial: React.FC<DialComponentProps> = (props) => {
  const r = dialRatios(props);
  return (
    <DialFrame
      palette={PALETTE}
      burnKcal={props.burnKcal}
      distKm={props.distKm}
      intakeKcal={props.intakeKcal}
    >
      <Tape x={48} ratio={r.burn} color={PALETTE.burn} label="BURN" />
      <Tape x={CX} ratio={r.steps} color={PALETTE.steps} label="STEPS" />
      <Tape x={192} ratio={r.intake} color={PALETTE.intake} label="IN" />
      <HeroSteps y={196} size={30} steps={props.steps} />
    </DialFrame>
  );
};
