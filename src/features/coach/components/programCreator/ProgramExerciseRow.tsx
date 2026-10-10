import React from 'react';
import { Trash2 } from 'lucide-react';
import { ProgramExerciseItem } from './types';

export interface ProgramExerciseRowProps {
  index: number;
  exercise: ProgramExerciseItem;
  onChange: (updated: Partial<ProgramExerciseItem>) => void;
  onRemove: () => void;
}

export const ProgramExerciseRow: React.FC<ProgramExerciseRowProps> = ({
  index,
  exercise,
  onChange,
  onRemove,
}) => {
  return (
    <div className="p-3.5 rounded-2xl bg-o1-surface border border-white/[0.07] space-y-2.5 shadow-2xs transition-all hover:border-white/[0.07]">
      {/* Top Header: Index + Exercise Name + Remove */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-white/[0.08] text-[10px] font-bold flex items-center justify-center text-o1-muted shrink-0 font-mono">
          {index + 1}
        </span>
        <input
          type="text"
          value={exercise.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Barbell Incline Bench Press"
          className="flex-1 px-3 py-1.5 rounded-xl bg-o1-sheet border border-white/[0.07] text-xs font-semibold text-o1-text placeholder:text-o1-muted focus:outline-none focus:border-white transition-colors"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-o1-muted hover:text-red-500 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
          title="Remove exercise"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Numerical Matrix: Sets, Reps, Rest */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-o1-sheet border border-white/[0.07] rounded-xl p-1.5 text-center">
          <label className="text-[9px] font-bold tracking-wider text-o1-muted block mb-0.5">
            Sets
          </label>
          <input
            type="number"
            min={1}
            value={exercise.sets}
            onChange={(e) => onChange({ sets: Math.max(1, Number(e.target.value) || 1) })}
            className="w-full bg-transparent text-xs font-bold text-o1-text text-center font-mono focus:outline-none"
          />
        </div>
        <div className="bg-o1-sheet border border-white/[0.07] rounded-xl p-1.5 text-center">
          <label className="text-[9px] font-bold tracking-wider text-o1-muted block mb-0.5">
            Reps
          </label>
          <input
            type="text"
            value={exercise.reps}
            onChange={(e) => onChange({ reps: e.target.value })}
            placeholder="8-10"
            className="w-full bg-transparent text-xs font-bold text-o1-text text-center font-mono focus:outline-none"
          />
        </div>
        <div className="bg-o1-sheet border border-white/[0.07] rounded-xl p-1.5 text-center">
          <label className="text-[9px] font-bold tracking-wider text-o1-muted block mb-0.5">
            Rest (sec)
          </label>
          <input
            type="number"
            step={15}
            min={0}
            value={exercise.restSeconds}
            onChange={(e) => onChange({ restSeconds: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full bg-transparent text-xs font-bold text-o1-text text-center font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* Biomechanical Cues & Video Reference Links */}
      <div className="space-y-1.5">
        <input
          type="text"
          value={exercise.cue || ''}
          onChange={(e) => onChange({ cue: e.target.value })}
          placeholder="Biomechanical cue / tempo (e.g. 3-sec eccentric, pause at chest)"
          className="w-full px-3 py-1.5 rounded-xl bg-o1-sheet border border-white/[0.07] text-[11px] text-o1-text placeholder:text-o1-muted focus:outline-none focus:border-white transition-colors"
        />
        <input
          type="text"
          value={exercise.demoUrl || ''}
          onChange={(e) => onChange({ demoUrl: e.target.value })}
          placeholder="Video reference / vault media URL (optional)"
          className="w-full px-3 py-1.5 rounded-xl bg-o1-sheet border border-white/[0.07] text-[11px] text-o1-text placeholder:text-o1-muted focus:outline-none focus:border-white transition-colors"
        />
      </div>
    </div>
  );
};
