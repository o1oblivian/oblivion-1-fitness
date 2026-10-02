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
    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 space-y-2.5 shadow-2xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      {/* Top Header: Index + Exercise Name + Remove */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0 font-mono">
          {index + 1}
        </span>
        <input
          type="text"
          value={exercise.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Barbell Incline Bench Press"
          className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
          title="Remove exercise"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Numerical Matrix: Sets, Reps, Rest */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-xl p-1.5 text-center">
          <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-0.5">
            Sets
          </label>
          <input
            type="number"
            min={1}
            value={exercise.sets}
            onChange={(e) => onChange({ sets: Math.max(1, Number(e.target.value) || 1) })}
            className="w-full bg-transparent text-xs font-bold text-neutral-900 dark:text-white text-center font-mono focus:outline-none"
          />
        </div>
        <div className="bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-xl p-1.5 text-center">
          <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-0.5">
            Reps
          </label>
          <input
            type="text"
            value={exercise.reps}
            onChange={(e) => onChange({ reps: e.target.value })}
            placeholder="8-10"
            className="w-full bg-transparent text-xs font-bold text-neutral-900 dark:text-white text-center font-mono focus:outline-none"
          />
        </div>
        <div className="bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-xl p-1.5 text-center">
          <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-0.5">
            Rest (sec)
          </label>
          <input
            type="number"
            step={15}
            min={0}
            value={exercise.restSeconds}
            onChange={(e) => onChange({ restSeconds: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full bg-transparent text-xs font-bold text-neutral-900 dark:text-white text-center font-mono focus:outline-none"
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
          className="w-full px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
        />
        <input
          type="text"
          value={exercise.demoUrl || ''}
          onChange={(e) => onChange({ demoUrl: e.target.value })}
          placeholder="Video reference / vault media URL (optional)"
          className="w-full px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
        />
      </div>
    </div>
  );
};
