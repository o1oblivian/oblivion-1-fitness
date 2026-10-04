import React from 'react';
import { Dumbbell, Trophy, Heart } from 'lucide-react';

interface DisciplineSelectorTrackProps {
  selectedDiscipline: 'lift' | 'sports' | 'recovery' | null;
  onPillClick: (d: 'lift' | 'sports' | 'recovery') => void;
}

export const DisciplineSelectorTrack: React.FC<DisciplineSelectorTrackProps> = ({
  selectedDiscipline,
  onPillClick,
}) => {
  return (
    <div className="bg-neutral-100 dark:bg-[#09090b] border border-neutral-200 dark:border-white/10 p-1 rounded-full flex items-center justify-between">
      <button
        type="button"
        id="discipline-pill-lift"
        onClick={() => onPillClick('lift')}
        className={
          selectedDiscipline === 'lift'
            ? 'bg-white dark:bg-[#18181F] shadow-xs text-[#C4121A] dark:text-[#C4121A] rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
        }
      >
        <Dumbbell
          className={`w-3.5 h-3.5 ${selectedDiscipline === 'lift' ? 'text-[#C4121A]' : 'text-neutral-500 dark:text-neutral-400'}`}
        />
        <span>Lift</span>
      </button>
      <button
        type="button"
        id="discipline-pill-sports"
        onClick={() => onPillClick('sports')}
        className={
          selectedDiscipline === 'sports'
            ? 'bg-white dark:bg-[#18181F] shadow-xs text-[#C4121A] dark:text-[#C4121A] rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
        }
      >
        <Trophy
          className={`w-3.5 h-3.5 ${selectedDiscipline === 'sports' ? 'text-[#C4121A]' : 'text-neutral-500 dark:text-neutral-400'}`}
        />
        <span>Sports</span>
      </button>
      <button
        type="button"
        id="discipline-pill-recovery"
        onClick={() => onPillClick('recovery')}
        className={
          selectedDiscipline === 'recovery'
            ? 'bg-white dark:bg-[#18181F] shadow-xs text-sky-600 dark:text-sky-400 rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
        }
      >
        <Heart
          className={`w-3.5 h-3.5 ${selectedDiscipline === 'recovery' ? 'text-sky-600 dark:text-sky-400' : 'text-neutral-500 dark:text-neutral-400'}`}
        />
        <span>Recovery</span>
      </button>
    </div>
  );
};
