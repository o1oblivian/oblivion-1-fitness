import React, { useMemo } from 'react';
import { DialProps, DAY_DIAL_MAP, DialComponentProps } from './dialTypes';
import { useFuelStore } from '../../../fuel/store/useFuelStore';
import { MondaySplitDial } from './MondaySplitDial';
import { TuesdayChronoDial } from './TuesdayChronoDial';
import { WednesdayF1Dial } from './WednesdayF1Dial';
import { ThursdayRadarDial } from './ThursdayRadarDial';
import { FridayHorizonDial } from './FridayHorizonDial';
import { SaturdayQuadrantDial } from './SaturdayQuadrantDial';
import { SundayRestorationDial } from './SundayRestorationDial';

export interface DayDialProps extends DialProps {
  activeDay?: string;
  splitLabel?: string;
}

export const DayAdaptiveDial: React.FC<DayDialProps> = ({
  activeDay = 'THU',
  splitLabel = 'HYPER',
  dailySteps = 0,
  stepTarget = 10000,
  dailyMove = 0,
  goalMove = 600,
  dailyDist = 0,
  goalDist = 8,
}) => {
  const safeSteps = typeof dailySteps === 'number' && !isNaN(dailySteps) ? dailySteps : 0;
  const safeMove = typeof dailyMove === 'number' && !isNaN(dailyMove) ? dailyMove : 0;
  const safeDist = typeof dailyDist === 'number' ? (isNaN(dailyDist) ? 0 : dailyDist) : (Number(dailyDist) || 0);

  // Live Fuel store nutrition calories
  const fuelMeals = useFuelStore((s) => s.meals);
  const liveIntakeKcal = useMemo(() => {
    if (!fuelMeals) return 0;
    return Math.round(
      Object.values(fuelMeals)
        .flat()
        .reduce((sum, m) => sum + (m.calories || 0), 0)
    );
  }, [fuelMeals]);

  // Resolve matching day key
  const normalizedDay = (activeDay || 'Thu').slice(0, 3);
  const dayCode = normalizedDay.charAt(0).toUpperCase() + normalizedDay.slice(1).toLowerCase();
  const dialType = DAY_DIAL_MAP[dayCode] || 'radar';

  const commonProps: DialComponentProps = {
    steps: safeSteps,
    stepTarget,
    burnKcal: safeMove,
    goalMove,
    distKm: safeDist,
    goalDist,
    intakeKcal: liveIntakeKcal,
    activeDay,
    splitLabel,
  };

  switch (dialType) {
    case 'split_hud':
      return <MondaySplitDial {...commonProps} />;
    case 'chrono':
      return <TuesdayChronoDial {...commonProps} />;
    case 'f1_rack':
      return <WednesdayF1Dial {...commonProps} />;
    case 'radar':
      return <ThursdayRadarDial {...commonProps} />;
    case 'horizon':
      return <FridayHorizonDial {...commonProps} />;
    case 'quadrant':
      return <SaturdayQuadrantDial {...commonProps} />;
    case 'restoration':
      return <SundayRestorationDial {...commonProps} />;
    default:
      return <ThursdayRadarDial {...commonProps} />;
  }
};

export default DayAdaptiveDial;
