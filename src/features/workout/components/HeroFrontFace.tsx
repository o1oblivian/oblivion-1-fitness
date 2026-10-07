import React from 'react';
import { DayAdaptiveDial } from './dials/DayAdaptiveDial';
import { HeroHeader } from './HeroHeader';
import { HeroBottomDock } from './HeroBottomDock';
import { getSystemTodayCode, getAthleteDayRoutine, formatConciseSplitName } from '../services/dayRoutineService';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWallpaperStore } from '../../../stores/useWallpaperStore';

export interface HeroFrontFaceProps {
  isFlipped: boolean; activeWallpaper?: string; activeDay: string; splitName: string;
  steps: number; burnKcal: number; distKm: string | number; recoveryEnergyScore: number;
  stepTarget?: number; goalMove?: number; goalDist?: number;
  onCycleWallpaper: () => void; onCycleDayDial: () => void; onFlipToVitals: () => void;
  onOpenCardio?: () => void; onOpenReadiness: () => void; onOpenSettings?: () => void;
  onShowToast?: (msg: string) => void;
}

export const HeroFrontFace: React.FC<HeroFrontFaceProps> = ({
  isFlipped, activeWallpaper, activeDay, splitName, steps, burnKcal, distKm,
  recoveryEnergyScore, stepTarget = 0, goalMove = 0, goalDist = 0,
  onCycleDayDial, onFlipToVitals, onOpenCardio, onOpenReadiness, onOpenSettings, onShowToast,
}) => {
  const systemToday = getSystemTodayCode();
  const isPresentDay = activeDay.toLowerCase() === systemToday.toLowerCase();
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const activeLogs = useWorkoutStore((s) => s.activeLogs);
  const setActiveLogs = useWorkoutStore((s) => s.setActiveLogs);
  const setActiveSession = useWorkoutStore((s) => s.setActiveSession);
  const setActiveRoutine = useWorkoutStore((s) => s.setActiveRoutine);
  const dayRoutine = getAthleteDayRoutine(activeDay as any);
  const activeSplitLabel = formatConciseSplitName(dayRoutine.splitName || splitName);
  const isWorkoutLoaded = activeSession && (activeLogs?.length ?? 0) > 0;

  const handleShortcutLoadWorkout = () => {
    if (!isPresentDay) return;

    if (isWorkoutLoaded) {
      tactileEngine.triggerSelectionBuzz();
      onShowToast?.(`Today's session is already in Active Log.`);
      return;
    }

    if (!dayRoutine.isCustom || !dayRoutine.exercises?.length) {
      tactileEngine.triggerSelectionBuzz();
      onShowToast?.(`No saved ${activeDay} workout yet. Finish a session and save it to this day.`);
      return;
    }

    tactileEngine.playPRCelebration();
    const cleanExercises = dayRoutine.exercises.map((ex: any, i: number) => ({
      ...ex,
      id: `live-${activeDay.toLowerCase()}-${Date.now()}-${i}`,
      sets: (ex.sets || []).map((s: any, sIdx: number) => ({
        ...s,
        id: `s-${Date.now()}-${i}-${sIdx}`,
        completed: false,
      })),
    }));
    setActiveLogs(cleanExercises);
    setActiveSession(true);
    setActiveRoutine(activeSplitLabel);
    onShowToast?.(`${activeDay} routine loaded · ${cleanExercises.length} movements`);
  };

  return (
    <div
      id="hero-front-face"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        pointerEvents: isFlipped ? 'none' : 'auto',
      }}
      className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-2xl overflow-hidden bg-transparent text-white transition-opacity duration-300 ${
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
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            useWallpaperStore.getState().reportBroken(activeWallpaper);
          }}
        />
      )}

      {/* Root Container Structure: Top status dots, Center telemetry, Bottom HeroBottomDock - No dead margins */}
      <div className="relative w-full h-full flex flex-col justify-between p-2.5 pb-2 select-none overflow-hidden z-10">
        {/* Top: Status dots & flip trigger */}
        <HeroHeader
          readinessScore={recoveryEnergyScore}
          onCycleDayDial={onCycleDayDial}
          onOpenReadiness={onOpenReadiness}
          onOpenSettings={onOpenSettings}
        />

        {/* Center: Telemetry reading - Tap dial to cycle through 7 day dials */}
        <div
          role="button"
          tabIndex={0}
          title="Browse day dials"
          onClick={() => onCycleDayDial()}
          className="relative flex-1 flex flex-col items-center justify-center my-auto w-full cursor-pointer select-none active:scale-[0.99] transition-transform"
        >
          <DayAdaptiveDial
            activeDay={activeDay}
            splitLabel={activeSplitLabel}
            dailySteps={steps}
            stepTarget={stepTarget}
            dailyMove={burnKcal}
            goalMove={goalMove}
            dailyDist={Number(distKm) || 0}
            goalDist={goalDist}
          />
        </div>

        {/* Bottom: HeroBottomDock pinned cleanly with zero black background */}
        <HeroBottomDock
          activeDay={activeDay}
          activeSplitLabel={activeSplitLabel}
          isPresentDay={isPresentDay}
          onOpenCardio={onOpenCardio}
          onCycleDayDial={onCycleDayDial}
          onLoadWorkout={handleShortcutLoadWorkout}
          onFlipToVitals={onFlipToVitals}
        />
      </div>
    </div>
  );
};

export default HeroFrontFace;
