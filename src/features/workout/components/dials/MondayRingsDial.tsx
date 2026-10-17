import React from 'react';
import { DialComponentProps } from './dialTypes';
import { fmtInt } from './luxuryDialShared';
import {
  AMBER,
  CRIMSON,
  CX,
  CY,
  DialFrame,
  DialPalette,
  EMERALD,
  HeroSteps,
  MUTED,
  Ring,
  StepsLabel,
  Txt,
  dialRatios,
} from './hairline';

const PALETTE: DialPalette = { steps: EMERALD, burn: CRIMSON, intake: AMBER };

/** Monday: three concentric rings for steps, burn and intake. */
export const MondayRingsDial: React.FC<DialComponentProps> = (props) => {
  const r = dialRatios(props);
  return (
    <DialFrame
      palette={PALETTE}
      burnKcal={props.burnKcal}
      distKm={props.distKm}
      intakeKcal={props.intakeKcal}
    >
      <Ring r={104} ratio={r.steps} color={PALETTE.steps} tip />
      <Ring r={93} ratio={r.burn} color={PALETTE.burn} tip />
      <Ring r={82} ratio={r.intake} color={PALETTE.intake} tip />
      <StepsLabel y={CY - 24} color={PALETTE.steps} />
      <HeroSteps y={CY + 4} size={36} steps={props.steps} />
      {props.stepTarget > 0 && (
        <Txt x={CX} y={CY + 32} size={11} color={MUTED}>{`of ${fmtInt(props.stepTarget)}`}</Txt>
      )}
    </DialFrame>
  );
};
