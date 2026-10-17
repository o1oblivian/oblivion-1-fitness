import React from 'react';
import { DialComponentProps, polarToCartesian } from './dialTypes';
import {
  AMBER,
  CRIMSON,
  CX,
  DialFrame,
  DialPalette,
  HeroSteps,
  Line,
  RadialTick,
  Ring,
  SKY,
  StepsLabel,
  Txt,
  clamp01,
  dialRatios,
} from './hairline';

const PALETTE: DialPalette = { steps: AMBER, burn: CRIMSON, intake: SKY };
const CY2 = 128;
const R = 100;

function Bar({
  y,
  ratio,
  color,
  label,
}: {
  y: number;
  ratio: number;
  color: string;
  label: string;
}) {
  const f = clamp01(ratio);
  return (
    <>
      <Txt x={54} y={y} size={9} color={color} anchor="end" spacing="0.12em">
        {label}
      </Txt>
      <Line x1={60} y1={y} x2={180} y2={y} opacity={0.3} />
      {f > 0 && <Line x1={60} y1={y} x2={60 + 120 * f} y2={y} color={color} width={2.2} />}
    </>
  );
}

/** Wednesday: speedometer. The needle sweeps the half-circle as steps reach the goal. */
export const WednesdaySpeedoDial: React.FC<DialComponentProps> = (props) => {
  const r = dialRatios(props);
  const angle = -90 + 180 * clamp01(r.steps);
  const tip = polarToCartesian(CX, CY2, 92, angle);
  return (
    <DialFrame
      palette={PALETTE}
      burnKcal={props.burnKcal}
      distKm={props.distKm}
      intakeKcal={props.intakeKcal}
    >
      <Ring cy={CY2} r={R} ratio={0} color={PALETTE.steps} start={-90} sweep={180} />
      {Array.from({ length: 29 }).map((_, i) => (
        <RadialTick
          key={i}
          cy={CY2}
          r={R}
          len={i % 4 === 0 ? 12 : 6}
          angle={-90 + (180 * i) / 28}
          opacity={i % 4 === 0 ? 0.95 : 0.55}
        />
      ))}
      <Ring
        cy={CY2}
        r={R + 6}
        ratio={r.steps}
        color={PALETTE.steps}
        width={2.4}
        start={-90}
        sweep={180}
      />
      {props.steps > 0 && props.stepTarget > 0 && (
        <>
          <Line x1={CX} y1={CY2} x2={tip.x} y2={tip.y} color={PALETTE.steps} width={1.4} />
          <circle cx={CX} cy={CY2} r={3.5} fill={PALETTE.steps} />
        </>
      )}
      <HeroSteps y={CY2 + 26} size={32} steps={props.steps} />
      <StepsLabel y={CY2 + 48} color={PALETTE.steps} />
      <Bar y={192} ratio={r.burn} color={PALETTE.burn} label="BURN" />
      <Bar y={206} ratio={r.intake} color={PALETTE.intake} label="IN" />
    </DialFrame>
  );
};
