import React from 'react';
import { Weight, Trophy, Leaf } from 'lucide-react';

interface DisciplineSelectorTrackProps {
  selectedDiscipline: 'lift' | 'sports' | 'recovery' | null;
  onPillClick: (d: 'lift' | 'sports' | 'recovery') => void;
}

export const DisciplineSelectorTrack: React.FC<DisciplineSelectorTrackProps> = ({
  selectedDiscipline,
  onPillClick,
}) => {
  return (
    <div className="bg-black border border-white/[0.07] p-1 rounded-full flex items-center justify-between">
      <button
        type="button"
        id="discipline-pill-lift"
        onClick={() => onPillClick('lift')}
        className={
          selectedDiscipline === 'lift'
            ? 'bg-o1-well shadow-xs text-white rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
            : 'text-o1-muted hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
        }
      >
        <Weight className="w-3.5 h-3.5 text-o1-crimson" strokeWidth={1.75} />
        <span>Lift</span>
      </button>
      <button
        type="button"
        id="discipline-pill-sports"
        onClick={() => onPillClick('sports')}
        className={
          selectedDiscipline === 'sports'
            ? 'bg-o1-well shadow-xs text-white rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
            : 'text-o1-muted hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
        }
      >
        <Trophy className="w-3.5 h-3.5 text-o1-emerald-deep" strokeWidth={1.75} />
        <span>Sports</span>
      </button>
      <button
        type="button"
        id="discipline-pill-recovery"
        onClick={() => onPillClick('recovery')}
        className={
          selectedDiscipline === 'recovery'
            ? 'bg-o1-well shadow-xs text-white rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
            : 'text-o1-muted hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer'
        }
      >
        <Leaf className="w-3.5 h-3.5 text-o1-teal" strokeWidth={1.75} />
        <span>Recovery</span>
      </button>
    </div>
  );
};
