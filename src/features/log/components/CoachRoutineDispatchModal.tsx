import React from 'react';
import { X, Award, Play, ChevronRight, Compass } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useCoachStore } from '../../../stores/useCoachStore';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import {
  getSystemTodayCode,
  saveAthleteDayRoutine,
} from '../../workout/services/dayRoutineService';
import { rememberSession, resolveTodaySession, startTodaySession } from '../todaySession';
import { SplitOption } from '../types';

interface CoachRoutineDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToWorkout: () => void;
  onNavigateToCoach: () => void;
  showToast: (msg: string) => void;
}

const SPLIT_MOVEMENTS: Record<
  Exclude<SplitOption, 'Custom'>,
  { name: string; muscle: string; equipment: string; restSecs: number }[]
> = {
  Push: [
    { name: 'Barbell Incline Bench Press', muscle: 'Chest', equipment: 'Barbell', restSecs: 120 },
    { name: 'Standing Overhead Press', muscle: 'Shoulders', equipment: 'Barbell', restSecs: 90 },
  ],
  Pull: [{ name: 'Weighted Pull-Ups', muscle: 'Back', equipment: 'Bodyweight', restSecs: 120 }],
  Legs: [{ name: 'Barbell Back Squat', muscle: 'Quads', equipment: 'Barbell', restSecs: 150 }],
};

function blankSplit(split: Exclude<SplitOption, 'Custom'>) {
  const stamp = Date.now();
  return SPLIT_MOVEMENTS[split].map((m, i) => ({
    id: `${split.toLowerCase()}-${stamp}-${i}`,
    name: m.name,
    exerciseName: m.name,
    targetMuscle: m.muscle,
    equipment: m.equipment,
    tier: 'Compound Prime',
    restSecs: m.restSecs,
    sets: Array.from({ length: 3 }, (_, s) => ({
      id: `set-${stamp}-${i}-${s}`,
      setNumber: s + 1,
      reps: 0,
      weightKg: 0,
      weight: 0,
      rpe: 0,
      completed: false,
    })),
  }));
}

export const CoachRoutineDispatchModal: React.FC<CoachRoutineDispatchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToWorkout,
  onNavigateToCoach,
  showToast,
}) => {
  useCoachStore((s) => s.assignedWorkouts);
  const deployProtocol = useWorkoutStore((s) => s.deployProtocol);
  const setActiveSession = useWorkoutStore((s) => s.setActiveSession);

  if (!isOpen) return null;

  const session = resolveTodaySession();
  const coachSession = session.origin === 'coach' ? session : null;
  const firstRpe = coachSession?.exercises[0]?.sets?.[0]?.rpe;

  const handleLoadCoachWorkout = () => {
    if (!coachSession) return;
    tactileEngine.playPRCelebration();
    startTodaySession(coachSession);
    showToast(`Loaded ${coachSession.title} from your coach`);
    onClose();
    onNavigateToWorkout();
  };

  const loadSplit = (split: Exclude<SplitOption, 'Custom'>) => {
    tactileEngine.triggerSelectionBuzz();
    const exercises = blankSplit(split);
    saveAthleteDayRoutine(getSystemTodayCode(), split, exercises);
    deployProtocol(exercises);
    setActiveSession(true);
    rememberSession('saved');
    showToast(`${split} is stored for today. Enter your weights as you go.`);
    onClose();
    onNavigateToWorkout();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] w-full p-5 shadow-xl relative space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center justify-center text-o1-crimson">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-wider">Choose a workout</h3>
              <span className="text-o1-label text-neutral-400 block">Stored on this weekday</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {coachSession ? (
          <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-o1-label font-bold tracking-wider">
                ● Sent by your coach
              </span>
              {firstRpe ? (
                <span className="text-o1-label font-mono text-neutral-400">
                  Target RPE: {firstRpe}
                </span>
              ) : null}
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-sm text-white">{coachSession.title}</h4>
              <p className="text-xs text-neutral-400">
                {coachSession.exercises.length}{' '}
                {coachSession.exercises.length === 1 ? 'exercise' : 'exercises'} prescribed by your
                coach.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLoadCoachWorkout}
              className="w-full py-2.5 px-4 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press active:scale-[0.98] text-white font-semibold text-xs tracking-wide flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>LOAD COACH WORKOUT &amp; START</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {(['Push', 'Pull', 'Legs'] as const).map((split) => (
              <button
                key={split}
                type="button"
                onClick={() => loadSplit(split)}
                className="w-full py-2.5 px-4 rounded-xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] text-white font-semibold text-xs flex items-center justify-between transition-all cursor-pointer"
              >
                <span>{split}</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onClose();
                onNavigateToCoach();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-transparent text-neutral-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-neutral-400" />
              <span>Browse programs</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
