import React from 'react';
import { DAY_DIAL_MAP, DialComponentProps } from './dialTypes';
import { MondaySplitDial } from './MondaySplitDial';
import { TuesdayChronoDial } from './TuesdayChronoDial';
import { WednesdayF1Dial } from './WednesdayF1Dial';
import { ThursdayRadarDial } from './ThursdayRadarDial';
import { FridayHorizonDial } from './FridayHorizonDial';
import { SaturdayQuadrantDial } from './SaturdayQuadrantDial';
import { SundayRestorationDial } from './SundayRestorationDial';

const finite = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export const DayAdaptiveDial: React.FC<DialComponentProps> = (props) => {
  const dayCode = props.activeDay.slice(0, 1).toUpperCase() + props.activeDay.slice(1, 3).toLowerCase();
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
    case 'split_hud':
      return <MondaySplitDial {...dial} />;
    case 'chrono':
      return <TuesdayChronoDial {...dial} />;
    case 'f1_rack':
      return <WednesdayF1Dial {...dial} />;
    case 'horizon':
      return <FridayHorizonDial {...dial} />;
    case 'quadrant':
      return <SaturdayQuadrantDial {...dial} />;
    case 'restoration':
      return <SundayRestorationDial {...dial} />;
    default:
      return <ThursdayRadarDial {...dial} />;
  }
}

export default DayAdaptiveDial;
