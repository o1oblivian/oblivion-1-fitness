import React from 'react';
import { DialComponentProps } from './dialTypes';
import { LuxuryDialCanvas, HairRing, CenterStack, FooterTrio } from './LuxuryDialChrome';
import { CX, CY, EMERALD, HAIR, VIEW, pct } from './luxuryDialShared';

export const SundayRestorationDial: React.FC<DialComponentProps> = ({
  steps,
  stepTarget = 10000,
  burnKcal,
  distKm,
  intakeKcal,
}) => {
  const restPct = pct(steps, stepTarget);

  return (
    <LuxuryDialCanvas>
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${VIEW} ${VIEW}`} fill="none">
        <HairRing r={98} percent={restPct} color={EMERALD} />
        <circle cx={CX} cy={CY} r={86} stroke={HAIR} strokeWidth="0.7" fill="none" />
      </svg>
      <CenterStack steps={steps} caption="Restoration" />
      <FooterTrio burn={burnKcal} intake={intakeKcal} km={distKm} />
    </LuxuryDialCanvas>
  );
};

export default SundayRestorationDial;
