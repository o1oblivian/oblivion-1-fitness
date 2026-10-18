import React, { useEffect, useState } from 'react';
import { DayAdaptiveDial } from './dials/DayAdaptiveDial';
import { HeroHeader } from './HeroHeader';
import { HeroBottomDock } from './HeroBottomDock';
import {
  getAthleteDayRoutine,
  formatConciseSplitName,
  getSystemTodayCode,
  useDayRoutineRevision,
} from '../services/dayRoutineService';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWallpaperStore } from '../../../stores/useWallpaperStore';
function dialSummary(p: {
  day: string;
  steps: number;
  burnKcal: number;
  goalMove: number;
  intakeKcal: number;
  intakeGoal: number;
  distKm: number;
  hydrationPct: number | null;
  sleepHours: number | null;
}): string {
  const n = (v: number) => Math.round(v).toLocaleString();
  const parts = [
    p.steps > 0 ? `${n(p.steps)} steps` : 'steps not logged',
    p.burnKcal > 0
      ? `${n(p.burnKcal)} kcal burned${p.goalMove > 0 ? ` of ${n(p.goalMove)}` : ''}`
      : 'burn not logged',
    p.intakeKcal > 0
      ? `${n(p.intakeKcal)} kcal eaten${p.intakeGoal > 0 ? ` of ${n(p.intakeGoal)}` : ''}`
      : 'no meals logged',
    p.distKm > 0 ? `${p.distKm.toFixed(1)} km` : null,
    p.hydrationPct != null ? `${p.hydrationPct}% hydrated` : null,
    p.sleepHours != null ? `${p.sleepHours} hours sleep` : null,
  ].filter(Boolean);
  return `${p.day}. ${parts.join(', ')}. Tap to browse days.`;
}

export interface HeroFrontFaceProps {
  isFlipped: boolean;
  activeWallpaper?: string;
  activeDay: string;
  steps: number;
  burnKcal: number;
  distKm: number;
  intakeKcal: number;
  intakeGoal: number;
  hydrationPct: number | null;
  sleepHours: number | null;
  readinessScore: number | null;
  stepTarget?: number;
  goalMove?: number;
  goalDist?: number;
  onCycleDayDial: () => void;
  onFlipToVitals: () => void;
  onOpenCardio?: () => void;
  onOpenReadiness: () => void;
  onOpenSettings?: () => void;
}

const scrollToActiveLog = () =>
  document
    .getElementById('active-log-section')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export const HeroFrontFace: React.FC<HeroFrontFaceProps> = ({
  isFlipped,
  activeWallpaper,
  activeDay,
  steps,
  burnKcal,
  distKm,
  intakeKcal,
  intakeGoal,
  hydrationPct,
  sleepHours,
  readinessScore,
  stepTarget = 0,
  goalMove = 0,
  goalDist = 0,
  onCycleDayDial,
  onFlipToVitals,
  onOpenCardio,
  onOpenReadiness,
  onOpenSettings,
}) => {
  useDayRoutineRevision();
  const [noRoutineDay, setNoRoutineDay] = useState<string | null>(null);
  useEffect(() => {
    if (!noRoutineDay) return;
    const t = window.setTimeout(() => setNoRoutineDay(null), 5000);
    return () => window.clearTimeout(t);
  }, [noRoutineDay]);
  const wallpaperBrightness = useWallpaperStore((s) => s.brightness);
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const activeLogs = useWorkoutStore((s) => s.activeLogs);
  const setActiveLogs = useWorkoutStore((s) => s.setActiveLogs);
  const setActiveSession = useWorkoutStore((s) => s.setActiveSession);
  const setActiveRoutine = useWorkoutStore((s) => s.setActiveRoutine);
  const dayRoutine = getAthleteDayRoutine(activeDay as Parameters<typeof getAthleteDayRoutine>[0]);
  const activeSplitLabel = formatConciseSplitName(dayRoutine.splitName);
  const isWorkoutLoaded = activeSession && (activeLogs?.length ?? 0) > 0;
  const hasSavedRoutine = dayRoutine.isCustom && dayRoutine.exercises.length > 0;
  const isEmptyDay =
    steps <= 0 &&
    burnKcal <= 0 &&
    intakeKcal <= 0 &&
    distKm <= 0 &&
    hydrationPct == null &&
    sleepHours == null;

  const handleLoadWorkout = () => {
    if (isWorkoutLoaded) {
      tactileEngine.triggerSelectionBuzz();
      scrollToActiveLog();
      return;
    }

    if (!hasSavedRoutine) {
      tactileEngine.triggerSelectionBuzz();
      setNoRoutineDay(activeDay);
      return;
    }

    tactileEngine.triggerSelectionBuzz();
    const stamp = Date.now();
    const cleanExercises = dayRoutine.exercises.map((ex, i) => ({
      ...ex,
      id: `live-${activeDay.toLowerCase()}-${stamp}-${i}`,
      sets: (ex.sets || []).map((s, sIdx) => ({
        ...s,
        id: `s-${stamp}-${i}-${sIdx}`,
        completed: false,
      })),
    }));
    setActiveLogs(cleanExercises);
    setActiveSession(true);
    setActiveRoutine(activeSplitLabel);
    window.setTimeout(scrollToActiveLog, 120);
  };

  const dialCaption =
    noRoutineDay === activeDay
      ? `No saved ${activeDay} workout yet. Finish a session and choose "save as weekly routine".`
      : isEmptyDay
        ? activeDay === getSystemTodayCode()
          ? null
          : `Nothing logged on ${activeDay}`
        : null;

  return (
    <div
      id="hero-front-face"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        pointerEvents: isFlipped ? 'none' : 'auto',
      }}
      className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-transparent text-white transition-opacity duration-300 ${
        isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {activeWallpaper && (
        <img
          key={activeWallpaper}
          src={activeWallpaper}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 select-none pointer-events-none"
          style={{ filter: `brightness(${wallpaperBrightness / 100})` }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            useWallpaperStore.getState().reportBroken(activeWallpaper);
          }}
        />
      )}

      <div className="relative w-full h-full flex flex-col justify-between px-2.5 pt-3 pb-3 select-none overflow-hidden z-10">
        <HeroHeader
          readinessScore={readinessScore}
          onOpenReadiness={onOpenReadiness}
          onOpenSettings={onOpenSettings}
        />

        <div
          role="button"
          tabIndex={0}
          aria-label={dialSummary({
            day: activeDay,
            steps,
            burnKcal,
            goalMove,
            intakeKcal,
            intakeGoal,
            distKm,
            hydrationPct,
            sleepHours,
          })}
          title="Browse day dials"
          onClick={() => onCycleDayDial()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCycleDayDial();
            }
          }}
          className="relative flex-1 flex flex-col items-center justify-center my-auto w-full cursor-pointer select-none active:scale-[0.99] transition-transform"
        >
          <DayAdaptiveDial
            activeDay={activeDay}
            splitLabel={activeSplitLabel}
            steps={steps}
            stepTarget={stepTarget}
            burnKcal={burnKcal}
            goalMove={goalMove}
            distKm={distKm}
            goalDist={goalDist}
            intakeKcal={intakeKcal}
            intakeGoal={intakeGoal}
            hydrationPct={hydrationPct}
            sleepHours={sleepHours}
          />
          {dialCaption && (
            <span
              role="status"
              className="absolute bottom-0 left-0 right-0 px-4 text-center text-o1-label font-medium text-white/80"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {dialCaption}
            </span>
          )}
        </div>

        <HeroBottomDock
          activeDay={activeDay}
          activeSplitLabel={activeSplitLabel}
          hasSavedRoutine={hasSavedRoutine && !isWorkoutLoaded}
          onOpenCardio={onOpenCardio}
          onLoadWorkout={handleLoadWorkout}
          onFlipToVitals={onFlipToVitals}
        />
      </div>
    </div>
  );
};
