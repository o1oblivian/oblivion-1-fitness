import React, { useState, useEffect } from 'react';
import { HeroVitalsContainer, HeroVitalsContainerProps } from './HeroVitalsContainer';
import { telemetryArbitrationService } from '../../telemetry/services/telemetryArbitrationService';
import { motionPedometerService } from '../../../services/motionPedometerService';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';

export interface WorkoutHeroBannerProps extends Omit<HeroVitalsContainerProps, 'stepCount'> {
  overrideStepCount?: number;
}

export const WorkoutHeroBanner: React.FC<WorkoutHeroBannerProps> = ({
  overrideStepCount,
  ...props
}) => {
  const storeSteps = useTelemetryStore((s) => s.stepCount);
  const [liveSteps, setLiveSteps] = useState<number>(() => {
    if (overrideStepCount !== undefined) return overrideStepCount;
    return telemetryArbitrationService.getDailyCumulative();
  });

  useEffect(() => {
    if (overrideStepCount !== undefined) {
      setLiveSteps(overrideStepCount);
      return;
    }
    // Bind step count directly to telemetryArbitrationService / live pedometer stream
    const current = telemetryArbitrationService.getDailyCumulative();
    setLiveSteps(current);

    const unsubMotion = motionPedometerService.subscribe((st) => {
      setLiveSteps(st.stepsToday || telemetryArbitrationService.getDailyCumulative());
    });

    const handleStepSync = () => {
      setLiveSteps(telemetryArbitrationService.getDailyCumulative());
    };
    window.addEventListener('o1fc_telemetry_synced', handleStepSync);

    return () => {
      unsubMotion();
      window.removeEventListener('o1fc_telemetry_synced', handleStepSync);
    };
  }, [overrideStepCount, storeSteps]);

  // Display 0 if no steps have been recorded today, never a static mock 7,145
  const verifiedSteps = liveSteps > 0 ? liveSteps : 0;

  return (
    <div id="workout-hero-banner-root" className="w-full">
      <HeroVitalsContainer
        {...props}
        stepCount={verifiedSteps}
      />
    </div>
  );
};

export default WorkoutHeroBanner;
