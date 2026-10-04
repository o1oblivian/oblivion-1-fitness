import React, { useState } from 'react';
import { User, Sparkles, Play } from 'lucide-react';
import { ExerciseItem } from '../../../types';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useCoachStore } from '../../../stores/useCoachStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { DEFAULT_DISPATCHED_EXERCISES } from '../data/dispatchedWorkoutsData';

interface CoachProtocolAccordionPanelProps {
  onClose: () => void;
  onDeployProtocol?: (exercises: ExerciseItem[]) => void;
}

export const CoachProtocolAccordionPanel: React.FC<CoachProtocolAccordionPanelProps> = ({
  onClose,
  onDeployProtocol,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenCoachHub = () => {
    tactileEngine.triggerSelectionBuzz();
    useCoachStore.getState().setSelectedSubTab('STORE');
    const coachTab = document.getElementById('nav-tab-coach') || document.getElementById('dock-tab-coach');
    if (coachTab) coachTab.click();
  };

  const handleLoadProtocol = () => {
    setIsLoading(true);
    tactileEngine.playPRCelebration();
    const { setExercises, setActiveSession, setActiveRoutine, setMode } = useWorkoutStore.getState();
    setExercises(DEFAULT_DISPATCHED_EXERCISES);
    setActiveRoutine('Push Day • Chest & Shoulder Overload');
    setActiveSession(true);
    setMode('Lift');

    onDeployProtocol?.(DEFAULT_DISPATCHED_EXERCISES);
    onClose();

    setTimeout(() => {
      const activeEl = document.getElementById('active-log-section') || document.getElementById('active-log-card');
      activeEl?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 text-neutral-900 dark:text-white">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <User className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white leading-tight">
              COACH TRAINING PROTOCOL
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
              Assigned workouts &amp; active programs
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenCoachHub}
          className="text-[10px] font-mono font-bold text-[#C4121A] bg-[#C4121A]/10 border border-[#C4121A]/30 hover:bg-[#C4121A]/20 px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
        >
          COACH HUB
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C4121A] fill-[#C4121A]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              TODAY'S DISPATCHED WORKOUT
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
            ● READY TO LOAD
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                Push Day • Chest &amp; Shoulder Overload
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                Head Coach • 4 exercises
              </p>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleLoadProtocol}
              className="px-4 py-1.5 rounded-full bg-neutral-950 text-white hover:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 active:scale-95 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Load</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-[#242429] text-neutral-800 dark:text-neutral-200 text-xs font-mono font-medium border border-neutral-300/40 dark:border-neutral-700/40">
              Incline Barbell Press (4×8 reps)
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-[#242429] text-neutral-800 dark:text-neutral-200 text-xs font-mono font-medium border border-neutral-300/40 dark:border-neutral-700/40">
              Seated DB Shoulder Press (3×10 reps)
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-[#242429] text-neutral-800 dark:text-neutral-200 text-xs font-mono font-medium border border-neutral-300/40 dark:border-neutral-700/40">
              Cable Lateral Raise (4×12 reps)
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-[#242429] text-neutral-800 dark:text-neutral-200 text-xs font-mono font-medium border border-neutral-300/40 dark:border-neutral-700/40">
              Incline Cable Flye (3×12 reps)
            </div>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 italic font-mono pt-1.5 border-t border-neutral-200/50 dark:border-neutral-800/60 leading-relaxed">
            "[Hypertrophy Focus] Controlled 3s eccentric tempo. Full stretch on each repetition."
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoachProtocolAccordionPanel;
