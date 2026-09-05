import React, { useState, Suspense, lazy, memo } from 'react';
import { AppMode, DailyMeals, ExerciseLog, SetData } from '../types';
import { RotatingHeroCard } from './RotatingHeroCard';
import { CircularActionRail } from './CircularActionRail';
import { BiometricModal, BiometricType } from './BiometricModal';
import { ArchetypeBlueprint } from '@/data/archetypeBlueprints';

const ArchetypeModal = lazy(() => import('./ArchetypeModal').then(m => ({ default: m.ArchetypeModal })));
const FullEliteReelsModal = lazy(() => import('./FullEliteReelsModal').then(m => ({ default: m.FullEliteReelsModal })));

interface HomeViewProps {
  userName: string;
  currentUserEmail: string;
  profileImage?: string;
  dailyMeals: DailyMeals;
  activeLogs: ExerciseLog[];
  weeklySchedule: Record<string, string>;
  goalCals: number;
  goalP: number;
  goalC: number;
  goalF: number;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onNavigate: (mode: AppMode) => void;
  onOpenCycleSync: () => void;
  onOpenQuickStrike: () => void;
  selectedDay: string;
  onSelectDay: (day: string) => void;
  onOpenScheduleModal: () => void;
  stepTarget: number;
  setStepTarget: (val: number) => void;
  restTimerSecs: number;
  setRestTimerSecs: React.Dispatch<React.SetStateAction<number>>;
  restTimerRunning: boolean;
  onToggleRestTimer: () => void;
  onOpenDial?: (type: string, maxVal: number, currentVal: number, onConfirm: (val: number) => void) => void;
  onOpenCommitModal?: () => void;
  theme: 'dark' | 'light' | 'system';
  onOpenProfile: () => void;
  onUpdateWeeklySchedule?: (newSchedule: Record<string, string>) => void;
  onOpenSupplementTracker: () => void;
  onOpenAlcoholTracker: () => void;
  onOpenHydrationTracker: () => void;
  setActiveLogs: React.Dispatch<React.SetStateAction<ExerciseLog[]>>;
  onNavigateToTandem?: () => void;
  onTapSelf?: () => void;
  handle?: string;
  onUpgrade?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = memo(({
  userName,
  currentUserEmail,
  profileImage,
  dailyMeals,
  weeklySchedule,
  showToast,
  selectedDay,
  onSelectDay,
  stepTarget,
  setStepTarget,
  onOpenDial,
  onOpenProfile,
  onOpenCycleSync,
  onOpenSupplementTracker,
  onOpenAlcoholTracker,
  onOpenHydrationTracker,
  setActiveLogs,
  onNavigateToTandem,
  onTapSelf,
  handle,
  onNavigate,
  onUpgrade,
}) => {
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeBlueprint | null>(null);
  const [isEliteReelsOpen, setIsEliteReelsOpen] = useState(false);
  const [activeBiometricType, setActiveBiometricType] = useState<BiometricType | null>(null);

  const handleArchetypeSelect = (archetype: ArchetypeBlueprint) => {
    setSelectedArchetype(archetype);
  };

  const handleLoadArchetypeExercises = (exerciseNames: string[], sourceName: string) => {
    const newLogs: ExerciseLog[] = exerciseNames.map((name) => {
      const defaultSet: SetData = {
        id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        reps: '10',
        weight: 0,
        rpe: 8,
      };
      return {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        exerciseName: name,
        sets: [defaultSet],
      };
    });

    setActiveLogs((prev) => [...newLogs, ...prev]);
    showToast(`${exerciseNames.length} lifts from ${sourceName} loaded!`, 'success');

    // Smooth scroll down to the training hub section on the same screen
    setTimeout(() => {
      const workoutSection = document.getElementById('solo-workout-section');
      if (workoutSection) {
        workoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  return (
    <div className="space-y-2 tab-enter pb-2">
      <RotatingHeroCard
        currentUserEmail={currentUserEmail}
        profileImage={profileImage}
        weeklySchedule={weeklySchedule}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        stepTarget={stepTarget}
        setStepTarget={setStepTarget}
        showToast={showToast}
        onOpenProfile={onOpenProfile}
        onOpenDial={onOpenDial}
        onOpenCycleSync={onOpenCycleSync}
        onOpenSupplementTracker={onOpenSupplementTracker}
        onOpenAlcoholTracker={onOpenAlcoholTracker}
        onOpenHydrationTracker={onOpenHydrationTracker}
        dailyMeals={dailyMeals}
      />

      {/* Specialized Archetype Workouts Circular Rail with Pin #1 Elite Reels (Reels train under OLED) */}
      <CircularActionRail
        onArchetypeSelect={handleArchetypeSelect}
        onOpenEliteReels={() => setIsEliteReelsOpen(true)}
        showToast={showToast}
      />

      <Suspense fallback={null}>
        {/* Specialized Archetype Workout Modal */}
        {selectedArchetype && (
          <ArchetypeModal
            isOpen={!!selectedArchetype}
            onClose={() => setSelectedArchetype(null)}
            archetype={selectedArchetype}
            onLoadExercises={handleLoadArchetypeExercises}
            showToast={showToast}
            onUpgrade={onUpgrade}
          />
        )}

        {/* Fullscreen Interactive Elite Reels Modal */}
        {isEliteReelsOpen && (
          <FullEliteReelsModal
            isOpen={isEliteReelsOpen}
            onClose={() => setIsEliteReelsOpen(false)}
            showToast={showToast}
          />
        )}

        {/* Biometrics & Physiological Telemetry Inspector */}
        <BiometricModal
          type={activeBiometricType}
          onClose={() => setActiveBiometricType(null)}
        />
      </Suspense>
    </div>
  );
});
