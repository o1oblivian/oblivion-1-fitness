import React from 'react';
import { Layers, Dumbbell, Film } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { CoachSubTab } from '../../../stores/useCoachStore';
import { Athlete } from '../services/coachService';
import { COACH_MARKETPLACE_PROGRAMS } from '../data/coachMarketplaceData';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { CoachSubNavBar } from './CoachSubNavBar';

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
  activePerspective: _activePerspective = 'coach',
  onChangePerspective: _onChangePerspective = () => {},
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
    <div className="w-full space-y-2.5">
    <div id="coach-master-header-deck" className="w-full bg-o1-card border border-white/[0.07] text-neutral-100 rounded-2xl p-3 shadow-xl space-y-2.5 select-none transition-colors relative overflow-x-hidden">
      <div className="grid grid-cols-3 gap-2 items-center justify-center max-w-[360px] mx-auto">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenPrograms(); }}
            className="group relative w-[72px] h-[72px] rounded-full bg-o1-well border border-white/[0.07] hover:border-o1-crimson flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Layers size={26} className="text-o1-crimson group-hover:text-o1-crimson-hover transition-colors stroke-[2.2]" />
          </button>
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-100 font-tactical tracking-wider text-center">Programs</span>
          <span className="text-[8px] sm:text-[9px] text-neutral-400 font-telemetry font-semibold">
            {genuineProgramsCount} ACTIVE
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenWorkout(); }}
            className="group relative w-[72px] h-[72px] rounded-full bg-o1-well border border-white/[0.07] hover:border-sky-500 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Dumbbell size={26} className="text-sky-400 group-hover:text-sky-500 transition-colors stroke-[2.2]" />
          </button>
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-100 font-tactical tracking-wider text-center">Workout</span>
          <span className="text-[8px] sm:text-[9px] font-telemetry font-bold text-neutral-400">
            {activeSession ? 'In progress' : 'ready'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenVault?.(); }}
            className="group relative w-[72px] h-[72px] rounded-full bg-o1-well border border-white/[0.07] hover:border-amber-500 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Film size={26} className="text-amber-400 group-hover:text-amber-500 transition-colors stroke-[2.2]" />
          </button>
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-100 font-tactical tracking-wider text-center">Vault</span>
          <span className="text-[8px] sm:text-[9px] text-neutral-400 font-telemetry font-semibold">
            {genuineVaultCount} ASSETS
          </span>
        </div>
      </div>

    </div>
    <CoachSubNavBar currentSubTab={currentSubTab} onSelectSubTab={onSelectSubTab} />
    </div>
  );
};

export default CoachHeaderDeck;
