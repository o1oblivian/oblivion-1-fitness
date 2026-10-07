import React from 'react';
import { X, Award, Dumbbell, Play, ChevronRight, UserCheck, Sparkles, Compass } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useCoachStore } from '../../../stores/useCoachStore';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { SplitOption } from '../types';

interface CoachRoutineDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSplit: SplitOption;
  onNavigateToWorkout: () => void;
  onNavigateToCoach: () => void;
  showToast: (msg: string) => void;
}

export const CoachRoutineDispatchModal: React.FC<CoachRoutineDispatchModalProps> = ({
  isOpen,
  onClose,
  selectedSplit,
  onNavigateToWorkout,
  onNavigateToCoach,
  showToast,
}) => {
  const assignedWorkouts = useCoachStore((s) => s.assignedWorkouts);
  const athletes = useCoachStore((s) => s.athletes);
  const deployProtocol = useWorkoutStore((s) => s.deployProtocol);
  const setActiveSession = useWorkoutStore((s) => s.setActiveSession);

  if (!isOpen) return null;

  const hasDispatchedWorkout = assignedWorkouts && assignedWorkouts.length > 0;
  const activeDispatch = hasDispatchedWorkout ? assignedWorkouts[0] : null;

  // Load coach assigned workout into the live tracker
  const handleLoadCoachWorkout = () => {
    tactileEngine.playPRCelebration();
    if (activeDispatch && activeDispatch.exercises) {
      const convertedExercises = activeDispatch.exercises.map((ex: any, idx: number) => ({
        id: `coach-dispatch-${Date.now()}-${idx}`,
        exerciseName: ex.name || 'Prescribed Movement',
        name: ex.name || 'Prescribed Movement',
        targetMuscle: ex.targetMuscle || 'Compound',
        equipment: 'Barbell',
        tier: 'Coach Directive',
        restSecs: 90,
        sets: [
          { setNumber: 1, targetReps: 8, targetWeightKg: 80, completed: false },
          { setNumber: 2, targetReps: 8, targetWeightKg: 80, completed: false },
          { setNumber: 3, targetReps: 8, targetWeightKg: 80, completed: false },
        ],
      }));

      deployProtocol(convertedExercises as any);
      setActiveSession(true);
      showToast(`⚡ Loaded Coach Protocol: ${activeDispatch.title || 'Assigned Workout'}`);
    } else {
      // Load standard assigned split
      loadFallbackSplit(selectedSplit);
    }

    onClose();
    onNavigateToWorkout();
  };

  const loadFallbackSplit = (split: SplitOption) => {
    tactileEngine.triggerSelectionBuzz();
    const fallbackExMap: Record<SplitOption, any[]> = {
      Push: [
        {
          id: `push-1-${Date.now()}`,
          name: 'Barbell Incline Bench Press',
          exerciseName: 'Barbell Incline Bench Press',
          targetMuscle: 'Chest',
          equipment: 'Barbell',
          tier: 'Compound Prime',
          restSecs: 120,
          sets: [
            { setNumber: 1, targetReps: 8, targetWeightKg: 75, completed: false },
            { setNumber: 2, targetReps: 8, targetWeightKg: 80, completed: false },
            { setNumber: 3, targetReps: 6, targetWeightKg: 85, completed: false },
          ],
        },
        {
          id: `push-2-${Date.now()}`,
          name: 'Standing Overhead Press',
          exerciseName: 'Standing Overhead Press',
          targetMuscle: 'Shoulders',
          equipment: 'Barbell',
          tier: 'Compound Prime',
          restSecs: 90,
          sets: [
            { setNumber: 1, targetReps: 8, targetWeightKg: 50, completed: false },
            { setNumber: 2, targetReps: 8, targetWeightKg: 55, completed: false },
          ],
        },
      ],
      Pull: [
        {
          id: `pull-1-${Date.now()}`,
          name: 'Weighted Pull-Ups',
          exerciseName: 'Weighted Pull-Ups',
          targetMuscle: 'Back',
          equipment: 'Bodyweight',
          tier: 'Compound Prime',
          restSecs: 120,
          sets: [
            { setNumber: 1, targetReps: 6, targetWeightKg: 15, completed: false },
            { setNumber: 2, targetReps: 6, targetWeightKg: 20, completed: false },
          ],
        },
      ],
      Legs: [
        {
          id: `legs-1-${Date.now()}`,
          name: 'Barbell Back Squat',
          exerciseName: 'Barbell Back Squat',
          targetMuscle: 'Quads',
          equipment: 'Barbell',
          tier: 'Compound Prime',
          restSecs: 150,
          sets: [
            { setNumber: 1, targetReps: 6, targetWeightKg: 120, completed: false },
            { setNumber: 2, targetReps: 6, targetWeightKg: 130, completed: false },
          ],
        },
      ],
      Custom: [
        {
          id: `custom-1-${Date.now()}`,
          name: 'Dynamic Functional Movement',
          exerciseName: 'Dynamic Functional Movement',
          targetMuscle: 'Full Body',
          equipment: 'Dumbbell',
          tier: 'Compound Prime',
          restSecs: 90,
          sets: [
            { setNumber: 1, targetReps: 10, targetWeightKg: 24, completed: false },
          ],
        },
      ],
    };

    deployProtocol(fallbackExMap[split]);
    setActiveSession(true);
    showToast(`⚡ Initiated ${split} Protocol in Workout Tracker`);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center justify-center text-o1-crimson">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                Coach Workout Dispatch
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono block">
                Prescribed Performance Protocol
              </span>
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

        {/* Coach Dispatched Workout or No-Coach State */}
        {hasDispatchedWorkout && activeDispatch ? (
          <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                ● Dispatched by Coach
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Target RPE: {activeDispatch.exercises?.[0]?.rpe || 8.5}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-sm text-white">
                {activeDispatch.title || 'Clavicular Hypertrophy Protocol'}
              </h4>
              <p className="text-xs text-neutral-400">
                {activeDispatch.exercises?.length || 4} Prescribed exercises calibrated to your progression.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLoadCoachWorkout}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:opacity-90 active:scale-[0.98] text-neutral-950 font-semibold text-xs tracking-wide flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>LOAD DISPATCHED WORKOUT &amp; START</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-o1-well border border-white/[0.07] space-y-2">
              <div className="flex items-center gap-2 text-neutral-200">
                <UserCheck className="w-4 h-4 text-o1-crimson" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  No Active Coach Workout Dispatched
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                You haven&apos;t been assigned a live workout by a coach yet. You can hire a certified coach on the platform or start your chosen split ({selectedSplit}) directly.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => loadFallbackSplit(selectedSplit)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:opacity-90 active:scale-[0.98] text-neutral-950 font-semibold text-xs tracking-wide flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>START {selectedSplit.toUpperCase()} SPLIT NOW</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onClose();
                  onNavigateToCoach();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-neutral-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/[0.07]"
              >
                <Compass className="w-3.5 h-3.5 text-sky-500" />
                <span>Browse &amp; Hire Coach in Coach Hub</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
