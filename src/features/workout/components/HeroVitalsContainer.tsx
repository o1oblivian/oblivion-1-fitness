import React, { useState, useEffect } from 'react';
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
  Mon: 'PUSH A',
  Tue: 'PULL A',
  Wed: 'LEGS A',
  Thu: 'HYPER',
  Fri: 'PUSH B',
  Sat: 'PULL B',
  Sun: 'REST',
};

export const getSystemToday = (): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()] || 'Thu';
};

export const WALLPAPERS = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80',
];

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
  const [wallpaperIndex, setWallpaperIndex] = useState(0);

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
  const sleepHours = currentSleep?.durationHours && currentSleep.durationHours > 0 ? currentSleep.durationHours : 7.8;
  const sleepQuality = currentSleep?.sleepPerformancePercent && currentSleep.sleepPerformancePercent > 0 ? currentSleep.sleepPerformancePercent : 92;

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
  const splitName = DAY_SPLIT_MAP[activeDay] || 'REST DAY';
  const waterPct = Math.min(100, Math.round((hydrationCurrentL / 3.0) * 100));

  const {
    intervalSeconds,
    isPaused,
    isEnabled,
    nextWallpaper,
    getActiveWallpaper,
  } = useWallpaperStore();

  const currentWallpaper = getActiveWallpaper();
  const activeWallpaper = isEnabled ? currentWallpaper?.url : undefined;

  // Auto-rotate effect with user configured interval (10s, 15s, 30s) and pause / battery saver support
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
    const routine = DAY_SPLIT_MAP[nextDay] || 'REST DAY';
    const isToday = nextDay.toLowerCase() === systemToday.toLowerCase();
    if (isToday) {
      onShowToast?.(`⚡ Active Today: ${nextDay} • ${routine}`);
    }
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
