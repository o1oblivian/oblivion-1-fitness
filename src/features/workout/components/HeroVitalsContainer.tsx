import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { latestSleepRecord } from '../../report/vitals';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { hydrationGoalLiters } from '../../fuel/utils/fuelMath';
import { useLogStore } from '../../../stores/useLogStore';
import { useWallpaperStore } from '../../../stores/useWallpaperStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { motionPedometerService } from '../../../services/motionPedometerService';
import { getSystemTodayCode } from '../services/dayRoutineService';
import { HeroFrontFace } from './HeroFrontFace';
import { HeroBackFace } from './HeroBackFace';
import { HeroModals } from './HeroModals';

export const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dateKeyForWeekday(day: string, today: string): { key: string; offset: number } {
  const offset = DAYS_LIST.indexOf(day) - DAYS_LIST.indexOf(today);
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { key, offset };
}

export interface HeroVitalsContainerProps {
  stepCount?: number;
  activeKcal?: number;
  distanceKm?: number | string;
  currentDay?: string;
  onOpenCardioModal?: () => void;
  onCardioClick?: () => void;
  onVitalsClick?: () => void;
  onOptionsClick?: () => void;
  onOpenSupplements?: () => void;
}

export const HeroVitalsContainer: React.FC<HeroVitalsContainerProps> = ({
  stepCount: propStepCount,
  activeKcal: propActiveKcal,
  distanceKm: propDistanceKm,
  currentDay,
  onOpenCardioModal,
  onCardioClick,
  onVitalsClick,
  onOptionsClick,
  onOpenSupplements,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeModal, setActiveModal] = useState<'hydration' | 'biosync' | 'supplements' | 'sleep' | null>(null);
  const [isReadinessOpen, setIsReadinessOpen] = useState(false);

  // Active day auto-initializes to today's real-time calendar day
  const [activeDay, setActiveDay] = useState<string>(() => {
    if (currentDay && DAYS_LIST.includes(currentDay)) {
      return currentDay;
    }
    return getSystemTodayCode();
  });

  // Track the actual calendar system day for automatic daily rollover
  const [systemToday, setSystemToday] = useState<string>(getSystemTodayCode());

  // Automatic daily rollover and system day sync (checks every 30s + on focus/visibility + midnight event)
  useEffect(() => {
    const syncCurrentSystemDay = () => {
      const currentCode = getSystemTodayCode();
      setSystemToday((prev) => {
        if (prev !== currentCode) {
          // Calendar day advanced (midnight passed or phone resumed on new day)
          // Automatically update the dial to the new current day
          setActiveDay(currentCode);
          return currentCode;
        }
        return prev;
      });
    };

    const intervalTimer = setInterval(syncCurrentSystemDay, 30000);
    const handleDayChangedEvent = () => syncCurrentSystemDay();
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncCurrentSystemDay();
      }
    };

    window.addEventListener('o1fc_day_changed', handleDayChangedEvent);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // Auto-start the phone step counter unless it was switched off in Settings
    if (motionPedometerService.isSupported() && motionPedometerService.isEnabledByUser()) {
      motionPedometerService.startTracking();
    }

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener('o1fc_day_changed', handleDayChangedEvent);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  useEffect(() => {
    if (currentDay && DAYS_LIST.includes(currentDay) && currentDay !== activeDay) {
      setActiveDay(currentDay);
    }
  }, [currentDay, activeDay]);

  const storeStepCount = useTelemetryStore((s) => s.stepCount);
  const storeStepTarget = useTelemetryStore((s) => s.stepTarget);
  const storeMoveTarget = useTelemetryStore((s) => s.moveTarget);
  const storeDistTarget = useTelemetryStore((s) => s.distTarget);
  const hydrationCurrentL = useFuelStore((s) => s.hydrationCurrentL ?? 0.0);
  const addFuelHydration = useFuelStore((s) => s.logHydration);
  const setHydrationLiters = useFuelStore((s) => s.setHydrationLiters);
  const fuelBurnedKcal = useFuelStore((s) => s.burnedKcal);
  const fuelMeals = useFuelStore((s) => s.meals);
  const fuelCalorieTarget = useFuelStore((s) => s.calorieTarget);
  const hydrationTargetL = useFuelStore((s) => s.hydrationTargetL);
  const fuelWeightKg = useFuelStore((s) => s.weightKg);
  const currentSleep = useLogStore((s) => s.subModules?.sleep);
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const loggedSleep = latestSleepRecord(historyByDate);
  // Only real logged values; null renders as "--" on the card.
  const sleepHours =
    currentSleep?.durationHours && currentSleep.durationHours > 0
      ? currentSleep.durationHours
      : loggedSleep
        ? Math.round(loggedSleep.durationHours * 10) / 10
        : null;
  const sleepQuality =
    currentSleep?.sleepPerformancePercent && currentSleep.sleepPerformancePercent > 0
      ? currentSleep.sleepPerformancePercent
      : loggedSleep && loggedSleep.recoveryPercent > 0
        ? loggedSleep.recoveryPercent
        : null;
  const restingHr = loggedSleep && loggedSleep.restingHeartRate > 0 ? loggedSleep.restingHeartRate : null;
  const supplementStack = useFuelStore((s) => s.supplementStack);
  const supplementsTakenIds = useFuelStore((s) => s.supplementsTaken);
  const supplements = {
    taken: supplementStack.filter((s) => supplementsTakenIds.includes(s.id)).length,
    total: supplementStack.length,
  };

  const liveIntakeKcal = useMemo(
    () => Math.round(Object.values(fuelMeals || {}).flat().reduce((sum, m) => sum + (m.calories || 0), 0)),
    [fuelMeals],
  );

  // Today is live, past days come from the saved day log, future days stay blank.
  const dayStats = useMemo(() => {
    const { key, offset } = dateKeyForWeekday(activeDay, systemToday);
    const record = historyByDate[key];
    const cardio = record?.cardio?.hasData ? record.cardio : undefined;
    const nutrition = record?.nutrition?.hasData ? record.nutrition : undefined;
    const loggedBurn = (cardio?.burnedKcal ?? 0) + (record?.workout?.hasData ? record.workout.burnedKcal ?? 0 : 0);
    const target = fuelCalorieTarget && fuelCalorieTarget > 0 ? fuelCalorieTarget : 0;
    if (offset > 0) return { steps: 0, burn: 0, dist: 0, intake: 0, intakeGoal: target, isToday: false, sleep: null };
    if (offset < 0) {
      const sleep = record?.sleep?.hasData && record.sleep.durationHours > 0 ? Math.round(record.sleep.durationHours * 10) / 10 : null;
      return {
        steps: cardio?.steps ?? 0,
        burn: loggedBurn,
        dist: cardio?.distanceKm ?? 0,
        intake: nutrition?.calories ?? 0,
        intakeGoal: nutrition && nutrition.calorieTarget > 0 ? nutrition.calorieTarget : target,
        isToday: false,
        sleep,
      };
    }
    const liveSteps = propStepCount !== undefined ? propStepCount : (storeStepCount ?? 0);
    return {
      steps: liveSteps,
      // Fuel holds every burn logged today on any device; the day log covers it before Fuel hydrates.
      burn: propActiveKcal !== undefined ? propActiveKcal : Math.max(fuelBurnedKcal || 0, loggedBurn),
      dist: propDistanceKm !== undefined ? Number(propDistanceKm) || 0 : (cardio?.distanceKm ?? 0),
      intake: liveIntakeKcal,
      intakeGoal: target,
      isToday: true,
      sleep: null,
    };
  }, [activeDay, systemToday, historyByDate, fuelCalorieTarget, propStepCount, storeStepCount, propActiveKcal, fuelBurnedKcal, propDistanceKm, liveIntakeKcal]);

  const stepTarget = storeStepTarget && storeStepTarget > 0 ? storeStepTarget : 0;
  const goalMove = storeMoveTarget && storeMoveTarget > 0 ? storeMoveTarget : 0;
  const goalDist = storeDistTarget && storeDistTarget > 0 ? storeDistTarget : 0;
  const waterGoalL = hydrationGoalLiters(hydrationTargetL, fuelWeightKg);
  const waterPct = waterGoalL ? Math.min(100, Math.round((hydrationCurrentL / waterGoalL) * 100)) : 0;
  // Readiness needs a logged sleep quality; hydration is measured against the athlete's own goal.
  const readinessScore =
    sleepQuality === null ? null : Math.min(100, Math.round(sleepQuality * 0.6 + (waterPct / 100) * 40));

  const { isEnabled, isPaused, intervalSeconds, nextWallpaper, getActiveWallpaper, refreshLive, reportBroken, activeIndex, pool, customUrl } =
    useWallpaperStore();
  const currentWallpaper = getActiveWallpaper();
  const activeWallpaper = isEnabled ? currentWallpaper?.url : undefined;

  useEffect(() => {
    if (!isEnabled || pool.length === 0) return;
    const total = pool.length + (customUrl ? 1 : 0);
    const nextIdx = (activeIndex + 1) % total;
    const liveIdx = customUrl ? nextIdx - 1 : nextIdx;
    if (liveIdx < 0) return;
    const url = pool[liveIdx]?.url;
    if (!url) return;
    const pre = new Image();
    pre.onerror = () => reportBroken(url);
    pre.src = url;
  }, [isEnabled, activeIndex, pool, customUrl, reportBroken]);

  useEffect(() => {
    if (!isEnabled) return;
    void refreshLive(true);
  }, [isEnabled, refreshLive]);

  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const trainingNow = useWorkoutStore((s) => s.activeSession && s.exercises.length > 0);

  useEffect(() => {
    const node = heroRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Rotation stops mid-session and while the hero is off screen, so the dial never changes under a glance.
  useEffect(() => {
    if (!isEnabled || isPaused || trainingNow || !heroVisible) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') nextWallpaper();
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [isEnabled, isPaused, trainingNow, heroVisible, intervalSeconds, nextWallpaper]);

  const handleCycleDay = () => {
    tactileEngine.triggerSelectionBuzz();
    const nextIdx = (DAYS_LIST.indexOf(activeDay) + 1) % DAYS_LIST.length;
    const nextDay = DAYS_LIST[nextIdx];
    setActiveDay(nextDay);
  };

  return (
    <>
      <div
        ref={heroRef}
        id="hero-vitals-container"
        style={{ perspective: '1200px' }}
        className="w-full max-w-md mx-auto aspect-[5/6] relative select-none mb-3"
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
          className="w-full h-full relative"
        >
          <HeroFrontFace
            isFlipped={isFlipped}
            activeWallpaper={activeWallpaper}
            activeDay={activeDay}
            steps={dayStats.steps}
            burnKcal={dayStats.burn}
            distKm={dayStats.dist}
            intakeKcal={dayStats.intake}
            intakeGoal={dayStats.intakeGoal}
            hydrationPct={dayStats.isToday && hydrationCurrentL > 0 ? waterPct : null}
            sleepHours={dayStats.isToday ? sleepHours : dayStats.sleep}
            readinessScore={readinessScore}
            stepTarget={stepTarget}
            goalMove={goalMove}
            goalDist={goalDist}
            onCycleDayDial={handleCycleDay}
            onFlipToVitals={() => { setIsFlipped(true); onVitalsClick?.(); }}
            onOpenCardio={onOpenCardioModal || onCardioClick}
            onOpenReadiness={() => {
              if (readinessScore == null) setActiveModal('sleep');
              else setIsReadinessOpen(true);
            }}
            onOpenSettings={onOptionsClick}
          />

          <HeroBackFace
            isFlipped={isFlipped}
            activeWallpaper={activeWallpaper}
            hydrationCurrentL={hydrationCurrentL}
            waterPct={waterPct}
            readinessScore={readinessScore}
            sleepHours={sleepHours}
            sleepQuality={sleepQuality}
            restingHr={restingHr}
            supplementsTaken={supplements.taken}
            supplementsTotal={supplements.total}
            onFlipBack={() => setIsFlipped(false)}
            onOpenReadiness={() => setIsReadinessOpen(true)}
            onOpenTile={(tile) => {
              setActiveModal(tile);
              if (tile === 'supplements') onOpenSupplements?.();
            }}
          />
        </div>
      </div>

      <HeroModals
        activeModal={activeModal}
        onCloseModal={() => setActiveModal(null)}
        isReadinessOpen={isReadinessOpen}
        onCloseReadiness={() => setIsReadinessOpen(false)}
        hydrationCurrentL={hydrationCurrentL}
        readinessScore={readinessScore}
        onAddHydration={(l) => addFuelHydration(l)}
        onResetHydration={() => setHydrationLiters(0)}
      />
    </>
  );
};

export default HeroVitalsContainer;
