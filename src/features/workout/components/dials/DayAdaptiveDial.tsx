import React from 'react';
import { DAY_DIAL_MAP, DialComponentProps } from './dialTypes';
import { MondayRingsDial } from './MondayRingsDial';
import { TuesdayChronoDial } from './TuesdayChronoDial';
import { WednesdaySpeedoDial } from './WednesdaySpeedoDial';
import { ThursdayTicksDial } from './ThursdayTicksDial';
import { FridayGaugesDial } from './FridayGaugesDial';
import { SaturdayTapesDial } from './SaturdayTapesDial';
import { SundayOrbitDial } from './SundayOrbitDial';

const finite = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export const DayAdaptiveDial: React.FC<DialComponentProps> = (props) => {
  const dayCode =
    props.activeDay.slice(0, 1).toUpperCase() + props.activeDay.slice(1, 3).toLowerCase();
  const dial: DialComponentProps = {
    ...props,
    steps: finite(props.steps),
    burnKcal: finite(props.burnKcal),
    distKm: finite(props.distKm),
    intakeKcal: finite(props.intakeKcal),
  };

  return renderDial(DAY_DIAL_MAP[dayCode], dial);
};

function renderDial(kind: string | undefined, dial: DialComponentProps) {
  switch (kind) {
    case 'rings':
      return <MondayRingsDial {...dial} />;
    case 'chrono':
      return <TuesdayChronoDial {...dial} />;
    case 'speedo':
      return <WednesdaySpeedoDial {...dial} />;
    case 'gauges':
      return <FridayGaugesDial {...dial} />;
    case 'tapes':
      return <SaturdayTapesDial {...dial} />;
    case 'orbits':
      return <SundayOrbitDial {...dial} />;
    default:
      return <ThursdayTicksDial {...dial} />;
  }
}
