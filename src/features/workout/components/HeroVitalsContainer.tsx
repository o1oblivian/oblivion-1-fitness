import React, { useState, useEffect, useMemo } from 'react';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { latestSleepRecord } from '../../report/vitals';
import { supplementStatus } from '../supplementStack';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useLogStore } from '../../../stores/useLogStore';
import { useWallpaperStore } from '../../../stores/useWallpaperStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { motionPedometerService } from '../../../services/motionPedometerService';
import { hydrateDailyStepsFromSupabase } from '../../log/services/userTelemetryService';
import { HeroFrontFace } from './HeroFrontFace';
import { HeroBackFace } from './HeroBackFace';
import { HeroModals } from './HeroModals';

export const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_SPLIT_MAP: Record<string, string> = {
  Mon: 'Push A',
  Tue: 'Pull A',
  Wed: 'Legs A',
  Thu: 'Hyper',
  Fri: 'Push B',
  Sat: 'Pull B',
  Sun: 'Rest',
};

export const getSystemToday = (): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()] || 'Thu';
};

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
  onShowToast?: (msg: string) => void;
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
  onShowToast,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeModal, setActiveModal] = useState<'hydration' | 'biosync' | 'supplements' | 'sleep' | null>(null);
  const [isReadinessOpen, setIsReadinessOpen] = useState(false);

  // Active day auto-initializes to today's real-time calendar day
  const [activeDay, setActiveDay] = useState<string>(() => {
    if (currentDay && DAYS_LIST.includes(currentDay)) {
      return currentDay;
    }
    return getSystemToday();
  });

  // Track the actual calendar system day for automatic daily rollover
  const [systemToday, setSystemToday] = useState<string>(getSystemToday());

  // Automatic daily rollover and system day sync (checks every 30s + on focus/visibility + midnight event)
  useEffect(() => {
    const syncCurrentSystemDay = () => {
      const currentCode = getSystemToday();
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

    const handleBleHeartRate = (e: any) => {
      const hr = e?.detail?.heartRate;
      if (hr && hr > 30) {
        // BLE stream received from paired wearable
      }
    };

    window.addEventListener('o1fc_day_changed', handleDayChangedEvent);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('o1fc_ble_heart_rate', handleBleHeartRate);

    // Auto-start motion sensor if supported and permitted
    if (motionPedometerService.isSupported()) {
      motionPedometerService.startTracking();
    }

    hydrateDailyStepsFromSupabase();

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener('o1fc_day_changed', handleDayChangedEvent);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('o1fc_ble_heart_rate', handleBleHeartRate);
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
  const drinksCount = useTelemetryStore((s) => s.drinksCount ?? 0);
  const streakDays = useTelemetryStore((s) => s.cleanHabitStreakDays ?? 0);
  const setDrinksCount = useTelemetryStore((s) => s.setDrinksCount);
  const recoveryEnergyScore = useWorkoutStore((s) => s.recoveryEnergyScore ?? 0);
  const hydrationCurrentL = useFuelStore((s) => s.hydrationCurrentL ?? 0.0);
  const addFuelHydration = useFuelStore((s) => s.addFuelHydration);
  const setHydrationLiters = useFuelStore((s) => s.setHydrationLiters);
  const fuelBurnedKcal = useFuelStore((s) => s.burnedKcal);
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
  // Re-read the persisted stack whenever a hero modal closes (activeModal changes).
  const supplements = useMemo(() => supplementStatus(), [activeModal]);

  // Pure genuine telemetry values from actual user activity - zero mock/fake values
  const isPresentDay = activeDay.toLowerCase() === systemToday.toLowerCase();

  const steps = isPresentDay ? (propStepCount !== undefined ? propStepCount : (storeStepCount ?? 0)) : 0;
  const burnKcal = isPresentDay
    ? (propActiveKcal !== undefined
        ? propActiveKcal
        : (fuelBurnedKcal || (steps > 0 ? Math.round(steps * 0.04) : 0)))
    : 0;
  const distKm = isPresentDay
    ? (propDistanceKm !== undefined
        ? propDistanceKm
        : (steps > 0 ? (steps * 0.00075).toFixed(1) : '0.0'))
    : '0.0';

  const stepTarget =
    storeStepTarget && storeStepTarget > 0 ? storeStepTarget : 10000;
  const goalMove =
    storeMoveTarget && storeMoveTarget > 0 ? storeMoveTarget : 700;
  const goalDist =
    storeDistTarget && storeDistTarget > 0 ? storeDistTarget : 8.0;
  const currentReadiness = recoveryEnergyScore || 0;
  const splitName = DAY_SPLIT_MAP[activeDay] || 'Rest Day';
  const waterPct = Math.min(100, Math.round((hydrationCurrentL / 3.0) * 100));

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

  useEffect(() => {
    if (!isEnabled || isPaused) return;
    const timer = setInterval(() => {
      nextWallpaper();
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [isEnabled, isPaused, intervalSeconds, nextWallpaper]);

  const handleCycleDay = () => {
    tactileEngine.triggerSelectionBuzz();
    const nextIdx = (DAYS_LIST.indexOf(activeDay) + 1) % DAYS_LIST.length;
    const nextDay = DAYS_LIST[nextIdx];
    setActiveDay(nextDay);
  };

  return (
    <>
      <div
        id="hero-vitals-container"
        style={{ perspective: '1200px' }}
        className="w-full max-w-md mx-auto aspect-[10/11] relative select-none mb-3"
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
            splitName={splitName}
            steps={steps}
            burnKcal={burnKcal}
            distKm={distKm}
            recoveryEnergyScore={currentReadiness}
            stepTarget={stepTarget}
            goalMove={goalMove}
            goalDist={goalDist}
            onCycleWallpaper={nextWallpaper}
            onCycleDayDial={handleCycleDay}
            onFlipToVitals={() => { setIsFlipped(true); onVitalsClick?.(); }}
            onOpenCardio={onOpenCardioModal || onCardioClick}
            onOpenReadiness={() => setIsReadinessOpen(true)}
            onOpenSettings={onOptionsClick}
            onShowToast={onShowToast}
          />

          <HeroBackFace
            isFlipped={isFlipped}
            activeWallpaper={activeWallpaper}
            hydrationCurrentL={hydrationCurrentL}
            waterPct={waterPct}
            sleepHours={sleepHours}
            sleepQuality={sleepQuality}
            restingHr={restingHr}
            supplementsTaken={supplements.taken}
            supplementsTotal={supplements.total}
            onCycleWallpaper={nextWallpaper}
            onFlipBack={() => setIsFlipped(false)}
            onOpenTile={(tile) => {
              setActiveModal(tile);
              if (tile === 'supplements') onOpenSupplements?.();
            }}
            onOpenSettings={onOptionsClick}
          />
        </div>
      </div>

      <HeroModals
        activeModal={activeModal}
        onCloseModal={() => setActiveModal(null)}
        isReadinessOpen={isReadinessOpen}
        onCloseReadiness={() => setIsReadinessOpen(false)}
        hydrationCurrentL={hydrationCurrentL}
        recoveryEnergyScore={recoveryEnergyScore}
        onAddHydration={(l) => addFuelHydration(l)}
        onResetHydration={() => setHydrationLiters(0)}
        onShowToast={onShowToast}
      />
    </>
  );
};

export default HeroVitalsContainer;
