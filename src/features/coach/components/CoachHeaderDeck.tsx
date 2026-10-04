import React from 'react';
import { Layers, Dumbbell, Film } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { CoachSubTab } from '../../../stores/useCoachStore';
import { Athlete } from '../services/coachService';
import { COACH_MARKETPLACE_PROGRAMS } from '../data/coachMarketplaceData';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { CoachSubNavBar } from './CoachSubNavBar';
import { O1FCoachHeader } from './O1FCoachHeader';

export interface CoachHeaderDeckProps {
  currentSubTab: CoachSubTab;
  onSelectSubTab: (tab: CoachSubTab) => void;
  onOpenPrograms: () => void;
  onOpenWorkout: () => void;
  onOpenVault?: () => void;
  athletes?: Athlete[];
  onSelectAthlete?: (athlete: Athlete) => void;
  activePerspective?: 'coach' | 'athlete';
  onChangePerspective?: (p: 'coach' | 'athlete') => void;
}

export const CoachHeaderDeck: React.FC<CoachHeaderDeckProps> = ({
  currentSubTab,
  onSelectSubTab,
  onOpenPrograms,
  onOpenWorkout,
  onOpenVault,
  activePerspective = 'coach',
  onChangePerspective = () => {},
}) => {
  const activeSession = useWorkoutStore((s) => s.activeSession);

  const genuineProgramsCount = (() => {
    try {
      const stored = localStorage.getItem('o1_coach_custom_programs');
      const custom = stored ? JSON.parse(stored) : [];
      return COACH_MARKETPLACE_PROGRAMS.length + (Array.isArray(custom) ? custom.length : 0);
    } catch {
      return COACH_MARKETPLACE_PROGRAMS.length;
    }
  })();

  const genuineVaultCount = (() => {
    try {
      const stored = localStorage.getItem('o1_coach_exercise_vault_media');
      const media = stored ? JSON.parse(stored) : [];
      return Array.isArray(media) ? media.length : 0;
    } catch {
      return 0;
    }
  })();

  return (
    <div id="coach-master-header-deck" className="w-full bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-3xl p-4 shadow-md dark:shadow-xl space-y-4 select-none transition-colors relative">
      <O1FCoachHeader
        activePerspective={activePerspective}
        onChangePerspective={onChangePerspective}
        isCoach={true}
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4 items-center justify-center max-w-[340px] mx-auto">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenPrograms(); }}
            className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neutral-100 dark:bg-[#1a1a1e] border-2 border-neutral-200 dark:border-neutral-700 hover:border-[#C4121A] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Layers size={22} className="text-[#C4121A] group-hover:text-[#A30F16] transition-colors stroke-[2.2]" />
          </button>
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-900 dark:text-neutral-100 uppercase font-tactical tracking-wider text-center">PROGRAMS</span>
          <span className="text-[8px] sm:text-[9px] text-neutral-500 dark:text-neutral-400 font-telemetry font-semibold">
            {genuineProgramsCount} ACTIVE
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenWorkout(); }}
            className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neutral-100 dark:bg-[#1a1a1e] border-2 border-neutral-200 dark:border-neutral-700 hover:border-sky-500 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Dumbbell size={22} className="text-[#0284c7] dark:text-sky-400 group-hover:text-sky-500 transition-colors stroke-[2.2]" />
          </button>
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-900 dark:text-neutral-100 uppercase font-tactical tracking-wider text-center">WORKOUT</span>
          <span className="text-[8px] sm:text-[9px] font-telemetry font-bold text-neutral-500 dark:text-neutral-400">
            {activeSession ? 'IN PROGRESS' : 'READY'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenVault?.(); }}
            className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neutral-100 dark:bg-[#1a1a1e] border-2 border-neutral-200 dark:border-neutral-700 hover:border-amber-500 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Film size={22} className="text-amber-600 dark:text-amber-400 group-hover:text-amber-500 transition-colors stroke-[2.2]" />
          </button>
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-900 dark:text-neutral-100 uppercase font-tactical tracking-wider text-center">VAULT</span>
          <span className="text-[8px] sm:text-[9px] text-neutral-500 dark:text-neutral-400 font-telemetry font-semibold">
            {genuineVaultCount} ASSETS
          </span>
        </div>
      </div>

      <CoachSubNavBar currentSubTab={currentSubTab} onSelectSubTab={onSelectSubTab} />
    </div>
  );
};

export default CoachHeaderDeck;
